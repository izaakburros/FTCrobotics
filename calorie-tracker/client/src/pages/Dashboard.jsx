import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMealLogs, getSummary, createMealLog } from '../api';
import ProgressBar from '../components/ProgressBar';
import MealSection from '../components/MealSection';
import AddFoodModal from '../components/AddFoodModal';

const today = () => new Date().toISOString().split('T')[0];

const Dashboard = () => {
  const { token, user } = useAuth();
  const [date, setDate] = useState(today());
  const [mealLogs, setMealLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState('breakfast');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [logs, sum] = await Promise.all([
        getMealLogs(token, date),
        getSummary(token, date),
      ]);
      setMealLogs(logs);
      setSummary(sum);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token, date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMealLogsForType = (mealType) =>
    mealLogs.filter((log) => log.meal_type === mealType);

  const handleAddFood = (mealType) => {
    setActiveMealType(mealType);
    setModalOpen(true);
  };

  const handleFoodAdd = async ({ food_item_id, quantity_grams }) => {
    await createMealLog(token, {
      meal_type: activeMealType,
      log_date: date,
      foods: [{ food_item_id, quantity_grams }],
    });
    await loadData();
  };

  const intake = summary?.intake || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const goals = summary?.goals || null;
  const defaultGoals = { calories: 2000, protein: 150, carbs: 250, fat: 65 };
  const effectiveGoals = goals || defaultGoals;

  const remaining = effectiveGoals.calories - intake.calories;
  const remainingColor = remaining >= 0 ? 'text-green-600' : 'text-red-600';

  const formatDate = (d) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const isToday = date === today();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isToday ? "Today's Log" : formatDate(date)}
          </h1>
          {user?.first_name && (
            <p className="text-gray-500 text-sm mt-0.5">Good {getGreeting()}, {user.first_name}!</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today()}
            className="input-field text-sm py-1.5 w-auto"
          />
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
          <button onClick={loadData} className="ml-2 underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="card mb-6 shadow-sm">
            {!goals && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Using default goals. <a href="/goals" className="underline font-medium">Set your goals</a> for personalized tracking.
              </div>
            )}

            {/* Calorie main progress */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {Math.round(intake.calories)} <span className="text-base font-normal text-gray-500">kcal consumed</span>
                </h2>
                <p className={`text-sm font-medium ${remainingColor}`}>
                  {remaining >= 0
                    ? `${Math.round(remaining)} kcal remaining`
                    : `${Math.round(Math.abs(remaining))} kcal over goal`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">{Math.round(effectiveGoals.calories)}</p>
                <p className="text-xs text-gray-500">daily goal</p>
              </div>
            </div>

            <ProgressBar
              value={intake.calories}
              max={effectiveGoals.calories}
              showValues={false}
            />

            {/* Macros */}
            <div className="grid grid-cols-3 gap-4 mt-5">
              <div>
                <ProgressBar
                  value={intake.protein}
                  max={effectiveGoals.protein}
                  label="Protein"
                  colorScheme="protein"
                />
              </div>
              <div>
                <ProgressBar
                  value={intake.carbs}
                  max={effectiveGoals.carbs}
                  label="Carbs"
                  colorScheme="carbs"
                />
              </div>
              <div>
                <ProgressBar
                  value={intake.fat}
                  max={effectiveGoals.fat}
                  label="Fat"
                  colorScheme="fat"
                />
              </div>
            </div>
          </div>

          {/* Meal Sections */}
          <div className="space-y-4">
            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
              <MealSection
                key={mealType}
                mealType={mealType}
                mealLogs={getMealLogsForType(mealType)}
                onAddFood={handleAddFood}
                onRefresh={loadData}
              />
            ))}
          </div>
        </>
      )}

      <AddFoodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleFoodAdd}
        mealType={activeMealType}
      />
    </div>
  );

  function changeDate(delta) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const newDate = d.toISOString().split('T')[0];
    if (newDate <= today()) setDate(newDate);
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }
};

export default Dashboard;
