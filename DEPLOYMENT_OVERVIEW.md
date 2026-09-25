# EcoPolicy AI - Deployment Overview

## 🎯 Project Summary
**EcoPolicy AI Dashboard** is a full-stack urban sustainability policy simulation platform that enables city planners and analysts to model environmental impacts of green policy decisions across Indian cities (Delhi, Ahmedabad, Surat).

### Key Features
- **5 Policy Levers**: EV Adoption, Solar Adoption, Trees Planted, Plastic Recycling, Public Transport Usage
- **Real-time Simulation Engine**: Server-side computation for environmental metrics
- **AI-Powered Insights**: LLM integration (gpt-5-mini) for policy recommendations  
- **Scenario Comparison**: Save and compare multiple simulation runs
- **PDF Report Generation**: Automated policy reports
- **Responsive UI**: Premium design with Recharts visualizations

---

## 📁 Project Structure

```
ecopolicy-ai/
├── client/                          # React Frontend (SPA)
│   ├── src/
│   │   ├── App.tsx                 # Main app component
│   │   ├── main.tsx                # React entry point
│   │   ├── index.css               # Global styles
│   │   ├── const.ts                # Frontend constants
│   │   ├── components/
│   │   │   ├── AIChatBox.tsx       # AI insights panel
│   │   │   ├── DashboardLayout.tsx # Main dashboard
│   │   │   ├── Map.tsx             # City map visualization
│   │   │   ├── ScenarioComparison.tsx  # Scenario comparison
│   │   │   ├── ScenarioManager.tsx # Scenario save/load
│   │   │   ├── ManusDialog.tsx     # Manus integration
│   │   │   ├── ErrorBoundary.tsx   # Error handling
│   │   │   └── ui/                 # shadcn/ui components (30+ components)
│   │   ├── contexts/
│   │   │   └── ThemeContext.tsx    # Dark/light theme
│   │   ├── hooks/
│   │   │   ├── useComposition.ts   # Custom hooks
│   │   │   ├── useMobile.tsx
│   │   │   └── usePersistFn.ts
│   │   ├── lib/
│   │   │   ├── trpc.ts             # tRPC client configuration
│   │   │   └── utils.ts            # Utility functions
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Main dashboard page
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── NotFound.tsx        # 404 page
│   │   │   └── ComponentShowcase.tsx
│   │   └── _core/hooks/
│   │       └── useAuth.ts          # Authentication hook
│   ├── public/
│   │   ├── __manus__/
│   │   │   ├── debug-collector.js
│   │   │   └── version.json
│   │   └── index.html              # HTML entry point
│   └── tsconfig.json
│
├── server/                          # Node.js/Express Backend + Python
│   ├── _core/
│   │   ├── index.ts                # Server entry point
│   │   ├── context.ts              # tRPC context
│   │   ├── cookies.ts              # Cookie management
│   │   ├── dataApi.ts              # Data API utilities
│   │   ├── env.ts                  # Environment variables
│   │   ├── heartbeat.ts            # Health check
│   │   ├── imageGeneration.ts      # Image generation service
│   │   ├── llm.ts                  # LLM integration (Forge API)
│   │   ├── map.ts                  # Map utilities
│   │   ├── notification.ts         # Notifications
│   │   ├── oauth.ts                # OAuth integration
│   │   ├── storageProxy.ts         # Storage proxy (AWS S3)
│   │   ├── systemRouter.ts         # System routes
│   │   ├── trpc.ts                 # tRPC server configuration
│   │   ├── vite.ts                 # Vite integration
│   │   ├── voiceTranscription.ts   # Voice-to-text
│   │   └── types/
│   │       ├── cookie.d.ts
│   │       └── manusTypes.ts
│   ├── routers.ts                  # tRPC routers/endpoints
│   ├── simulation.ts               # Core simulation engine
│   ├── simulation_llm.ts           # LLM-powered simulations
│   ├── pdf_report.ts               # PDF report generation
│   ├── db.ts                       # Database connection
│   ├── storage.ts                  # Storage operations
│   ├── main.py                     # FastAPI server (ML models)
│   ├── auth.logout.test.ts         # Auth tests
│   └── __pycache__/
│
├── shared/                         # Shared types & utilities
│   ├── const.ts                   # Shared constants
│   ├── types.ts                   # Shared TypeScript types
│   └── _core/
│       ├── errors.ts              # Error definitions
│
├── drizzle/                         # Database Schema & Migrations
│   ├── schema.ts                  # Drizzle ORM schema
│   ├── relations.ts               # Table relationships
│   └── migrations/                # Database migrations
│
├── ml_models/                       # ML Models Directory
│   ├── train_models.py            # Model training script
│   └── [city_metric_model.pkl]    # Pre-trained models (at runtime)
│
├── data/                            # Synthetic baseline data
│   ├── ahmedabad_synthetic_data.csv
│   ├── delhi_synthetic_data.csv
│   ├── surat_synthetic_data.csv
│   ├── all_cities_synthetic_data.csv
│   └── generate_synthetic_data.py
│
├── patches/                         # pnpm patch files
│   └── wouter@3.7.1.patch
│
├── drizzle.config.ts              # Drizzle ORM config
├── vite.config.ts                 # Vite bundler config
├── vite.config.ts.bak             # Vite backup
├── vitest.config.ts               # Vitest testing config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Node.js dependencies
├── pnpm-lock.yaml                 # pnpm lock file
├── components.json                # UI components config
├── template.json                  # Template config
│
├── README.md                       # Project documentation
├── DEPLOYMENT_OVERVIEW.md          # This file
├── DEMO_SCRIPT.md                 # Demo instructions
├── SLIDE_DECK.md                  # Presentation slides
├── WEEK2_WEEK3_SUMMARY.md         # Development summary
└── todo.md                        # Task tracking
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       CLIENT TIER (Vite+React)                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ React 19 + Tailwind CSS 4 + shadcn/ui Components         │   │
│  │ • Dashboard Layout with responsive design                │   │
│  │ • Policy lever sliders (5 inputs)                        │   │
│  │ • Real-time visualizations (Recharts)                    │   │
│  │ • Scenario comparison view                               │   │
│  │ • AI Chat box for insights                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ tRPC + TanStack React Query
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              API TIER (Node.js + Express + tRPC)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ tRPC Server (Type-safe RPC framework)                    │   │
│  │ • Simulation Router (POST /api/simulate)                 │   │
│  │ • Scenario Router (CRUD operations)                      │   │
│  │ • Report Router (PDF generation)                         │   │
│  │ • Auth Router (OAuth + JWT)                              │   │
│  │ • Data Router (Baseline data access)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┬─────────────┐
        │                │                │             │
┌───────▼──────┐ ┌──────▼────┐  ┌──────▼────┐  ┌────▼────────┐
│  DATABASE    │ │  LLM API  │  │    S3     │  │   ML Models │
│  (MySQL)     │ │ (Forge    │  │  (AWS)    │  │   (FastAPI) │
│  Drizzle ORM │ │ gpt-5)    │  │  Storage  │  │   Python    │
└──────────────┘ └───────────┘  └───────────┘  └─────────────┘
```

