# 🏗️ IN-PLACE MONOREPO CONVERSION GUIDE

**Current Directory:** `/Users/olaolu/Documents/GitHub/Nudgenest`
**Strategy:** Convert existing structure to monorepo WITHOUT moving/renaming

---

## 📊 CURRENT STRUCTURE

```
/Users/olaolu/Documents/GitHub/Nudgenest/
├── nudgenest/                 # Backend
├── review-ui/                 # Frontend
├── nudgenest-shpfy-app/       # Shopify app
├── nudge-nest-landing/        # Landing page
├── nudgenest-infra/           # Infrastructure
├── private.key                # ⚠️ SSL keys (to ignore)
├── private.pem
├── csr.pem
└── SPRINT_PLAN.md            # Our work plan
```

---

## 🎯 TARGET STRUCTURE (NO MOVING!)

```
/Users/olaolu/Documents/GitHub/Nudgenest/  ← MONOREPO ROOT
├── packages/                              ← NEW
│   └── shared/                            ← NEW (shared types/utils)
├── nudgenest/                             ← STAYS HERE (backend)
├── review-ui/                             ← STAYS HERE (frontend)
├── nudgenest-shpfy-app/                   ← STAYS HERE (shopify)
├── nudge-nest-landing/                    ← STAYS HERE (landing)
├── nudgenest-infra/                       ← STAYS HERE (infra)
├── pnpm-workspace.yaml                    ← NEW
├── package.json                           ← NEW (root)
├── .gitignore                             ← UPDATE
├── SPRINT_PLAN.md
└── MONOREPO_SETUP.md                      ← THIS FILE
```

**Key Point:** Everything stays in place! We just add monorepo config files.

---

## ⚡ QUICK SETUP (30 MINUTES)

### **STEP 1: Initialize Root Package (5 mins)**

```bash
cd /Users/olaolu/Documents/GitHub/Nudgenest

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "nudgenest-monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Nudgenest - User Review Platform for Shopify",
  "scripts": {
    "dev": "pnpm --parallel run dev",
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "pnpm -r run lint",
    "format": "pnpm -r run format",
    "backend:dev": "pnpm --filter nudgenest dev",
    "frontend:dev": "pnpm --filter review-ui dev",
    "shopify:dev": "pnpm --filter nudgenest-shpfy-app dev",
    "landing:dev": "pnpm --filter nudge-nest-landing dev"
  },
  "keywords": ["shopify", "reviews", "ecommerce"],
  "author": "Nudgenest Team",
  "license": "UNLICENSED"
}
EOF
```

### **STEP 2: Create pnpm Workspace Config (2 mins)**

```bash
cat > pnpm-workspace.yaml << 'EOF'
packages:
  # Main applications (already exist)
  - 'nudgenest'
  - 'review-ui'
  - 'nudgenest-shpfy-app'
  - 'nudge-nest-landing'
  - 'nudgenest-infra'

  # Shared packages (new)
  - 'packages/*'
EOF
```

### **STEP 3: Create Root .gitignore (3 mins)**

```bash
cat >> .gitignore << 'EOF'
# Root level ignores
node_modules/
dist/
build/
.DS_Store

# Secrets and keys
*.key
*.pem
*.csr
*service-account*.json
!package.json
!package-lock.json
!tsconfig.json

# Environment files
.env
.env.*
!.env.example

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Build outputs
*.tsbuildinfo
EOF
```

### **STEP 4: Create Shared Package (15 mins)**

