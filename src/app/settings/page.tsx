export default function SettingsPage() {
    return (
      <main className="min-h-screen bg-gray-100 text-black p-8 space-y-10">
        <h1 className="text-5xl font-bold mb-6">Settings Page ⚙️</h1>
  
        {/* User Settings */}
        <section className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-3xl font-semibold mb-4">User Preferences</h2>
          <ul className="space-y-2">
            <li className="bg-gray-100 p-4 rounded-xl">🔔 Notifications: Enabled</li>
            <li className="bg-gray-100 p-4 rounded-xl">🌎 Region: United States</li>
            <li className="bg-gray-100 p-4 rounded-xl">🧮 Tax Rate: 25%</li>
          </ul>
  
          {/* Edit Settings Button */}
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition-all duration-300">
              Edit Preferences
            </button>
          </div>
        </section>
      </main>
    );
  }
  