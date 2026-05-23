const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/daily_goals?date=YYYY-MM-DD
router.get('/', authenticateToken, async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    const result = await db.query(
      `SELECT id, user_id, goal_date, target_calories, target_protein_g, target_carbs_g, target_fat_g, created_at, updated_at
       FROM daily_goals
       WHERE user_id = $1 AND goal_date = $2`,
      [req.user.id, date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No goals set for this date' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get daily goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/daily_goals — set/update daily goals (upsert)
router.post('/', authenticateToken, async (req, res) => {
  const { goal_date, target_calories, target_protein_g, target_carbs_g, target_fat_g } = req.body;

  if (!goal_date || target_calories === undefined || target_protein_g === undefined || target_carbs_g === undefined || target_fat_g === undefined) {
    return res.status(400).json({ error: 'goal_date, target_calories, target_protein_g, target_carbs_g, and target_fat_g are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO daily_goals (user_id, goal_date, target_calories, target_protein_g, target_carbs_g, target_fat_g)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, goal_date) DO UPDATE SET
         target_calories = EXCLUDED.target_calories,
         target_protein_g = EXCLUDED.target_protein_g,
         target_carbs_g = EXCLUDED.target_carbs_g,
         target_fat_g = EXCLUDED.target_fat_g,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, goal_date, target_calories, target_protein_g, target_carbs_g, target_fat_g, created_at, updated_at`,
      [req.user.id, goal_date, target_calories, target_protein_g, target_carbs_g, target_fat_g]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Set daily goals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
