import Summary from "@/components/summary";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <div className="p-6 space-y-6">
      <Summary />
      <Dashboard />
    </div>
  );
}
