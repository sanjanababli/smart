# Smart Inventory & Sales Intelligence System

> A full-stack MERN application for retail shop owners to manage products, track inventory, and monitor sales — powered by an AI Business Assistant built on Google Gemini that analyzes real store data and answers questions like *"What should I restock?"* or *"Which product sells the most?"*

---

## Features

- **Product & Inventory Management** — Add, update, and track products with real-time stock levels
- **Barcode Billing** — Fast billing with barcode scanner support
- **Sales Records & Analytics** — Visual dashboard with profit trends and sales summaries
- **Low Stock Alerts** — Automated alerts when products fall below reorder threshold
- **Email Notifications** — Get notified for critical inventory events
- **AI Business Assistant** — Powered by Google Gemini; answers natural language questions about your store
- **AI Insights Card** — Auto-generated business insights on your dashboard every day

---

## AI Assistant — Powered by Google Gemini

Ask your store data anything:

```
"Which products are low in stock?"
"What were today's sales?"
"Which product sells the most?"
"What should I restock this week?"
```

The assistant pulls live data from your MongoDB database — products, sales, and alerts — and returns clear, actionable answers in plain English.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT-based Authentication |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Google Gemini API Key → [Get one here](https://makersuite.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/sanjanababli/smart-inventory
cd smart-inventory

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create a `.env` file in the `/backend` directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

### Run the App

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm run dev
```

---

## Project Structure

```
smart-inventory/
├── backend/
│   ├── models/
│   ├── routes/
│   │   ├── aiRoutes.js        # AI chat & insights endpoints
│   │   └── ...
│   ├── services/
│   │   ├── aiService.js       # Gemini integration
│   │   └── ...
│   └── server.js
├── frontend/
│   └── src/
│       └── components/
│           ├── AIChatAssistant.jsx
│           ├── dashboard/
│           │   └── AIInsightsCard.jsx
│           └── ...
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | Fetch AI-generated business insights |
| POST | `/api/ai/chat` | Send a question to the AI assistant |
| GET | `/api/products` | Get all products |
| GET | `/api/sales` | Get sales records |
| GET | `/api/alerts` | Get low stock alerts |

---

## License

This project is licensed under the MIT License.
