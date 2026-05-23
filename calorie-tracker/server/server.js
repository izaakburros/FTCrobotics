require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const foodItemRoutes = require('./routes/foodItems');
const mealLogRoutes = require('./routes/mealLogs');
const loggedFoodItemRoutes = require('./routes/loggedFoodItems');
const dailyGoalRoutes = require('./routes/dailyGoals');
const db = require('./db');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/food_items', foodItemRoutes);
app.use('/api/meal_logs', mealLogRoutes);
app.use('/api/logged_food_items', loggedFoodItemRoutes);
app.use('/api/daily_goals', dailyGoalRoutes);

// GET /api/summary?date=YYYY-MM-DD
app.get('/api/summary', authenticateToken, async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    // Get total nutritional intake for the day
    const intakeResult = await db.query(
      `SELECT
        COALESCE(SUM(ROUND((fi.calories_per_100g * lfi.quantity_grams / 100)::numeric, 2)), 0) AS total_calories,
        COALESCE(SUM(ROUND((fi.protein_per_100g * lfi.quantity_grams / 100)::numeric, 2)), 0) AS total_protein,
        COALESCE(SUM(ROUND((fi.carbs_per_100g * lfi.quantity_grams / 100)::numeric, 2)), 0) AS total_carbs,
        COALESCE(SUM(ROUND((fi.fat_per_100g * lfi.quantity_grams / 100)::numeric, 2)), 0) AS total_fat
       FROM logged_food_items lfi
       JOIN food_items fi ON lfi.food_item_id = fi.id
       JOIN meal_logs ml ON lfi.meal_log_id = ml.id
       WHERE ml.user_id = $1 AND ml.log_date = $2`,
      [req.user.id, date]
    );

    // Get daily goals for the date
    const goalsResult = await db.query(
      `SELECT target_calories, target_protein_g, target_carbs_g, target_fat_g
       FROM daily_goals
       WHERE user_id = $1 AND goal_date = $2`,
      [req.user.id, date]
    );

    const intake = intakeResult.rows[0];
    const goals = goalsResult.rows.length > 0 ? goalsResult.rows[0] : null;

    res.json({
      date,
      intake: {
        calories: parseFloat(intake.total_calories),
        protein: parseFloat(intake.total_protein),
        carbs: parseFloat(intake.total_carbs),
        fat: parseFloat(intake.total_fat),
      },
      goals: goals
        ? {
            calories: parseFloat(goals.target_calories),
            protein: parseFloat(goals.target_protein_g),
            carbs: parseFloat(goals.target_carbs_g),
            fat: parseFloat(goals.target_fat_g),
          }
        : null,
    });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
