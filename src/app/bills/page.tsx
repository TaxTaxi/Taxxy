const upcomingBills = [
    { name: "🏠 Rent", amount: "$1200", due: "Apr 28" },
    { name: "⚡ Electricity", amount: "$92", due: "Apr 30" },
    { name: "📶 Internet", amount: "$60", due: "May 1" },
    { name: "💧 Water", amount: "$35", due: "May 2" },
  ];
  
  const pastBills = [
    { name: "🏠 Rent", paid: "Apr 1" },
    { name: "📶 Internet", paid: "Mar 25" },
    { name: "📺 Cable", paid: "Mar 20" },
  ];
  
  export default function BillsPage() {
    return (
      <main className="min-h-screen bg-gray-100 text-black p-8 space-y-10">
        <h1 className="text-5xl font-bold mb-6">Bills Page 🔔</h1>
  
        {/* Upcoming Bills */}
        <section>
          <h2 className="text-3xl font-semibold mb-4"
          >Upcoming Bills</h2>
          <ul className="space-y-2">
            {upcomingBills.map((bill, index) => (
              <li
                key={index}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <span>{bill.name}</span>
                <span>{bill.amount} — Due {bill.due}</span>
              </li>
            ))}
          </ul>
  
          {/* Add Bill Button */}
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition-all duration-300">
              + Add New Bill
            </button>
          </div>
        </section>
  
        {/* Past Bills */}
        <section>
          <h2 className="text-3xl font-semibold mb-4">Past Bills</h2>
          <ul className="space-y-2">
            {pastBills.map((bill, index) => (
              <li key={index} className="bg-gray-200 p-4 rounded-xl">
                {bill.name} — Paid {bill.paid}
              </li>
            ))}
          </ul>
        </section>
      </main>
    );
  }
  