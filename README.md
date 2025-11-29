# TruTrace - Threat Intelligence Platform

Complete threat intelligence platform with AI-powered analysis, real-time data, and professional UI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### Setup

1. **Clone and Install**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend-app
npm install
```

2. **Configure Environment**

Backend `.env`:
```env
OPENAI_API_KEY=your-openai-key
TAVILY_API_KEY=your-tavily-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

Frontend `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. **Setup Database**
- Create Supabase project
- Run `supabase-schema.sql` in SQL Editor
- Verify tables created

4. **Start Application**
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend-app
npm run dev
```

5. **Open** `http://localhost:5173`

## 📁 Project Structure

```
├── backend/              # Node.js + Express API
│   ├── routes/          # API routes
│   ├── server.js        # Main server
│   └── supabase.js      # Database client
│
├── frontend-app/        # React + Vite frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
│   └── ...
│
└── supabase-schema.sql  # Database schema
```

## 🎯 Features

- ✅ 5 Complete Pages (Dashboard, Feed, Analytics, Reports, Analysis)
- ✅ AI-Powered URL Threat Detection
- ✅ Real-time Database (Supabase)
- ✅ Professional Dark Theme
- ✅ Interactive Charts
- ✅ Responsive Design

## 📚 Documentation

- `SUPABASE_SETUP.md` - Database setup guide
- `walkthrough.md` - Complete build guide
- `backend/README.md` - Backend API docs

## 🔧 Tech Stack

**Frontend:** React, Vite, Tailwind CSS, Framer Motion, Recharts
**Backend:** Node.js, Express, LangChain, OpenAI
**Database:** Supabase (PostgreSQL)

## 📝 License

MIT
