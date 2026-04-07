import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWeeklySummary } from '../api';

const today = () => new Date().toISOString().split('T')[0];

const Progress = () => {
  const { token } = useAuth();
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [endDate, setEndDate] = useState(today());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getWeeklySummary(token, endDate);
        setWeekData(data);
      } catch (err) {
        setError('Failed to load weekly data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, endDate]);

  const maxCalories = Math.max(...weekData.map((d) => d.intake?.calories || 0), 1);
  const avgCalories = weekData.length
    ? Math.round(weekData.reduce((sum, d) => sum + (d.intake?.calories || 0), 0) / weekData.length)
    : 0;
  const totalCalories = Math.round(weekData.reduce((sum, d) => sum + (d.intake?.calories || 0), 0));
  const daysWithData = weekData.filter((d) => (d.intake?.calories || 0) > 0).length;

  const goalCalories = weekData.find((d) => d.goals)?.goals?.calories || null;

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatShort = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getBarColor = (kcal, goal) => {
    if (!goal || kcal === 0) return 'bg-gray-200';
    const pct = kcal / goal;
    if (pct < 0.85) return 'bg-green-500';
    if (pct <= 1.05) return 'bg-yellow-400';
    return 'bg-red-500';
  };

  const prevWeek = () => {
    const d = new Date(endDate + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    setEndDate(d.toISOString().split('T')[0]);
  };

  const nextWeek = () => {
    const d = new Date(endDate + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    const next = d.toISOString().split('T')[0];
    if (next <= today()) setEndDate(next);
  };

  const isCurrentWeek = endDate === today();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <p className="text-gray-500 text-sm mt-0.5">Weekly calorie overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
            {isCurrentWeek ? 'This Week' : 'Past Week'}
          </span>
          <button onClick={nextWeek} disabled={isCurrentWeek} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card text-center">
              <p className="text-2xl font-bold text-indigo-600">{avgCalories}</p>
              <p className="text-sm text-gray-500 mt-1">Avg kcal/day</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-indigo-600">{totalCalories.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total kcal</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-indigo-600">{daysWithData}/7</p>
              <p className="text-sm text-gray-500 mt-1">Days logged</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="card mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Daily Calories</h2>

            {goalCalories && (
              <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-indigo-400" />
                <span>Goal: {Math.round(goalCalories)} kcal</span>
              </div>
            )}

            <div className="flex items-end gap-2 h-48 mt-2">
              {weekData.map((day, i) => {
                const kcal = day.intake?.calories || 0;
                const barHeight = maxCalories > 0 ? (kcal / (maxCalories * 1.1)) * 100 : 0;
                const barColor = getBarColor(kcal, goalCalories);

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-600 font-medium">
                      {kcal > 0 ? Math.round(kcal) : ''}
                    </span>
                    <div className="w-full relative flex items-end" style={{ height: '160px' }}>
                      {goalCalories && (
                        <div
                          className="absolute w-full border-t-2 border-dashed border-indigo-300 opacity-60"
                          style={{ bottom: `${(goalCalories / (maxCalories * 1.1)) * 100}%` }}
                        />
                      )}
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${barColor} ${kcal === 0 ? 'opacity-30' : ''}`}
                        style={{ height: `${Math.max(barHeight, kcal > 0 ? 2 : 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{formatShort(day.date)}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 flex-wrap">
              {[
                { color: 'bg-green-500', label: 'Under goal' },
                { color: 'bg-yellow-400', label: 'Near goal' },
                { color: 'bg-red-500', label: 'Over goal' },
                { color: 'bg-gray-200', label: 'No data' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily detail table */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Daily Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-4 text-gray-500 font-medium">Date</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">Calories</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium hidden sm:table-cell">Protein</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium hidden sm:table-cell">Carbs</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium hidden sm:table-cell">Fat</th>
                    <th className="text-right py-2 pl-2 text-gray-500 font-medium">vs Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((day) => {
                    const kcal = day.intake?.calories || 0;
                    const goal = day.goals?.calories;
                    const diff = goal ? Math.round(kcal - goal) : null;
                    return (
                      <tr key={day.date} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4 text-gray-700">{formatDate(day.date)}</td>
                        <td className="py-3 px-2 text-right font-medium text-gray-900">
                          {kcal > 0 ? Math.round(kcal) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600 hidden sm:table-cell">
                          {day.intake?.protein > 0 ? `${Math.round(day.intake.protein)}g` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600 hidden sm:table-cell">
                          {day.intake?.carbs > 0 ? `${Math.round(day.intake.carbs)}g` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-2 text-right text-gray-600 hidden sm:table-cell">
                          {day.intake?.fat > 0 ? `${Math.round(day.intake.fat)}g` : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          {diff !== null && kcal > 0 ? (
                            <span className={`font-medium ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;
