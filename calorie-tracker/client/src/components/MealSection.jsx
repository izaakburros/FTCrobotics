import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deleteLoggedFoodItem, deleteMealLog } from '../api';

const mealIcons = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

const MealSection = ({ mealType, mealLogs, onAddFood, onRefresh }) => {
  const { token } = useAuth();
  const [deleting, setDeleting] = useState(null);

  // Aggregate all foods from all meal logs for this meal type
  const allFoods = mealLogs.flatMap((log) =>
    log.foods.map((food) => ({ ...food, meal_log_id: log.id }))
  );

  const totalCalories = allFoods.reduce((sum, f) => sum + parseFloat(f.total_calories || 0), 0);

  const handleDeleteFood = async (loggedFoodItemId) => {
    setDeleting(loggedFoodItemId);
    try {
      await deleteLoggedFoodItem(token, loggedFoodItemId);
      await onRefresh();
    } catch (err) {
      alert('Failed to delete food item');
    } finally {
      setDeleting(null);
    }
  };

  const label = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  const icon = mealIcons[mealType] || '🍽️';

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          {allFoods.length > 0 && (
            <span className="text-sm text-indigo-600 font-medium">
              {Math.round(totalCalories)} kcal
            </span>
          )}
        </div>
        <button
          onClick={() => onAddFood(mealType)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Food
        </button>
      </div>

      {allFoods.length === 0 ? (
        <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm">No foods logged yet</p>
          <p className="text-xs mt-1">Click "Add Food" to log your {label.toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allFoods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-gray-900 truncate">{food.name}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{food.quantity_grams}g</span>
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs font-semibold text-indigo-600">
                    {Math.round(parseFloat(food.total_calories))} kcal
                  </span>
                  <span className="text-xs text-blue-500">P: {parseFloat(food.total_protein).toFixed(1)}g</span>
                  <span className="text-xs text-yellow-600">C: {parseFloat(food.total_carbs).toFixed(1)}g</span>
                  <span className="text-xs text-orange-500">F: {parseFloat(food.total_fat).toFixed(1)}g</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteFood(food.id)}
                disabled={deleting === food.id}
                className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 opacity-0 group-hover:opacity-100"
                title="Remove food"
              >
                {deleting === food.id ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MealSection;
