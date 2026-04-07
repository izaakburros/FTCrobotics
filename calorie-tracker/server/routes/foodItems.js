const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/food_items?search=query
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let queryText;
    let queryParams;

    if (search && search.trim()) {
      queryText = `
        SELECT id, name, description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugar_per_100g, fiber_per_100g, is_custom, created_by_user_id
        FROM food_items
        WHERE name ILIKE $1 OR description ILIKE $1
        ORDER BY is_custom ASC, name ASC
        LIMIT 50
      `;
      queryParams = [`%${search.trim()}%`];
    } else {
      queryText = `
        SELECT id, name, description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugar_per_100g, fiber_per_100g, is_custom, created_by_user_id
        FROM food_items
        ORDER BY is_custom ASC, name ASC
        LIMIT 100
      `;
      queryParams = [];
    }

    const result = await db.query(queryText, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Get food items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/food_items — create custom food item (auth required)
router.post('/', authenticateToken, async (req, res) => {
  const {
    name,
    description,
    calories_per_100g,
    protein_per_100g,
    carbs_per_100g,
    fat_per_100g,
    sugar_per_100g,
    fiber_per_100g,
  } = req.body;

  if (!name || calories_per_100g === undefined || protein_per_100g === undefined || carbs_per_100g === undefined || fat_per_100g === undefined) {
    return res.status(400).json({ error: 'Name, calories, protein, carbs, and fat are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO food_items (name, description, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugar_per_100g, fiber_per_100g, is_custom, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)
       RETURNING *`,
      [
        name,
        description || null,
        calories_per_100g,
        protein_per_100g,
        carbs_per_100g,
        fat_per_100g,
        sugar_per_100g || null,
        fiber_per_100g || null,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create food item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
