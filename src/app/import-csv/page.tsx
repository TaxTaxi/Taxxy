// src/app/import-// src/app/import-csv/page.tsx
import CSVImport from '../../components/CSVImport'; // Adjust this path to match your actual component location
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import CSV - Taxxy',
  description: 'Import transactions from your bank CSV files',
};

export default function ImportCSVPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CSVImport />
    </div>
  );
}