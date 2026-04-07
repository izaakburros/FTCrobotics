# Calorie Tracker

A full-stack calorie and nutrition tracking web application built with React, Vite, Tailwind CSS (frontend) and Node.js, Express, PostgreSQL (backend).

## Features

- User registration and authentication (JWT)
- Daily food logging by meal type (breakfast, lunch, dinner, snack)
- Search from a database of 32 common foods
- Real-time calorie and macro progress bars
- Daily goal setting with auto-calculation via Mifflin-St Jeor equation
- Weekly progress view with a CSS bar chart

## Prerequisites

- Node.js 18+
- PostgreSQL 13+

## Setup

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE calorie_tracker;"
```

### 2. Run the schema

```bash
psql -U postgres -d calorie_tracker -f server/schema.sql
```

### 3. Seed the food database

```bash
psql -U postgres -d calorie_tracker -f server/seed.sql
```

### 4. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/calorie_tracker
JWT_SECRET=change_this_to_a_long_random_secret
PORT=3001
```

### 5. Install server dependencies

```bash
cd server
npm install
```

### 6. Install client dependencies

```bash
cd client
npm install
```

### 7. Start the servers

In one terminal (backend):

```bash
cd server
npm run dev
```

In another terminal (frontend):

```bash
cd client
npm run dev
```

The app will be available at http://localhost:5173

The API runs at http://localhost:3001

## Project Structure

```
calorie-tracker/
├── server/
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/register, /login
│   │   ├── users.js          # GET/PUT /api/users/me
│   │   ├── foodItems.js      # GET/POST /api/food_items
│   │   ├── mealLogs.js       # GET/POST/DELETE /api/meal_logs
│   │   ├── loggedFoodItems.js # PUT/DELETE /api/logged_food_items/:id
│   │   └── dailyGoals.js     # GET/POST /api/daily_goals
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── db.js                 # PostgreSQL connection pool
│   ├── server.js             # Main Express app + /api/summary route
│   ├── schema.sql            # Database schema
│   ├── seed.sql              # 32 common foods seed data
│   ├── package.json
│   └── .env.example
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Goals.jsx
    │   │   └── Progress.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── AddFoodModal.jsx
    │   │   ├── ProgressBar.jsx
    │   │   └── MealSection.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```
