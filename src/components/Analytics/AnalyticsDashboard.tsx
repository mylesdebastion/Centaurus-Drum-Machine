import { BarChart3, Download, TrendingUp, Users, Eye } from 'lucide-react';
import { getPersonaStats, getReferralStats, downloadAnalyticsCSV } from '@/utils/referralTracking';
import { getPersonaConfig } from '@/utils/personaCodes';

/**
 * AnalyticsDashboard - Epic 22 Story 22.3
 *
 * Displays persona and referral attribution statistics
 * Shows conversion rates, completion rates, and share rates
 * Exports CSV for weekly analysis
 */
export function AnalyticsDashboard() {
  const personaStats = getPersonaStats();
  const referralStats = getReferralStats();

  const totalVisits = personaStats.reduce((sum, p) => sum + p.visits, 0);
  const totalCompletions = personaStats.reduce((sum, p) => sum + p.tutorialCompletions, 0);
  const avgCompletionRate =
    personaStats.length > 0
      ? personaStats.reduce((sum, p) => sum + p.completionRate, 0) / personaStats.length
      : 0;
  const avgShareRate =
    personaStats.length > 0
      ? personaStats.reduce((sum, p) => sum + p.shareRate, 0) / personaStats.length
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary-400" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-400">
                Persona performance and referral attribution (Epic 22)
              </p>
            </div>
            <button
              onClick={downloadAnalyticsCSV}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm font-medium">Total Visits</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalVisits}</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm font-medium">Completions</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalCompletions}</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm font-medium">Avg Completion Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {(avgCompletionRate * 100).toFixed(0)}%
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <span className="text-gray-400 text-sm font-medium">Avg Share Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {(avgShareRate * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Persona Performance */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Persona Performance</h2>
          {personaStats.length > 0 ? (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left p-4 text-gray-300 font-semibold">Persona</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Visits</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Starts</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Completions</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Completion %</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Shares</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {personaStats.map((stats) => {
                    const persona = getPersonaConfig(stats.persona);
                    return (
                      <tr key={stats.persona} className="border-t border-gray-700 hover:bg-gray-700/30">
                        <td className="p-4 text-white font-medium">
                          {persona.emoji} {persona.title}
                        </td>
                        <td className="p-4 text-right text-gray-300">{stats.visits}</td>
                        <td className="p-4 text-right text-gray-300">{stats.tutorialStarts}</td>
                        <td className="p-4 text-right text-gray-300">{stats.tutorialCompletions}</td>
                        <td className="p-4 text-right text-gray-300">
                          <span
                            className={`${stats.completionRate >= 0.6 ? 'text-green-400' : 'text-yellow-400'} font-semibold`}
                          >
                            {(stats.completionRate * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-4 text-right text-gray-300">{stats.shareClicks}</td>
                        <td className="p-4 text-right text-gray-300">
                          <span
                            className={`${stats.shareRate >= 0.4 ? 'text-green-400' : 'text-yellow-400'} font-semibold`}
                          >
                            {(stats.shareRate * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">No persona data yet. Start tracking visits by sharing persona URLs!</p>
            </div>
          )}
        </div>

        {/* Referral Attribution */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Referral Attribution</h2>
          {referralStats.length > 0 ? (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="text-left p-4 text-gray-300 font-semibold">Referral Code</th>
                    <th className="text-left p-4 text-gray-300 font-semibold">Persona</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Visits</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Completions</th>
                    <th className="text-right p-4 text-gray-300 font-semibold">Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {referralStats.map((stats) => {
                    const persona = stats.persona ? getPersonaConfig(stats.persona) : null;
                    return (
                      <tr key={stats.referral} className="border-t border-gray-700 hover:bg-gray-700/30">
                        <td className="p-4 text-white font-mono">{stats.referral}</td>
                        <td className="p-4 text-gray-300">
                          {persona ? `${persona.emoji} ${persona.title}` : '—'}
                        </td>
                        <td className="p-4 text-right text-gray-300">{stats.visits}</td>
                        <td className="p-4 text-right text-gray-300">{stats.tutorialCompletions}</td>
                        <td className="p-4 text-right text-gray-300">
                          <span
                            className={`${stats.conversionRate >= 0.3 ? 'text-green-400' : 'text-yellow-400'} font-semibold`}
                          >
                            {(stats.conversionRate * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">No referral data yet. Share URLs with referral codes (?r=hash) to track attribution!</p>
            </div>
          )}
        </div>

        {/* Insights */}
        {personaStats.length > 0 && (
          <div className="bg-gradient-to-br from-primary-900/30 to-accent-900/30 rounded-lg border border-primary-500/30 p-6">
            <h3 className="text-xl font-bold text-white mb-4">💡 Insights</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              {personaStats.map((stats) => {
                const persona = getPersonaConfig(stats.persona);
                if (stats.completionRate >= 0.6 && stats.shareRate >= 0.4) {
                  return (
                    <li key={stats.persona}>
                      ✅ <strong>{persona.title}</strong> is performing well! (
                      {(stats.completionRate * 100).toFixed(0)}% completion,{' '}
                      {(stats.shareRate * 100).toFixed(0)}% share rate)
                    </li>
                  );
                }
                if (stats.completionRate < 0.3) {
                  return (
                    <li key={stats.persona}>
                      ⚠️ <strong>{persona.title}</strong> has low completion rate (
                      {(stats.completionRate * 100).toFixed(0)}%) - consider simplifying the tutorial
                    </li>
                  );
                }
                return null;
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
