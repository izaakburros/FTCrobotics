const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/users/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, first_name, last_name, date_of_birth, gender, height_cm, current_weight_kg, activity_level, target_weight_kg, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/me
router.put('/me', authenticateToken, async (req, res) => {
  const {
    first_name,
    last_name,
    date_of_birth,
    gender,
    height_cm,
    current_weight_kg,
    activity_level,
    target_weight_kg,
    username,
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        date_of_birth = COALESCE($3, date_of_birth),
        gender = COALESCE($4, gender),
        height_cm = COALESCE($5, height_cm),
        current_weight_kg = COALESCE($6, current_weight_kg),
        activity_level = COALESCE($7, activity_level),
        target_weight_kg = COALESCE($8, target_weight_kg),
        username = COALESCE($9, username),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING id, username, email, first_name, last_name, date_of_birth, gender, height_cm, current_weight_kg, activity_level, target_weight_kg, created_at, updated_at`,
      [
        first_name,
        last_name,
        date_of_birth,
        gender,
        height_cm,
        current_weight_kg,
        activity_level,
        target_weight_kg,
        username,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
