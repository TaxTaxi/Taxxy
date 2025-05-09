"use client";

const fakeTaxes = {
  year: 2025,
  income: 56000,
  withheld: 7200,
  estimatedOwed: 1800,
  estimatedReturn: 400,
};

export default function TaxesPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tax Summary</h1>

      <div className="bg-white shadow rounded-xl p-6 space-y-4 max-w-xl mx-auto">
        <div className="flex justify-between">
          <span className="text-gray-600">Tax Year:</span>
          <span className="font-semibold text-gray-800">{fakeTaxes.year}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Income:</span>
          <span className="font-semibold text-gray-800">${fakeTaxes.income.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Taxes Withheld:</span>
          <span className="font-semibold text-yellow-600">${fakeTaxes.withheld.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Owed:</span>
          <span className="font-semibold text-red-500">${fakeTaxes.estimatedOwed.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Estimated Return:</span>
          <span className="font-semibold text-green-600">${fakeTaxes.estimatedReturn.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

