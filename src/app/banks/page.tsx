// Fake linked bank accounts
const linkedAccounts = [
    { name: "🏦 Chase Checking", type: "Personal", balance: "$4,250.00" },
    { name: "🏦 Stripe Payouts", type: "Business", balance: "$1,150.00" },
    { name: "🏦 Wells Fargo Savings", type: "Savings", balance: "$3,900.00" },
  ];
  
  export default function BanksPage() {
    return (
      <main className="min-h-screen bg-gray-100 text-black p-8 space-y-10">
        <h1 className="text-5xl font-bold mb-6">Bank Accounts Page 🔗</h1>
  
        {/* Linked Accounts */}
        <section className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-3xl font-semibold mb-4">Linked Accounts</h2>
          <ul className="space-y-2">
            {linkedAccounts.map((account, index) => (
              <li
                key={index}
                className="bg-gray-100 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold">{account.name}</div>
                  <div className="text-sm text-gray-600">{account.type} Account</div>
                </div>
                <div className="text-right font-bold">{account.balance}</div>
              </li>
            ))}
          </ul>
  
          {/* Link New Account Button */}
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition-all duration-300"
            >
              + Link New Account
            </button>
          </div>
        </section>
      </main>
    );
  }
  