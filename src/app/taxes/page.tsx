// Fake tax data
const estimatedOwed = 1725.00;
const reservedTaxes = 1130.00;
const nextPayment = {
  date: "June 15, 2025",
  amount: 1000.00,
};

export default function TaxesPage() {
  return (
    <main className="min-h-screen bg-gray-100 text-black p-8 space-y-10">
      <h1 className="text-5xl font-bold mb-6">Tax Page 💰</h1>

      {/* Estimated Taxes Owed */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-3xl font-semibold mb-4">Estimated Taxes Owed</h2>
        <p className="text-3xl font-bold text-red-600">
          ${estimatedOwed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </section>

      {/* Reserved for Taxes */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-3xl font-semibold mb-4">Reserved for Taxes</h2>
        <p className="text-3xl font-bold text-green-600">
          ${reservedTaxes.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </section>

      {/* Next Payment Due */}
      <section className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-3xl font-semibold mb-4">Next Payment Due</h2>
        <p className="text-lg">
          {nextPayment.date} — Estimated ${nextPayment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </section>
    </main>
  );
}

  