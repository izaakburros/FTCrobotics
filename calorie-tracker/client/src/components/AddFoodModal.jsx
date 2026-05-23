import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFoodItems } from '../api';

const AddFoodModal = ({ isOpen, onClose, onAdd, mealType }) => {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [foods, setFoods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [grams, setGrams] = useState(100);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelected(null);
      setGrams(100);
      setError('');
      loadFoods('');
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadFoods(search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadFoods = async (q) => {
    setLoading(true);
    try {
      const data = await getFoodItems(token, q);
      setFoods(data);
    } catch (err) {
      setError('Failed to load foods');
    } finally {
      setLoading(false);
    }
  };

  const preview = selected
    ? {
        calories: ((selected.calories_per_100g * grams) / 100).toFixed(1),
        protein: ((selected.protein_per_100g * grams) / 100).toFixed(1),
        carbs: ((selected.carbs_per_100g * grams) / 100).toFixed(1),
        fat: ((selected.fat_per_100g * grams) / 100).toFixed(1),
      }
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !grams || grams <= 0) return;
    setAdding(true);
    setError('');
    try {
      await onAdd({
        food_item_id: selected.id,
        quantity_grams: parseFloat(grams),
        foodName: selected.name,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add food');
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Food</h2>
            <p className="text-sm text-gray-500 capitalize">{mealType}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search foods..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Food list */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && foods.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No foods found</p>
            </div>
          )}
          {!loading && foods.map((food) => (
            <button
              key={food.id}
              onClick={() => setSelected(selected?.id === food.id ? null : food)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all duration-150 ${
                selected?.id === food.id
                  ? 'bg-indigo-50 border-2 border-indigo-500'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{food.name}</p>
                  {food.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{food.description}</p>
                  )}
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-sm font-semibold text-indigo-600">{food.calories_per_100g} kcal</p>
                  <p className="text-xs text-gray-400">per 100g</p>
                </div>
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="text-xs text-blue-600">P: {food.protein_per_100g}g</span>
                <span className="text-xs text-yellow-600">C: {food.carbs_per_100g}g</span>
                <span className="text-xs text-orange-600">F: {food.fat_per_100g}g</span>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom form */}
        {selected && (
          <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-2xl">
            {preview && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Calories', value: preview.calories, unit: 'kcal', color: 'text-indigo-600' },
                  { label: 'Protein', value: preview.protein, unit: 'g', color: 'text-blue-600' },
                  { label: 'Carbs', value: preview.carbs, unit: 'g', color: 'text-yellow-600' },
                  { label: 'Fat', value: preview.fat, unit: 'g', color: 'text-orange-600' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="bg-white rounded-lg p-2 text-center shadow-sm">
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-400">{unit}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (grams)</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  step="1"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={adding}
                className="btn-primary px-6 py-2 whitespace-nowrap"
              >
                {adding ? 'Adding...' : 'Add Food'}
              </button>
            </form>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFoodModal;