---

## 🔧 Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool & dev server
- **TypeScript 5.9** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Premium UI components
- **Recharts** - Data visualizations (bar/line charts)
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **TanStack React Query** - Server state management
- **tRPC Client** - Type-safe API calls
- **Wouter** - Lightweight router

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **tRPC** - Type-safe RPC framework
- **Drizzle ORM** - Database toolkit
- **MySQL 2** - Database driver
- **Zod** - Runtime schema validation
- **jose** - JWT tokens
- **pdf-lib** - PDF generation
- **AWS SDK** - S3 storage
- **tsx** - TypeScript runner
- **esbuild** - Bundler

### Machine Learning (Python)
- **FastAPI** - ML API server
- **scikit-learn** - Model training
- **joblib** - Model serialization
- **pandas** - Data processing

### DevTools
- **TypeScript** - Type checking
- **Vitest** - Unit testing
- **Prettier** - Code formatting
- **ESLint** - (implicit via config)
- **Drizzle Kit** - Database migrations

---

## 📋 Build & Deployment Scripts

```json
{
  "dev": "tsx watch server/_core/index.ts",
  "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "node dist/index.js --production",
  "check": "tsc --noEmit",
  "format": "prettier --write .",
  "test": "vitest run",
  "db:push": "drizzle-kit generate && drizzle-kit migrate"
}
```

### Build Output
- **Client**: `dist/public/` - Static React SPA
- **Server**: `dist/index.js` - Bundled Node.js app
- **Size**: Optimized with tree-shaking and minification

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run `pnpm check` - TypeScript type checking
- [ ] Run `pnpm test` - Execute test suite
- [ ] Run `pnpm format` - Code formatting
- [ ] Set up `.env.production` with all required variables
- [ ] Verify database migrations: `pnpm db:push`
- [ ] Build locally: `pnpm build`
- [ ] Test production build: `node dist/index.js --production`

### Environment Variables Required
```env
# Database
DATABASE_URL=mysql://user:password@host:port/dbname

# LLM/AI
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# Frontend
VITE_API_URL=https://your-api-domain.com

# OAuth (if applicable)
OAUTH_CLIENT_ID=your_oauth_id
OAUTH_CLIENT_SECRET=your_oauth_secret

# Node
NODE_ENV=production
```

### Backend Deployment Options

#### Option 1: Render (Recommended for simplicity)
1. Connect GitHub repository to Render
2. Create new Web Service
3. **Build Command**: `pnpm install && pnpm build`
4. **Start Command**: `node dist/index.js --production`
5. Set environment variables in Render dashboard
6. Deploy
⚠️ Note: Free tier has 15-minute inactivity sleeps

#### Option 2: Railway
1. Connect GitHub repository
2. Set build command: `pnpm install && pnpm build`
3. Set start command: `node dist/index.js --production`
4. Add MySQL database plugin
5. Configure environment variables

#### Option 3: AWS EC2 / Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 8000
CMD ["node", "dist/index.js", "--production"]
```

### Frontend Deployment Options

#### Option 1: Vercel (Recommended)
1. Import project from GitHub
2. Select `ecopolicy-ai` as root directory
3. **Build Command**: `pnpm build`
4. **Output Directory**: `dist/public`
5. Add environment variable: `VITE_API_URL=<backend-url>`
6. Deploy

#### Option 2: Netlify
1. Connect GitHub repository
2. **Build Command**: `pnpm build`
3. **Publish Directory**: `dist/public`
4. Add build environment variable: `VITE_API_URL`
5. Deploy

#### Option 3: AWS S3 + CloudFront
1. Build: `pnpm build`
2. Upload `dist/public` to S3
3. Create CloudFront distribution pointing to S3
4. Configure API proxy for `/api/*` requests

---

## 📊 Database Schema

### Tables (via Drizzle ORM)
- **users** - User authentication & profiles
- **scenarios** - Saved simulation scenarios
- **reports** - Generated PDF reports
- **audit_logs** - Activity tracking

See [drizzle/schema.ts](drizzle/schema.ts) for complete schema definition.

### Migrations
Run migrations with: `pnpm db:push`

---

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Configure in server for frontend domain
3. **JWT Tokens**: Use `jose` library (already configured)
4. **Database**: Use SSL connection for production
5. **S3**: Restrict bucket access with IAM policies
6. **API Keys**: Rotate Forge API keys regularly
7. **HTTPS**: Always use HTTPS in production
8. **Rate Limiting**: Consider implementing on tRPC routes

---

## 📈 Performance Optimization

- **Code Splitting**: Vite handles automatically
- **Image Optimization**: Compress SVGs and PNGs
- **Lazy Loading**: React.lazy() for routes
- **Database Indexing**: Add indexes on frequently queried columns
- **Caching**: Use React Query caching strategies
- **CDN**: Use CloudFront or similar for static assets
- **Compression**: Enable gzip on server

---

## 🐛 Monitoring & Logging

### Recommended Tools
- **Error Tracking**: Sentry or LogRocket
- **Performance**: Vercel Analytics or NewRelic
- **Uptime Monitoring**: UptimeRobot or Pingdom
- **Logs**: CloudWatch or Datadog

### Health Check Endpoint
Use the heartbeat service in `server/_core/heartbeat.ts` for monitoring.

---

## 📚 Key Files for Deployment

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & build scripts |
| `drizzle.config.ts` | Database configuration |
| `vite.config.ts` | Frontend build configuration |
| `server/_core/index.ts` | Backend entry point |
| `client/src/main.tsx` | Frontend entry point |
| `.env.production` | Production environment variables |

---

## ✅ Post-Deployment Verification

1. [ ] Frontend loads without console errors
2. [ ] API calls succeed (check Network tab)
3. [ ] Simulations execute correctly
4. [ ] PDF generation works
5. [ ] Database connects and migrations run
6. [ ] Authentication flows function
7. [ ] All three cities (Delhi, Ahmedabad, Surat) load data
8. [ ] Policy levers produce expected metric changes
9. [ ] Scenario save/compare works
10. [ ] AI insights generate (requires Forge API key)

---

## 🆘 Troubleshooting

### Build Fails
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check Node version: `node --version` (should be 20+)
- Clear Vite cache: `rm -rf dist`

### Database Connection Fails
- Verify DATABASE_URL is correct
- Check MySQL server is running
- Run migrations: `pnpm db:push`

### API Not Responding
- Check VITE_API_URL matches backend domain
- Verify CORS settings in server
- Check environment variables are set

### Models Not Loading
- Verify `ml_models/` directory exists on server
- Check model files are `.pkl` format
- Ensure Python environment has scikit-learn

---

## 📞 Support & Documentation

- **README**: [README.md](README.md) - Detailed project info
- **Demo**: [DEMO_SCRIPT.md](DEMO_SCRIPT.md) - Demo walkthrough
- **Architecture**: This deployment overview
- **Code**: Well-commented TypeScript throughout

---

**Last Updated**: 2024
**Version**: 1.0.0
**License**: MIT
