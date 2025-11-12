'use client';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-8">Welcome to your research dashboard</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition">
            <h3 className="text-lg font-semibold mb-2">Total Searches</h3>
            <p className="text-3xl font-bold text-blue-400">0</p>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition">
            <h3 className="text-lg font-semibold mb-2">Papers Saved</h3>
            <p className="text-3xl font-bold text-green-400">0</p>
          </div>

          {/* Insights Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition">
            <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
            <p className="text-3xl font-bold text-purple-400">0</p>
          </div>
        </div>

        <div className="mt-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <p className="text-gray-300 mb-4">
            Use the research engine to search papers from multiple academic sources.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-medium transition"
          >
            Go to Research Engine
          </a>
        </div>
      </div>
    </div>
  );
}
