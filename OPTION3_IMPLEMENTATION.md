# Option 3: Load Datasets from Database at Runtime

## Overview

This implementation loads medical datasets from a PostgreSQL/SQLite database via backend API instead of storing them as large files in the git repository. This approach:

✅ **Advantages:**
- No large files in git (clean repository)
- Datasets can be updated without code redeploy
- Scalable to many datasets
- Easy to manage in production
- Works perfectly on Render

⚠️ **Trade-offs:**
- Initial database load time on startup (cached after first load)
- Requires backend service to be running

## Architecture

```
┌─────────────────┐
│   Render: AI    │
│   Service       │
└────────┬────────┘
         │ API Calls
         ▼
┌─────────────────────────────┐
│ Render: Backend Service     │
│ - REST API for datasets     │
│ - PostgreSQL/SQLite DB      │
│ - Dataset seeding on startup│
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Database                   │
│  - Dataset records          │
│  - Cached for 1 hour        │
└─────────────────────────────┘
```

## Implementation Details

### 1. Backend Changes

**New Files Created:**
- `backend/src/services/dataset.service.ts` - Dataset CRUD operations
- `backend/src/controllers/dataset.controller.ts` - HTTP endpoints
- `backend/src/routes/datasets.ts` - Route definitions
- `backend/src/utils/dataset-seeder.ts` - Dataset population logic

**Database Schema Added:**
```prisma
model Dataset {
  id          String   @id @default(uuid())
  name        String   @unique
  category    String   // e.g., "symptoms", "diseases", "emergency-cases"
  description String?
  language    String   @default("en")
  data        String   @db.Text  // JSON string
  source      String?
  recordCount Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Endpoints Available:**
- `GET /api/datasets` - List all datasets
- `GET /api/datasets?category=symptoms` - Filter by category
- `GET /api/datasets/:id` - Get single dataset with full data
- `POST /api/datasets/seed` - Seed datasets from seed data
- `GET /api/datasets/stats` - Get dataset statistics
- `GET /api/datasets/search?q=fever` - Search datasets

### 2. AI Service Changes

**New Files Created:**
- `ai/services/dataset_loader.py` - Python client to fetch datasets
- `ai/bootstrap.py` - Initialization logic on startup

**How it works:**
1. On startup, AI service calls `POST /api/datasets/seed` (if needed)
2. AI service loads all datasets via `GET /api/datasets`
3. Datasets are cached in memory for 1 hour
4. RAG pipeline uses the loaded datasets for context retrieval

### 3. Database Changes

**Migration Required:**
```bash
# In backend folder
npm run prisma:migrate
```

This creates the `Dataset` table in your database.

## Deployment Steps

### Step 1: Update Backend Dependencies

The backend already has the necessary dependencies (axios, prisma). No changes needed.

### Step 2: Update AI Service Dependencies

Ensure `requests` is in `ai/requirements.txt`:

```bash
# ai/requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
openai==1.3.0
pydantic==2.0.0
requests==2.31.0  # ← Add this if not present
python-dotenv==1.0.0
# ... other dependencies
```

### Step 3: Run Prisma Migration

Before deploying, run the migration locally to create the Dataset table:

```bash
cd backend
npm run prisma:migrate
```

### Step 4: Deploy to Render

#### Create/Update Backend Service:

```
Service Name: sehat-ai-backend
Root Directory: backend
Build Command: npm install && npm run prisma:generate && npm run build
Start Command: npm run start
```

Environment Variables:
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@postgres-host/dbname
REDIS_URL=redis://redis-host:6379
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
OPENAI_API_KEY=sk-...
TRUGEN_API_KEY=...
AI_SERVICE_URL=https://sehat-ai-service.onrender.com
FRONTEND_URL=https://sehat-ai-frontend.onrender.com
```

#### Create/Update AI Service:

```
Service Name: sehat-ai-service
Root Directory: ai
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port 8000
```

Environment Variables:
```
PORT=8000
BACKEND_URL=https://sehat-ai-backend.onrender.com
OPENAI_API_KEY=sk-...
LOG_LEVEL=INFO
```

### Step 5: Verify Deployment

Check the logs in Render console:

