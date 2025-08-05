// src/components/CSVImport.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface Transaction {
  date: string;
  description: string;
  amount: number;
}

interface PreviewTransaction {
  date: string;
  description: string;
  amount: number;
  rawRow: string[];
}

interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  debit: string;
  credit: string;
}

interface ImportResults {
  imported: number;
  skipped: number;
  aiClassified: number;
  needsReview: number;
  errors: string[];
}

type Step = 'upload' | 'preview' | 'mapping' | 'importing' | 'complete';

const CSVImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    amount: '',
    debit: '',
    credit: ''
  });
  const [previewData, setPreviewData] = useState<PreviewTransaction[]>([]);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Common bank formats for auto-detection
  const commonFormats = {
    'chase': ['Date', 'Description', 'Amount'],
    'bofa': ['Date', 'Description', 'Amount', 'Running Bal.'],
    'wells_fargo': ['Date', 'Amount', 'Description'],
    'generic_debit_credit': ['Date', 'Description', 'Debit', 'Credit']
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }

    setFile(uploadedFile);
    parseCSV(uploadedFile);
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file appears to be empty or invalid.');
        return;
      }

      // Parse headers
      const headerLine = lines[0];
      const parsedHeaders = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
      setHeaders(parsedHeaders);

      // Parse data rows (first 5 for preview)
      const dataRows: string[][] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
        if (row.length === parsedHeaders.length) {
          dataRows.push(row);
        }
      }
      setCsvData(dataRows);

      // Try to auto-detect column mapping
      autoDetectColumns(parsedHeaders);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const autoDetectColumns = (headers: string[]) => {
    const mapping: ColumnMapping = { date: '', description: '', amount: '', debit: '', credit: '' };
    
    headers.forEach((header) => {
      const headerLower = header.toLowerCase();
      
      // Date detection
      if (headerLower.includes('date') || headerLower.includes('transaction date')) {
        mapping.date = header;
      }
      // Description detection
      else if (headerLower.includes('description') || headerLower.includes('memo') || 
               headerLower.includes('transaction') || headerLower.includes('payee')) {
        mapping.description = header;
      }
      // Amount detection
      else if (headerLower.includes('amount') && !headerLower.includes('running')) {
        mapping.amount = header;
      }
      // Debit detection
      else if (headerLower.includes('debit') || headerLower.includes('withdrawal')) {
        mapping.debit = header;
      }
      // Credit detection
      else if (headerLower.includes('credit') || headerLower.includes('deposit')) {
        mapping.credit = header;
      }
    });

    setColumnMapping(mapping);
  };

  const generatePreview = () => {
    const preview: PreviewTransaction[] = csvData.map((row) => {
      const dateIndex = headers.indexOf(columnMapping.date);
      const descIndex = headers.indexOf(columnMapping.description);
      const amountIndex = headers.indexOf(columnMapping.amount);
      const debitIndex = headers.indexOf(columnMapping.debit);
      const creditIndex = headers.indexOf(columnMapping.credit);

      // Calculate amount
      let amount = 0;
      if (amountIndex >= 0 && row[amountIndex]) {
        amount = parseFloat(row[amountIndex].replace(/[$,]/g, '')) || 0;
      } else if (debitIndex >= 0 && creditIndex >= 0) {
        const debit = parseFloat(row[debitIndex]?.replace(/[$,]/g, '') || '0');
        const credit = parseFloat(row[creditIndex]?.replace(/[$,]/g, '') || '0');
        amount = credit - debit; // Credit is positive, debit makes it negative
      }

      return {
        date: dateIndex >= 0 ? row[dateIndex] : '',
        description: descIndex >= 0 ? row[descIndex] : '',
        amount: amount,
        rawRow: row
      };
    });

    setPreviewData(preview);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setStep('importing');

    try {
      // Read the full CSV file for import
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        const transactions: Transaction[] = [];
        const dateIndex = headers.indexOf(columnMapping.date);
        const descIndex = headers.indexOf(columnMapping.description);
        const amountIndex = headers.indexOf(columnMapping.amount);
        const debitIndex = headers.indexOf(columnMapping.debit);
        const creditIndex = headers.indexOf(columnMapping.credit);

        // Process all rows (skip header)
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
          if (row.length !== headers.length) continue;

          // Calculate amount
          let amount = 0;
          if (amountIndex >= 0 && row[amountIndex]) {
            amount = parseFloat(row[amountIndex].replace(/[$,]/g, '')) || 0;
          } else if (debitIndex >= 0 && creditIndex >= 0) {
            const debit = parseFloat(row[debitIndex]?.replace(/[$,]/g, '') || '0');
            const credit = parseFloat(row[creditIndex]?.replace(/[$,]/g, '') || '0');
            amount = credit - debit;
          }

          if (amount !== 0 && row[dateIndex] && row[descIndex]) {
            transactions.push({
              date: row[dateIndex],
              description: row[descIndex],
              amount: amount
            });
          }
        }

        // Send to API
        const response = await fetch('/api/transactions/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions })
        });

        if (!response.ok) {
          throw new Error('Import failed');
        }

        const result: ImportResults = await response.json();
        setImportResults(result);
        setStep('complete');
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'preview' && Object.values(columnMapping).some(v => v)) {
      generatePreview();
    }
  }, [columnMapping, step]);

  const handleColumnMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isImportDisabled = !columnMapping.date || !columnMapping.description || 
    (!columnMapping.amount && (!columnMapping.debit || !columnMapping.credit));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Transactions from CSV</h1>
          <p className="text-gray-600">Upload your bank CSV file to automatically import and classify your transactions.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {['Upload', 'Preview', 'Import', 'Complete'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                ['upload', 'preview', 'importing', 'complete'].indexOf(step) >= index
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                ['upload', 'preview', 'importing', 'complete'].indexOf(step) >= index
                  ? 'text-blue-600 font-medium' 
                  : 'text-gray-500'
              }`}>
                {stepName}
              </span>
              {index < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-4" />}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your CSV file</h3>
            <p className="text-gray-600 mb-4">
              Export a CSV from your bank and upload it here. We support most major bank formats.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              <FileText className="h-4 w-4 mr-2" />
              Choose CSV File
            </label>
          </div>
        )}

        {/* Preview & Mapping Step */}
        {step === 'preview' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Map Your Columns</h3>
            <p className="text-gray-600 mb-6">
              We've detected your CSV structure. Please verify the column mappings below:
            </p>

            {/* Column Mapping */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Column</label>
                <select
                  value={columnMapping.date}
                  onChange={(e) => handleColumnMappingChange('date', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select date column...</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description Column</label>
                <select
                  value={columnMapping.description}
                  onChange={(e) => handleColumnMappingChange('description', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select description column...</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Column</label>
                <select
                  value={columnMapping.amount}
                  onChange={(e) => handleColumnMappingChange('amount', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select amount column...</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Use this if you have one amount column</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OR: Debit/Credit Columns</label>
                <div className="flex space-x-2">
                  <select
                    value={columnMapping.debit}
                    onChange={(e) => handleColumnMappingChange('debit', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Debit column...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <select
                    value={columnMapping.credit}
                    onChange={(e) => handleColumnMappingChange('credit', e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Credit column...</option>
                    {headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Use these if you have separate debit/credit columns</p>
              </div>
            </div>

            {/* Preview Table */}
            {previewData.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Preview (first 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-sm">{row.date}</td>
                          <td className="px-4 py-2 text-sm">{row.description}</td>
                          <td className={`px-4 py-2 text-sm font-medium ${
                            row.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${Math.abs(row.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={isImportDisabled}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Import Transactions
              </button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Your Transactions</h3>
            <p className="text-gray-600">
              We're importing your transactions and running them through our AI classification system...
            </p>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && importResults && (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{importResults.imported || 0}</div>
                  <div className="text-sm text-gray-600">Transactions Imported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{importResults.aiClassified || 0}</div>
                  <div className="text-sm text-gray-600">AI Classified</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{importResults.needsReview || 0}</div>
                  <div className="text-sm text-gray-600">Need Review</div>
                </div>
              </div>
            </div>
            
            {/* Show errors if any */}
            {importResults.errors && importResults.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <h4 className="text-sm font-medium text-red-800">Import Warnings</h4>
                </div>
                <div className="text-sm text-red-700">
                  {importResults.errors.slice(0, 5).map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                  {importResults.errors.length > 5 && (
                    <div>• ... and {importResults.errors.length - 5} more</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.href = '/transactions'}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Transactions
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImport;