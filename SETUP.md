# Child Spree — Deployment Guide

## On the Dutchman, run these in order:

### 1. Clone and install
```bash
cd ~/Projects
git clone https://[YOUR_PAT]@github.com/ramonscottf/childspree.git
cd childspree
npm install
```

### 2. Create D1 database
```bash
wrangler d1 create childspree-db
```
Copy the `database_id` from the output and paste it into `wrangler.toml`.

### 3. Create R2 bucket
```bash
wrangler r2 bucket create childspree-videos
```

### 4. Run database migrations
```bash
# Local dev
npm run db:migrate:local

# Production
npm run db:migrate
```

### 5. Test locally
```bash
npm run dev
```
Visit http://localhost:5173

### 6. Deploy
```bash
npm run deploy
```

### 7. Set custom domain
In Cloudflare dashboard → Pages → childspree → Custom domains → Add `childspree.org`

## Routes

- `childspree.org/` — Nomination form (share with counselors/teachers)
- `childspree.org/#/admin` — Admin dashboard (you)
- `childspree.org/#/intake/TOKEN` — Parent intake (auto-generated per child)

## API Endpoints

- `GET /api/nominations` — List all (admin)
- `POST /api/nominations` — Create nomination
- `GET /api/nominations/:id` — Single nomination
- `PATCH /api/nominations/:id` — Update status
- `GET /api/intake/:token` — Get child info (parent)
- `POST /api/intake/:token` — Submit sizes/preferences
- `POST /api/upload/:token` — Upload video to R2
- `GET /api/stats` — Dashboard stats

## Next Steps

- [ ] Add admin auth (password gate on #/admin)
- [ ] Add Resend/Twilio integration to auto-send parent links
- [ ] Add video recording component (MediaRecorder API)
- [ ] CSV export for volunteer shopping lists
- [ ] NFC tag programming for event day
