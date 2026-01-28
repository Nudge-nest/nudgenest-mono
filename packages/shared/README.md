# @nudgenest/shared

Shared TypeScript types, constants, utilities, and validation schemas for the Nudgenest monorepo.

## Purpose

This package contains code that is shared across multiple Nudgenest packages (backend, frontend, Shopify app) to ensure consistency and reduce duplication.

## Structure

```
src/
├── types/          # Shared TypeScript interfaces and types
├── constants/      # Shared constants (pricing plans, limits, etc.)
├── utils/          # Shared utility functions
└── validation/     # Shared Joi validation schemas
```

## Usage

Install in any package:

```bash
pnpm add @nudgenest/shared --workspace
```

Import shared code:

```typescript
// Import types
import { Review, Plan, Subscription } from '@nudgenest/shared/types';

// Import constants
import { PLANS, LIMITS } from '@nudgenest/shared/constants';

// Import utilities
import { validateEmail, formatCurrency } from '@nudgenest/shared/utils';

// Import validation schemas
import { reviewSchema, merchantSchema } from '@nudgenest/shared/validation';
```

## Development

```bash
# Build TypeScript
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm type-check

# Clean build files
pnpm clean
```

## Adding New Shared Code

1. Add your code to the appropriate directory (`types/`, `constants/`, `utils/`, or `validation/`)
2. Export from the directory's `index.ts`
3. Run `pnpm build` to compile
4. The code is now available to all packages

## Benefits

- ✅ Type safety across all packages
- ✅ Single source of truth for business logic
- ✅ Reduced code duplication
- ✅ Easier refactoring
- ✅ Consistent validation rules