```bash
# Create shared package structure
mkdir -p packages/shared/src/{types,constants,utils,validation}

# Initialize shared package
cat > packages/shared/package.json << 'EOF'
{
  "name": "@nudgenest/shared",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "@types/node": "^22.10.1"
  }
}
EOF

# Create TypeScript config for shared
cat > packages/shared/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create index file
cat > packages/shared/src/index.ts << 'EOF'
// Export all types
export * from './types';

// Export all constants
export * from './constants';

// Export all utils
export * from './utils';

// Export all validation
export * from './validation';
EOF

# Create placeholder files
touch packages/shared/src/types/index.ts
touch packages/shared/src/constants/index.ts
touch packages/shared/src/utils/index.ts
touch packages/shared/src/validation/index.ts

# Create README
cat > packages/shared/README.md << 'EOF'
# @nudgenest/shared

Shared TypeScript types, constants, utilities, and validation schemas for Nudgenest monorepo.

## Usage

```typescript
import { Review, Plan, PLANS } from '@nudgenest/shared';
```

## Structure

- `types/` - Shared TypeScript interfaces and types
- `constants/` - Shared constants (plans, limits, etc.)
- `utils/` - Shared utility functions
- `validation/` - Shared validation schemas (Joi)
EOF
```

### **STEP 5: Install Dependencies (5 mins)**

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install all dependencies in monorepo
pnpm install
```

---

## ✅ VERIFICATION CHECKLIST

After setup, verify everything works:

- [ ] **Check workspace recognized:**
  ```bash
  pnpm list --depth 0
  # Should list all 6 packages
  ```

- [ ] **Test backend still runs:**
  ```bash
  pnpm backend:dev
  # Should start without errors
  ```

- [ ] **Test frontend still runs:**
  ```bash
  pnpm frontend:dev
  # Should start without errors
  ```

- [ ] **Test Shopify app still runs:**
  ```bash
  pnpm shopify:dev
  # Should start without errors
  ```

- [ ] **Check git status:**
  ```bash
  git status
  # Should show only new files (not secrets)
  ```

- [ ] **Verify secrets ignored:**
  ```bash
  git status | grep -E "\.key|\.pem|\.env"
  # Should return nothing
  ```

---

## 🎨 OPTIONAL: UPDATE PACKAGE NAMES (Later)

If you want scoped package names later (not required now):

```bash
# In each package.json, change name to:
nudgenest          → @nudgenest/backend
review-ui          → @nudgenest/frontend
nudgenest-shpfy-app → @nudgenest/shopify-app
nudge-nest-landing  → @nudgenest/landing
nudgenest-infra    → @nudgenest/infra
```

But this is **NOT REQUIRED** - packages work fine with current names!

---

## 📦 SHARED PACKAGE USAGE (Future)

Once you extract shared types:

**Backend:**
```bash
cd nudgenest
pnpm add @nudgenest/shared --workspace
```

**Frontend:**
```bash
cd review-ui
pnpm add @nudgenest/shared --workspace
```

Then import:
```typescript
import { Review, Plan, PLANS } from '@nudgenest/shared';
```

---

## 🚀 MONOREPO COMMANDS

```bash
# Run all dev servers in parallel
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Run specific package
pnpm backend:dev
pnpm frontend:dev
pnpm shopify:dev

# Add dependency to specific package
pnpm add axios --filter nudgenest

# Add dev dependency to all packages
pnpm add -D prettier -w
```

---

## 🎯 BENEFITS ACHIEVED

✅ **Unified workspace** - Single `pnpm install` for everything
✅ **Shared dependencies** - Less duplication, faster installs
✅ **Shared code** - Types, constants, utils in `@nudgenest/shared`
✅ **Coordinated changes** - Change types once, use everywhere
✅ **Better scripts** - Run all or specific packages easily
✅ **No disruption** - Everything stays in place!

---

## 🔄 ROLLBACK (If Needed)

If something breaks, simply remove:
```bash
rm package.json
rm pnpm-workspace.yaml
rm -rf packages/
```

All your original projects are untouched!

---

## ⏱️ TOTAL TIME: 30 MINUTES

- Step 1: Root package.json (5 mins)
- Step 2: Workspace config (2 mins)
- Step 3: Root .gitignore (3 mins)
- Step 4: Shared package (15 mins)
- Step 5: Install dependencies (5 mins)

**Let's do this! 🚀**
