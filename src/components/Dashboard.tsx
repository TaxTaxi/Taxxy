import IncomeCard from "@/components/IncomeCard";
import TaxReserveCard from "@/components/TaxReserveCard";
import BillsCard from "@/components/BillsCard";
import InsightsCard from "@/components/InsightsCard";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 p-6 space-y-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">Taxxy Dashboard 🧾</h1>
        <p className="text-gray-500">Here's what I’ve handled for you this week</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <IncomeCard />
        <TaxReserveCard />
        <BillsCard />
      </section>

      <section>
        <InsightsCard />
      </section>
    </main>
  );
}
  