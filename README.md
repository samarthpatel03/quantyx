# Quantyx v5 — Stock Analysis & Trade Simulation Platform

**Invest without fear.** A full-stack web application for Indian retail investors to analyze NSE stocks, practice paper trading, get AI-powered advice, and learn market fundamentals.

---

## 🚀 Features Implemented

### ✅ MVP 1: Live NSE/BSE Data
- Real-time stock quotes via Yahoo Finance API
- NSE primary, fallback to BSE
- Watchlist with search autocomplete
- Market status indicator (live/closed/weekend)
- Fixed UI issues: global search removed, dropdown layering corrected

### ✅ MVP 2: AI Stock Analyzer
- ML-powered next-day prediction (Random Forest)
- VADER sentiment analysis
- Walk-forward validation
- Risk metrics (volatility, Sharpe ratio, max drawdown)
- Integrated from `quantitative-market-analysis` engine

### ✅ MVP 3: Paper Trading Simulator
- Virtual portfolio (₹1L default)
- Buy/sell execution
- Real-time P&L tracking
- Trade history
- Database-backed (MongoDB)

### ✅ MVP 4: AI Advisor
- Gemini API integration
- Market condition analysis
- Beginner-friendly explanations
- Quick question templates

### ✅ MVP 5: Learn Section
- Educational docs on market basics
- Risk management guides
- Common mistakes to avoid
- Trading terminology
- Expandable sections for easy navigation

### ✅ Auth & Database
- MongoDB Atlas integration
- JWT authentication
- Individual user portfolios
- Secure password hashing (bcrypt)

---

## 📁 Project Structure

```
quantyx-refactored/
├── backend/
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Portfolio.js         # Portfolio schema
│   ├── routes/
│   │   ├── auth.js              # Signup/login
│   │   └── portfolio.js         # Portfolio CRUD + trades
│   ├── middleware/
│   │   └── auth.js              # JWT verification
│   ├── lib/
│   │   └── portfolioEngine.js   # Pure trading functions
│   ├── ml-engine/
│   │   ├── api.py               # Flask ML API
│   │   ├── src/                 # Model, features, sentiment
│   │   └── best_model.joblib    # Trained model
│   ├── server.js                # Express server
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Watchlist.jsx    # FIXED: dropdown z-index, backdrop-blur
    │   │   ├── Advisor.jsx      # NEW: Gemini AI advisor
    │   │   ├── Learn.jsx        # NEW: Educational content
    │   │   ├── Simulator.jsx
    │   │   ├── Analyse.jsx
    │   │   └── Dashboard.jsx
    │   ├── components/
    │   │   └── nav/
    │   │       └── MarketStatusBar.jsx  # FIXED: removed global search
    │   ├── lib/
    │   ├── hooks/
    │   ├── services/
    │   └── App.jsx
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- Gemini API key (free from Google AI Studio)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Python ML engine
cd ml-engine
pip install -r requirements.txt
cd ..

# Configure environment
cp .env.example .env
# Edit .env and add:
#   - MONGODB_URI (from Atlas)
#   - JWT_SECRET (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
#   - GEMINI_API_KEY (from https://aistudio.google.com/app/apikey)

# Start Express server (port 3001)
npm run dev
```

**Separate terminal for ML engine:**
```bash
cd backend/ml-engine
python api.py
# Runs on port 5001
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (port 5173)
npm run dev
```

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster: `Quantyx-Cluster`
3. Database: `quantyx`
4. Collections auto-created: `users`, `portfolios`
5. Network Access: Add your IP or `0.0.0.0/0` (dev only)
6. Copy connection string to `.env` as `MONGODB_URI`

---

## 🔧 Configuration

### Backend `.env`
```env
MONGODB_URI=mongodb+srv://user:pass@quantyx-cluster.xxxxx.mongodb.net/quantyx?retryWrites=true&w=majority
JWT_SECRET=your_64_char_hex_secret_here
PORT=3001
GEMINI_API_KEY=your_gemini_api_key
```