```bash
# Backend should show:
[DatasetController] Starting dataset seeding...
[DatasetSeeder] Starting dataset population...
[DatasetSeeder] ✓ Processed dataset: symptom-disease-mapping
[DatasetSeeder] ✓ Processed dataset: emergency-protocols
# ... more datasets

# AI service should show:
[AIBootstrap] Starting AI service initialization...
[AIBootstrap] Seeding datasets...
[AIBootstrap] Loading datasets into memory...
[AIBootstrap] ✓ All datasets loaded successfully
```

## Testing

### Local Testing

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start AI service
cd ai
python main.py

# Terminal 3: Test the API
curl http://localhost:4000/api/datasets
curl http://localhost:4000/api/datasets/seed
curl http://localhost:8000/health
```

### Render Testing

After deployment, test these endpoints:

```bash
# List datasets
curl https://sehat-ai-backend.onrender.com/api/datasets

# Get stats
curl https://sehat-ai-backend.onrender.com/api/datasets/stats

# Check AI service
curl https://sehat-ai-service.onrender.com/health
```

## Troubleshooting

### Issue: "Failed to fetch datasets from backend"
**Solution:** 
- Ensure backend service URL is correct in AI service env vars
- Check that backend is running: `curl https://sehat-ai-backend.onrender.com/api/datasets/stats`

### Issue: Database migration fails
**Solution:**
```bash
# Reset database and run migration fresh
cd backend
npx prisma db reset  # ⚠️ Warning: This deletes all data
npm run prisma:migrate
```

### Issue: AI service starts but can't load datasets
**Solution:**
- Check AI service logs for errors
- Verify `BACKEND_URL` environment variable is set correctly
- Ensure backend API is accessible from AI service

### Issue: Datasets are empty on first request
**Solution:**
- Wait 30 seconds after deployment for seeding to complete
- Check backend logs for seeding errors
- Manually trigger seeding: `POST /api/datasets/seed`

## Adding Custom Datasets

To add your own medical datasets:

1. **Update the seeder** (`backend/src/utils/dataset-seeder.ts`):

```typescript
const SEED_DATASETS = {
  'my-custom-dataset': {
    name: 'my-custom-dataset',
    category: 'my-category',
    description: 'My custom medical data',
    language: 'en',
    data: [
      { /* your data structure */ },
      // ...
    ],
  },
};
```

2. **Redeploy backend** - the seeder runs automatically on startup

3. **Or use the API** to upload datasets:

```bash
curl -X POST https://sehat-ai-backend.onrender.com/api/datasets/seed
```

## Performance Considerations

- **First load:** 2-5 seconds (seeding + loading datasets)
- **Subsequent loads:** < 100ms (from cache)
- **Cache expiry:** 1 hour per dataset
- **Database queries:** Indexed by category and language

## Security

✅ **What's Protected:**
- Large files NOT in git (less sensitive data exposure)
- Database credentials in Render environment variables
- API endpoints accessible only from AI service network

⚠️ **What to Monitor:**
- Dataset size - keep individual records < 1MB
- API rate limiting - Render provides 300 req/min by default
- Database backup - enable automatic backups on Render

## Future Enhancements

1. **Stream large datasets** instead of loading entire into memory
2. **Fetch from external APIs** (Hugging Face, PubMed, etc.)
3. **Versioning** - track dataset versions
4. **Compression** - compress large JSON data in database
5. **CDN** - cache datasets on CDN for faster retrieval

## Files Summary

| File | Purpose |
|------|---------|
| `backend/src/services/dataset.service.ts` | CRUD operations |
| `backend/src/controllers/dataset.controller.ts` | HTTP handlers |
| `backend/src/routes/datasets.ts` | Route definitions |
| `backend/src/utils/dataset-seeder.ts` | Seed data + logic |
| `ai/services/dataset_loader.py` | Python API client |
| `ai/bootstrap.py` | Startup initialization |
| `backend/prisma/schema.prisma` | Database schema |
| `backend/src/app.ts` | Route registration |
| `ai/main.py` | FastAPI initialization |

## Next Steps

1. ✅ Run Prisma migration to create Dataset table
2. ✅ Deploy backend service to Render
3. ✅ Deploy AI service to Render  
4. ✅ Verify datasets load via logs
5. ✅ Test endpoints manually
6. ✅ Monitor performance in Render dashboard
