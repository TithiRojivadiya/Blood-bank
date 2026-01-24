# Deployment Guide - Real-Time Blood Donation System

## Prerequisites

1. **Supabase Project** - Create at [supabase.com](https://supabase.com)
2. **Node.js** (v18+) and npm
3. **Environment Variables** configured

## Step 1: Database Setup

1. In Supabase Dashboard:
   - Go to **Database → Extensions** → Enable `postgis`
   - Go to **SQL Editor** → Run `supabase/migrations/0001_initial_postgis_schema.sql`
   - Run `supabase/migrations/0002_inventory_and_dispatch.sql`
   - (Optional) Run `supabase/seed_hospitals.sql` with your region's coordinates

2. Enable Realtime:
   - Go to **Database → Replication**
   - Add these tables to `supabase_realtime` publication:
     - `notifications`
     - `inventory`
     - `donor_responses`
   - Or run in SQL Editor:
     ```sql
     ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
     ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
     ALTER PUBLICATION supabase_realtime ADD TABLE donor_responses;
     ```

## Step 2: Backend Setup

1. Navigate to backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_service_role_key
   PORT=5000
   ```

4. Start backend:
   ```bash
   npm run dev    # Development
   npm start      # Production
   ```

## Step 3: Frontend Setup

1. Navigate to frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview production build:
   ```bash
   npm run preview
   ```

## Step 4: Deployment Options

### Option A: Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel):**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

**Backend (Railway/Render):**
1. Connect GitHub repo
2. Set root directory to `backend`
3. Add environment variables
4. Deploy

### Option B: Full Stack on Render

1. Create two services:
   - **Web Service** (Frontend)
   - **Web Service** (Backend)

2. Frontend service:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
   - Environment variables: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

3. Backend service:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `PORT`

### Option C: Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - PORT=5000
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=${VITE_API_URL}
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    depends_on:
      - backend
    restart: unless-stopped
```

## Environment Variables Summary

### Backend (.env)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Supabase service role key (keep secret!)
- `PORT` - Server port (default: 5000)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (e.g., `https://api.yourdomain.com`)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (safe to expose)

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Realtime subscriptions enabled
- [ ] Environment variables configured
- [ ] CORS configured for frontend domain
- [ ] Backend accessible from frontend
- [ ] Test user registration/login
- [ ] Test blood request flow
- [ ] Test inventory management
- [ ] Test real-time notifications

## Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use service role key only in backend** - Never expose it to frontend
3. **Enable Row Level Security (RLS)** in Supabase if needed
4. **Use HTTPS** in production
5. **Set proper CORS** origins in backend

## Troubleshooting

### Backend not connecting to Supabase
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase project is active

### Frontend not loading data
- Check `VITE_API_URL` points to correct backend
- Verify CORS is enabled in backend
- Check browser console for errors

### Real-time not working
- Verify tables added to `supabase_realtime` publication
- Check Supabase Realtime is enabled in project settings
- Verify `VITE_SUPABASE_ANON_KEY` is correct

### Inventory not updating
- Check database triggers are created
- Verify `inventory` table exists
- Check backend logs for errors

## Support

For issues, check:
1. Backend logs (`console.log` in terminal)
2. Browser console (F12)
3. Supabase Dashboard → Logs
4. Network tab in browser DevTools