### NSE API (Yahoo Finance)
- Primary: Yahoo Finance v8/chart endpoint
- No API key required (free)
- Symbols: Auto-normalized to `.NS` format
- Rate limit: ~2000 requests/hour

### Gemini API
- Free tier: 60 requests/minute
- Get key: https://aistudio.google.com/app/apikey
- Used for: `/api/advisor` endpoint

---

## 🎯 Usage

### Running the App

1. **Start backend**: `cd backend && npm run dev` (port 3001)
2. **Start ML engine**: `cd backend/ml-engine && python api.py` (port 5001)
3. **Start frontend**: `cd frontend && npm run dev` (port 5173)
4. **Open**: http://localhost:5173

### User Flow

1. **Sign up** → Creates account + default ₹1L portfolio
2. **Dashboard** → View market overview
3. **Watchlist** → Search NSE stocks, add to watchlist, see live prices
4. **Analyse** → ML prediction for next-day direction
5. **Simulator** → Paper trade with virtual cash
6. **Advisor** → Ask AI about market conditions
7. **Learn** → Read educational guides

---

## 🛠️ API Endpoints

### Auth
- `POST /api/auth/signup` → Create account
- `POST /api/auth/login` → Get JWT token

### Portfolio (requires JWT)
- `GET /api/portfolio` → Get user's portfolio
- `POST /api/portfolio/trade` → Execute BUY/SELL
- `GET /api/portfolio/summary` → Get P&L summary

### Market Data
- `GET /api/quotes?symbols=TCS,INFY` → Bulk quotes
- `GET /api/candles?symbol=TCS&range=1mo` → OHLC data

### AI Services
- `POST /api/advisor` → Gemini advice
- `POST /ml-engine/analyze` → ML prediction (port 5001)

---

## 🐛 Fixes Applied

### Issue 1: Global Search Bar (Dark Theme Not Switching)
**Fixed:** Removed global search from `MarketStatusBar.jsx` entirely. Search now only exists in Watchlist page.

### Issue 2: Watchlist Dropdown Behind "Your Stocks"
**Fixed:**  
- Added `z-[60]` to dropdown
- Applied `backdrop-blur-xl` and `bg-background/95`
- Changed border to `border-2 border-primary/30`
- Added `shadow-2xl`
- Result: Dropdown floats cleanly above content with strong visual separation

---

## 🚧 Next Steps (For You to Implement)

1. **Deploy Backend**
   - Render.com or Railway.app
   - Set environment variables
   - Enable MongoDB Atlas IP whitelist

2. **Deploy Frontend**
   - Vercel or Netlify
   - Update API URLs (remove `localhost:3001`)

3. **Add Features**
   - Email verification
   - Password reset
   - Social login (Google OAuth)
   - Mobile app (React Native)

4. **Alpha Vantage Fallback**
   - When Yahoo Finance fails
   - Stack multiple API keys
   - Implement in `backend/server.js`

---

## 📚 Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS + shadcn/ui
- React Router
- TanStack Query
- Lucide icons

**Backend:**
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Flask (ML engine)

**ML/AI:**
- Random Forest (scikit-learn)
- VADER sentiment
- Gemini Pro API

**APIs:**
- Yahoo Finance (NSE data)
- Google Gemini (advisor)

---

## 📝 License

Educational project. Not financial advice. Use at your own risk.

---

## 🤝 Contributing

This is your project! Extend, modify, deploy as needed.

**Key Principles:**
- No global state libraries (useState/useReducer only)
- Pure functions for trading logic
- Database-backed portfolios (no localStorage for trades)
- NSE-first data strategy

---

## 📞 Support

Issues with:
- **MongoDB**: Check connection string, IP whitelist
- **Gemini**: Verify API key, check quota
- **Yahoo Finance**: NSE symbols must end with `.NS`
- **Port conflicts**: Change `PORT` in `.env` or kill process

Run `npm run dev` in both `backend/` and `frontend/` directories.

Happy trading! 🚀📈
