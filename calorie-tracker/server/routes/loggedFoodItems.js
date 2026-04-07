const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// PUT /api/logged_food_items/:id — update quantity
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { quantity_grams } = req.body;

  if (!quantity_grams || quantity_grams <= 0) {
    return res.status(400).json({ error: 'quantity_grams must be a positive number' });
  }

  try {
    // Verify the logged food item belongs to the user via meal_log
    const checkResult = await db.query(
      `SELECT lfi.id
       FROM logged_food_items lfi
       JOIN meal_logs ml ON lfi.meal_log_id = ml.id
       WHERE lfi.id = $1 AND ml.user_id = $2`,
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Logged food item not found' });
    }

    const result = await db.query(
      `UPDATE logged_food_items SET quantity_grams = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, meal_log_id, food_item_id, quantity_grams`,
      [quantity_grams, id]
    );

    // Fetch full data with nutritional info
    const fullResult = await db.query(
      `SELECT
        lfi.id,
        lfi.food_item_id,
        lfi.quantity_grams,
        fi.name,
        fi.calories_per_100g,
        fi.protein_per_100g,
        fi.carbs_per_100g,
        fi.fat_per_100g,
        ROUND((fi.calories_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_calories,
        ROUND((fi.protein_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_protein,
        ROUND((fi.carbs_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_carbs,
        ROUND((fi.fat_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_fat
       FROM logged_food_items lfi
       JOIN food_items fi ON lfi.food_item_id = fi.id
       WHERE lfi.id = $1`,
      [id]
    );

    res.json(fullResult.rows[0]);
  } catch (err) {
    console.error('Update logged food item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/logged_food_items/:id — delete logged food item
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify the logged food item belongs to the user via meal_log
    const checkResult = await db.query(
      `SELECT lfi.id
       FROM logged_food_items lfi
       JOIN meal_logs ml ON lfi.meal_log_id = ml.id
       WHERE lfi.id = $1 AND ml.user_id = $2`,
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Logged food item not found' });
    }

    await db.query('DELETE FROM logged_food_items WHERE id = $1', [id]);
    res.json({ message: 'Food item removed from log successfully' });
  } catch (err) {
    console.error('Delete logged food item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
