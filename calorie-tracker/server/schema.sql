CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(50),
  height_cm DECIMAL(5,2),
  current_weight_kg DECIMAL(5,2),
  activity_level VARCHAR(50),
  target_weight_kg DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  calories_per_100g DECIMAL(7,2) NOT NULL,
  protein_per_100g DECIMAL(7,2) NOT NULL,
  carbs_per_100g DECIMAL(7,2) NOT NULL,
  fat_per_100g DECIMAL(7,2) NOT NULL,
  sugar_per_100g DECIMAL(7,2),
  fiber_per_100g DECIMAL(7,2),
  is_custom BOOLEAN DEFAULT FALSE,
  created_by_user_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) NOT NULL,
  meal_type VARCHAR(50) NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logged_food_items (
  id SERIAL PRIMARY KEY,
  meal_log_id INT REFERENCES meal_logs(id) ON DELETE CASCADE NOT NULL,
  food_item_id INT REFERENCES food_items(id) NOT NULL,
  quantity_grams DECIMAL(7,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_goals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) NOT NULL,
  goal_date DATE NOT NULL,
  target_calories DECIMAL(7,2) NOT NULL,
  target_protein_g DECIMAL(7,2) NOT NULL,
  target_carbs_g DECIMAL(7,2) NOT NULL,
  target_fat_g DECIMAL(7,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, goal_date)
);
