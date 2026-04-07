const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/meal_logs?date=YYYY-MM-DD
router.get('/', authenticateToken, async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    // Get all meal logs for the user on the given date
    const mealLogsResult = await db.query(
      `SELECT id, meal_type, log_date, created_at
       FROM meal_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY created_at ASC`,
      [req.user.id, date]
    );

    // For each meal log, get the logged food items with nutritional info
    const mealLogs = await Promise.all(
      mealLogsResult.rows.map(async (mealLog) => {
        const foodItemsResult = await db.query(
          `SELECT
            lfi.id,
            lfi.food_item_id,
            lfi.quantity_grams,
            fi.name,
            fi.description,
            fi.calories_per_100g,
            fi.protein_per_100g,
            fi.carbs_per_100g,
            fi.fat_per_100g,
            fi.sugar_per_100g,
            fi.fiber_per_100g,
            ROUND((fi.calories_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_calories,
            ROUND((fi.protein_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_protein,
            ROUND((fi.carbs_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_carbs,
            ROUND((fi.fat_per_100g * lfi.quantity_grams / 100)::numeric, 2) AS total_fat
           FROM logged_food_items lfi
           JOIN food_items fi ON lfi.food_item_id = fi.id
           WHERE lfi.meal_log_id = $1
           ORDER BY lfi.created_at ASC`,
          [mealLog.id]
        );

        return {
          ...mealLog,
          foods: foodItemsResult.rows,
        };
      })
    );

    res.json(mealLogs);
  } catch (err) {
    console.error('Get meal logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meal_logs
// Body: { meal_type, log_date, foods: [{ food_item_id, quantity_grams }] }
router.post('/', authenticateToken, async (req, res) => {
  const { meal_type, log_date, foods } = req.body;

  if (!meal_type || !log_date) {
    return res.status(400).json({ error: 'meal_type and log_date are required' });
  }

  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMealTypes.includes(meal_type.toLowerCase())) {
    return res.status(400).json({ error: 'meal_type must be one of: breakfast, lunch, dinner, snack' });
  }

  if (!foods || !Array.isArray(foods) || foods.length === 0) {
    return res.status(400).json({ error: 'foods array is required and must not be empty' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Create the meal log
    const mealLogResult = await client.query(
      `INSERT INTO meal_logs (user_id, meal_type, log_date)
       VALUES ($1, $2, $3)
       RETURNING id, meal_type, log_date, created_at`,
      [req.user.id, meal_type.toLowerCase(), log_date]
    );

    const mealLog = mealLogResult.rows[0];

    // Insert each food item
    const insertedFoods = [];
    for (const food of foods) {
      if (!food.food_item_id || !food.quantity_grams) {
        throw new Error('Each food must have food_item_id and quantity_grams');
      }

      const foodResult = await client.query(
        `INSERT INTO logged_food_items (meal_log_id, food_item_id, quantity_grams)
         VALUES ($1, $2, $3)
         RETURNING id, food_item_id, quantity_grams`,
        [mealLog.id, food.food_item_id, food.quantity_grams]
      );

      insertedFoods.push(foodResult.rows[0]);
    }

    await client.query('COMMIT');

    // Fetch full data with nutritional info
    const fullFoodsResult = await db.query(
      `SELECT
        lfi.id,
        lfi.food_item_id,
        lfi.quantity_grams,
        fi.name,
        fi.description,
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
       WHERE lfi.meal_log_id = $1`,
      [mealLog.id]
    );

    res.status(201).json({
      ...mealLog,
      foods: fullFoodsResult.rows,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create meal log error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/meal_logs/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify the meal log belongs to the user
    const checkResult = await db.query(
      'SELECT id FROM meal_logs WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meal log not found' });
    }

    await db.query('DELETE FROM meal_logs WHERE id = $1', [id]);
    res.json({ message: 'Meal log deleted successfully' });
  } catch (err) {
    console.error('Delete meal log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
