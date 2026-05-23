import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDailyGoals, setDailyGoals, getMe, updateMe } from '../api';

const activityMultipliers = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const today = () => new Date().toISOString().split('T')[0];

const Goals = () => {
  const { token, user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState({
    target_calories: 2000,
    target_protein_g: 150,
    target_carbs_g: 250,
    target_fat_g: 65,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [calculated, setCalculated] = useState(null);
  const [date] = useState(today());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [me] = await Promise.all([getMe(token)]);
        setProfile(me);
        try {
          const savedGoals = await getDailyGoals(token, date);
          setGoals({
            target_calories: parseFloat(savedGoals.target_calories),
            target_protein_g: parseFloat(savedGoals.target_protein_g),
            target_carbs_g: parseFloat(savedGoals.target_carbs_g),
            target_fat_g: parseFloat(savedGoals.target_fat_g),
          });
        } catch {
          // No goals set yet — use defaults
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, date]);

  const calculateTDEE = () => {
    if (!profile) return;
    const { height_cm, current_weight_kg, date_of_birth, gender, activity_level } = profile;
    if (!height_cm || !current_weight_kg || !date_of_birth || !gender || !activity_level) {
      setError('Please complete your profile (height, weight, date of birth, gender, activity level) to auto-calculate.');
      return;
    }

    const age = Math.floor((Date.now() - new Date(date_of_birth)) / (365.25 * 24 * 3600 * 1000));
    let bmr;
    if (gender === 'male') {
      bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      bmr = 10 * current_weight_kg + 6.25 * height_cm - 5 * age - 161;
    }
    const multiplier = activityMultipliers[activity_level] || 1.2;
    const tdee = Math.round(bmr * multiplier);

    // Standard macro split: 30% protein, 40% carbs, 30% fat
    const proteinCals = tdee * 0.30;
    const carbsCals = tdee * 0.40;
    const fatCals = tdee * 0.30;

    const calc = {
      calories: tdee,
      protein: Math.round(proteinCals / 4),
      carbs: Math.round(carbsCals / 4),
      fat: Math.round(fatCals / 9),
      bmr: Math.round(bmr),
    };
    setCalculated(calc);
    setError('');
  };

  const applyCalculated = () => {
    if (!calculated) return;
    setGoals({
      target_calories: calculated.calories,
      target_protein_g: calculated.protein,
      target_carbs_g: calculated.carbs,
      target_fat_g: calculated.fat,
    });
    setCalculated(null);
  };

  const handleChange = (e) => {
    setGoals({ ...goals, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await setDailyGoals(token, { goal_date: date, ...goals });
      setSuccess('Goals saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Goals</h1>
      <p className="text-gray-500 text-sm mb-6">Set your nutrition targets for today</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Auto-calculate card */}
      <div className="card mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Auto-Calculate from Profile</h2>
        <p className="text-sm text-gray-500 mb-4">
          Uses the Mifflin-St Jeor equation to estimate your daily calorie needs based on your profile.
        </p>
        <button
          type="button"
          onClick={calculateTDEE}
          className="btn-primary text-sm"
        >
          Calculate TDEE
        </button>

        {calculated && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-gray-900">Estimated TDEE</p>
                <p className="text-xs text-gray-500">BMR: {calculated.bmr} kcal/day</p>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{calculated.calories} kcal</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center bg-blue-50 rounded-lg p-2">
                <p className="text-lg font-bold text-blue-600">{calculated.protein}g</p>
                <p className="text-xs text-gray-500">Protein</p>
              </div>
              <div className="text-center bg-yellow-50 rounded-lg p-2">
                <p className="text-lg font-bold text-yellow-600">{calculated.carbs}g</p>
                <p className="text-xs text-gray-500">Carbs</p>
              </div>
              <div className="text-center bg-orange-50 rounded-lg p-2">
                <p className="text-lg font-bold text-orange-600">{calculated.fat}g</p>
                <p className="text-xs text-gray-500">Fat</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Macro split: 30% protein, 40% carbs, 30% fat</p>
            <button
              type="button"
              onClick={applyCalculated}
              className="btn-primary text-sm w-full"
            >
              Apply These Goals
            </button>
          </div>
        )}
      </div>

      {/* Manual goals form */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Set Goals Manually</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Calories (kcal)
            </label>
            <input
              type="number"
              name="target_calories"
              value={goals.target_calories}
              onChange={handleChange}
              className="input-field"
              min="500"
              max="10000"
              step="10"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Recommended: 1500-2500 for most adults</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Protein (g)
            </label>
            <input
              type="number"
              name="target_protein_g"
              value={goals.target_protein_g}
              onChange={handleChange}
              className="input-field"
              min="0"
              max="500"
              step="1"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {Math.round(goals.target_protein_g * 4)} kcal from protein
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carbohydrates (g)
            </label>
            <input
              type="number"
              name="target_carbs_g"
              value={goals.target_carbs_g}
              onChange={handleChange}
              className="input-field"
              min="0"
              max="1000"
              step="1"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {Math.round(goals.target_carbs_g * 4)} kcal from carbs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fat (g)
            </label>
            <input
              type="number"
              name="target_fat_g"
              value={goals.target_fat_g}
              onChange={handleChange}
              className="input-field"
              min="0"
              max="500"
              step="1"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Estimated: {Math.round(goals.target_fat_g * 9)} kcal from fat
            </p>
          </div>

          {/* Total macro check */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total from macros:</span>
              <span className={`font-semibold ${
                Math.abs(goals.target_protein_g * 4 + goals.target_carbs_g * 4 + goals.target_fat_g * 9 - goals.target_calories) > 50
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}>
                {Math.round(goals.target_protein_g * 4 + goals.target_carbs_g * 4 + goals.target_fat_g * 9)} kcal
              </span>
            </div>
            {Math.abs(goals.target_protein_g * 4 + goals.target_carbs_g * 4 + goals.target_fat_g * 9 - goals.target_calories) > 50 && (
              <p className="text-amber-600 text-xs mt-1">
                Tip: Macro calories don't match your calorie goal. Consider adjusting.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary py-2.5"
          >
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Goals;
