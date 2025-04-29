export default function BillsCard() {
    return (
      <div className="bg-white shadow rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-2">🔔 Upcoming Bills</h2>
        <ul className="text-sm space-y-1">
          <li>🏠 Rent – <strong>$1,200</strong> – due Apr 28</li>
          <li>⚡ Electricity – <strong>$92</strong> – due Apr 30</li>
          <li>📶 Internet – <strong>$60</strong> – due May 1</li>
        </ul>
      </div>
    );
  }