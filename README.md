# EcoTrack - Carbon Footprint Tracker

EcoTrack is a web-based personal carbon footprint tracking application designed to help users log daily habits, calculate carbon emissions, visualise their environmental impact, and receive AI-powered eco-friendly suggestions.

## Key Features
- **Dashboard & Carbon Gauge**: Single dashboard displaying a carbon gauge tracking the daily total carbon footprint against a personal budget.
- **Daily Habit Logger**: Log daily activities for **Travel** (distance, passengers, transport mode), **Food** (diet type, food waste penalty), and **Energy**.
- **AI-Powered Suggestions**: Personalised eco-friendly suggestions and lifestyle swaps generated using Groq API (`llama-3.3-70b-versatile`).
- **History & Analytics**: 30-day line chart with budget reference, 14-day stacked bar breakdown, and a colour-coded heatmap calendar.
- **Streaks & Badges**: Achievement system rewarding consistent eco-friendly behavior.

## Technology Stack
- **Frontend**: React.js, Tailwind CSS, Chart.js
- **Backend**: Flask (Python)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **External Integrations**:
  - **Groq API** (`llama-3.3-70b-versatile`) for AI recommendations.
  - **Carbon Interface API** for emission factor data coefficients.

## System Architecture
The application is structured for local deployment with Flask serving the backend API on port 5000 and Vite serving the React frontend on port 5173.

```
+-------------------------------------------------------------+
|                          FRONTEND                           |
|                    (React.js + Tailwind CSS)                |
|  - Auth (Login/Register)        - Dashboard (Gauge, Summary)|
|  - Daily Habit Logger (Travel/Food/Energy)                  |
|  - AI Suggestions Page          - History & Analytics Charts|
|  - Achievements & Streaks       - Settings & Preferences    |
+------------------------------+------------------------------+
                               | API Requests (HTTPS/JSON)
                               v
+-------------------------------------------------------------+
|                          BACKEND                            |
|                       (Flask - Python)                      |
|  - API Layer                 - Business Logic (Calculation)  |
|  - Integration Layer         - Data Access (Firestore Ops)  |
+----+-------------------+----------------+---------------+---+
     |                   |                |               |
     v                   v                v               v
+----------+       +-----------+    +----------+    +----------+
| Firebase |       |   Groq    |    |  Carbon  |    | Firebase |
|   Auth   |       |    API    |    | Interface|    | Firestore|
+----------+       +-----------+    +----------+    +----------+
```

## Scenarios & Use Cases

### Scenario 1: Logging Travel Activity
A user logs daily travel activity by selecting a transport mode (e.g., car petrol), entering distance travelled in kilometres, and specifying the number of passengers for carpooling. The system calculates travel emissions using science-backed coefficients, saves the record to Firebase Firestore, and displays the result on the dashboard gauge alongside a comparison against the user’s daily carbon budget.

### Scenario 2: Logging Food Consumption
A user logs their food consumption by selecting a diet type (meat-heavy, omnivore, vegetarian, or vegan) and indicating whether food was wasted. The system applies a 10% emission penalty for food waste, computes the food carbon score, and adds it to the daily total displayed on the dashboard with a colour-coded progress indicator.

### Scenario 3: Receiving AI-Powered Suggestions
After logging travel, food, and energy habits, the user navigates to the Suggestions page. The system submits the daily breakdown to the Groq API using the llama-3.3-70b-versatile model, which generates three personalised and actionable eco-friendly lifestyle swap recommendations with estimated CO₂ savings displayed as styled suggestion cards.

### Scenario 4: Reviewing Footprint History
The user opens the History page to review their carbon footprint trends. The dashboard renders a 30-day line chart with a budget reference line, a 14-day stacked bar breakdown by category, and a colour-coded heatmap calendar. Summary statistics including 7-day average, best day, worst day, and monthly total are displayed above the charts.
