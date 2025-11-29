# Supabase Database Setup

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Name: `trutrace-db`
   - Database Password: (create a strong password)
   - Region: Choose closest to you
5. Wait for project to be created (~2 minutes)

## Step 2: Get Your Credentials

After project is created, go to **Settings** → **API**:

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

## Step 3: Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the SQL from `supabase-schema.sql`
4. Click "Run" to execute

## Step 4: Configure Environment Variables

### Backend (.env)
Add to `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### Frontend (.env)
Create `frontend-app/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Seed Initial Data (Optional)

Run the seed script in SQL Editor:
```sql
-- Insert sample user
INSERT INTO users (email, full_name, role) VALUES
('alex.mercer@trutrace.com', 'Alex Mercer', 'analyst');

-- Insert sample reports
INSERT INTO reports (title, description, priority, status, source, region, report_id) VALUES
('Cyber Threat Advisory: Project Chimera', 'A new state-sponsored threat actor...', 'Critical', 'Active', 'OSINT', 'North America', 'CTA-2024-0921'),
('Geopolitical Brief: East Asia Tensions', 'Recent naval exercises...', 'High', 'Under Review', 'IMAGERY', 'East Asia', 'GPB-2024-0920');
```

## Step 6: Test Connection

Run the backend server:
```bash
cd backend
node server.js
```

Test the API:
```bash
curl http://localhost:3000/api/reports
```

## Step 7: Start Frontend

```bash
cd frontend-app
npm run dev
```

Open `http://localhost:5173` and see real data!

---

## Troubleshooting

### Connection Error
- Check SUPABASE_URL is correct
- Verify API keys are valid
- Ensure project is not paused

### RLS Policies Blocking Access
- Temporarily disable RLS for testing:
  ```sql
  ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
  ```
- Re-enable after testing with proper policies

### CORS Issues
- Supabase allows all origins by default
- Check browser console for errors

---

## Next Steps

1. ✅ Install Supabase clients
2. ⏳ Create Supabase project
3. ⏳ Run database migrations
4. ⏳ Add environment variables
5. ⏳ Test API endpoints
6. ⏳ Update frontend to use real data
