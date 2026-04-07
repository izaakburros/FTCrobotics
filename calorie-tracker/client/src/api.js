const BASE_URL = '/api';

const getHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// Auth
export const register = (body) =>
  fetch(`${BASE_URL}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const login = (body) =>
  fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

// Users
export const getMe = (token) =>
  fetch(`${BASE_URL}/users/me`, { headers: getHeaders(token) }).then(handleResponse);

export const updateMe = (token, body) =>
  fetch(`${BASE_URL}/users/me`, { method: 'PUT', headers: getHeaders(token), body: JSON.stringify(body) }).then(handleResponse);

// Food Items
export const getFoodItems = (token, search = '') =>
  fetch(`${BASE_URL}/food_items${search ? `?search=${encodeURIComponent(search)}` : ''}`, { headers: getHeaders(token) }).then(handleResponse);

export const createFoodItem = (token, body) =>
  fetch(`${BASE_URL}/food_items`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }).then(handleResponse);

// Meal Logs
export const getMealLogs = (token, date) =>
  fetch(`${BASE_URL}/meal_logs?date=${date}`, { headers: getHeaders(token) }).then(handleResponse);

export const createMealLog = (token, body) =>
  fetch(`${BASE_URL}/meal_logs`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }).then(handleResponse);

export const deleteMealLog = (token, id) =>
  fetch(`${BASE_URL}/meal_logs/${id}`, { method: 'DELETE', headers: getHeaders(token) }).then(handleResponse);

// Logged Food Items
export const updateLoggedFoodItem = (token, id, body) =>
  fetch(`${BASE_URL}/logged_food_items/${id}`, { method: 'PUT', headers: getHeaders(token), body: JSON.stringify(body) }).then(handleResponse);

export const deleteLoggedFoodItem = (token, id) =>
  fetch(`${BASE_URL}/logged_food_items/${id}`, { method: 'DELETE', headers: getHeaders(token) }).then(handleResponse);

// Daily Goals
export const getDailyGoals = (token, date) =>
  fetch(`${BASE_URL}/daily_goals?date=${date}`, { headers: getHeaders(token) }).then(handleResponse);

export const setDailyGoals = (token, body) =>
  fetch(`${BASE_URL}/daily_goals`, { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }).then(handleResponse);

// Summary
export const getSummary = (token, date) =>
  fetch(`${BASE_URL}/summary?date=${date}`, { headers: getHeaders(token) }).then(handleResponse);

// Weekly summary (last 7 days)
export const getWeeklySummary = async (token, endDate) => {
  const results = [];
  const end = new Date(endDate);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    try {
      const summary = await getSummary(token, dateStr);
      results.push(summary);
    } catch {
      results.push({ date: dateStr, intake: { calories: 0, protein: 0, carbs: 0, fat: 0 }, goals: null });
    }
  }
  return results;
};
