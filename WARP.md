# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server with HMR (SSR enabled by default)
npm run dev                # Runs on http://localhost:5173

# Build for production
npm run build              # Uses react-router build

# Start production server
npm run start              # Serves ./build/server/index.js via react-router-serve
```

### Testing & Type Checking
```bash
# Run all tests (Vitest with jsdom)
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking with React Router type generation
npm run typecheck          # Runs react-router typegen && tsc
```

## Architecture Overview

This is a React Router v7 application using **feature-based MVC architecture** with server-side rendering.

### Directory Structure
```
app/
├── features/              # Feature-based organization (MVC per feature)
│   └── auth/              # Example feature
│       ├── controllers/   # React Router loaders/actions + guards
│       ├── models/        # Business logic, API calls, validation
│       ├── views/         # Pure UI components
│       ├── types.ts       # Feature-specific types
│       └── index.ts       # Clean exports
├── lib/                   # Shared utilities
│   ├── api.ts             # API client
│   ├── session.ts         # Session management
│   ├── types.ts           # Global types & Zod schemas
│   └── utils.ts           # Common utilities
├── components/ui/         # Reusable UI components (shadcn/ui)
├── routes/               # Route implementations
└── routes.ts             # Route configuration
```

### MVC Pattern per Feature

Each feature follows strict MVC separation:

- **Models**: Business logic, data validation, API calls (e.g., `login-model.ts`, `email-check-model.ts`)
- **Views**: Pure UI components without business logic (e.g., `LoginForm.tsx`)
- **Controllers**: React Router integration - loaders, actions, guards (e.g., `auth-controller.ts`)

## React Router v7 Implementation

### Route Configuration
Routes are defined in `app/routes.ts` using React Router's `RouteConfig`:

```typescript
export default [
    index("routes/home.tsx"),
    route("/login", "routes/login.tsx"),
    route("/dashboard", "routes/dashboard.tsx"),
    // ...
] satisfies RouteConfig
```

### SSR Configuration
Server-side rendering is enabled in `react-router.config.ts`:

```typescript
export default {
    ssr: true,  // Server-side render by default
} satisfies Config
```

### Data Loading Pattern
Controllers handle React Router's data APIs:

```typescript
// Loader function (data fetching)
static async handleLoginLoader(request: Request): Promise<Response | { email: string }> {
    // Authentication check, redirects, data loading
}

// Action function (form submissions)
static async handleLogin(request: Request): Promise<Response | LoginResponse> {
    // Form processing, API calls, session management
}
```

### Route Protection
Guards are implemented in controllers using redirect responses:

```typescript
static async requireAuth(request: Request): Promise<Response | null> {
    const hasValidSession = await SessionModel.hasValidSession(request)
    if (!hasValidSession) {
        return redirect("/get-started")
    }
    return null
}
```

## Coding Patterns & Conventions

### File Naming
- **Models**: `kebab-case.ts` (e.g., `login-model.ts`, `email-check-model.ts`)
- **Views**: `PascalCase.tsx` (e.g., `LoginForm.tsx`)
- **Controllers**: `kebab-case.ts` (e.g., `auth-controller.ts`)
- **Types**: `types.ts` within each feature

### Import Guidelines
```typescript
// ✅ Good - Clean feature imports
import { AuthController, LoginForm, ValidationModel } from '~/features/auth'

// ✅ Good - Specific lib imports  
import { createSession } from '~/lib/session'

// ❌ Avoid - Deep imports
import { LoginModel } from '~/features/auth/models/login-model'
```

### Model Design Principles
- **Single Responsibility**: Each model has one focused purpose
- **Static Methods**: Models use static methods for business logic
- **No Side Effects**: Models don't directly handle routing or cookies

```typescript
export class LoginModel {
    static validateLoginData(data: LoginFormData) { /* ... */ }
    static async loginUser(data: LoginFormData) { /* ... */ }
}
```

### View Components
Views are pure UI without business logic:

```typescript
export function LoginForm({ email, errors }: LoginFormProps) {
    // Only UI state and event handlers
    // Business logic delegated to models via actions
}
```

### Clean Feature Exports
Each feature exports through `index.ts`:

```typescript
// features/auth/index.ts
export { AuthController } from './controllers/auth-controller'
export { LoginModel } from './models/login-model'  
export { LoginForm } from './views/LoginForm'
export type { LoginFormData } from './models/types'
```

## Environment Configuration

### Environment Variables
The app uses **Cloudflare Workers** environment variables system:

- **Variables** (`wrangler.jsonc` vars): Non-sensitive, committed to git
- **Secrets** (`wrangler secret`): Sensitive, stored securely in Cloudflare
- **VITE_* variables**: Exposed to client (visible in browser DevTools)

### Non-Sensitive Variables (wrangler.jsonc)
```json
{
  "vars": {
    "NODE_ENV": "production"
  }
}
```

### Sensitive Variables (Wrangler Secrets)
```bash
# Set API URL as secret (private)
npx wrangler secret put VITE_LENA_API_URL

# Other secrets as needed
npx wrangler secret put DATABASE_URL
npx wrangler secret put STRIPE_SECRET_KEY
```

### Managing Secrets
```bash
# List secrets (names only)
npx wrangler secret list

# Update/create secret
npx wrangler secret put SECRET_NAME

# Delete secret
npx wrangler secret delete SECRET_NAME
```

### Build Configuration
- **Vite**: Build tool with Tailwind CSS v4 and TypeScript support
- **tsconfigPaths**: Enables `~/` import aliases
- **reactRouter()**: Vite plugin for React Router development

## Testing

### Test Structure
Tests mirror the source structure and focus on business logic:

```
tests/
└── features/
    └── auth/
        └── models/          # Test each model separately
            ├── login-model.test.ts
            ├── email-check-model.test.ts
            └── session-model.test.ts
```

### Running Tests
```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Run specific test file
npm run test -- login-model.test.ts
```

### Test Environment
- **Vitest**: Test runner with jsdom environment
- **Global APIs**: `describe`, `it`, `expect` available globally
- **Setup File**: `tests/setup.ts` for test configuration

### Testing Focus Areas
1. **Model Logic**: Validation, API integration, error handling
2. **Controller Actions**: Request processing, session management
3. **View Components**: User interactions, prop handling
4. **Route Guards**: Authentication and authorization flows

## Key Implementation Notes

### Session Management
- Cookie-based sessions using secure HTTP-only cookies
- Temporary email storage for multi-step auth flows
- Session validation in route guards

### Form Handling
- Uses React Router's `<Form>` component with `action` attribute
- Form data processed in controller actions
- Client-side validation with models + server-side processing

### Error Handling
- API errors mapped to user-friendly field-specific messages
- Network errors handled gracefully with retry prompts
- Type-safe error responses using Zod schemas

### API Integration
- Centralized API client in `lib/api.ts`
- Automatic error parsing and field error extraction
- Type-safe requests/responses with Zod validation

## Deployment

### Cloudflare Workers Production Deployment

This app is deployed on **Cloudflare Workers** with full SSR support.

#### Current Production Setup
- **Worker Name**: `lena-student-web`
- **URL**: `https://lena-student-web.lenaafrica.workers.dev`
- **Runtime**: Cloudflare Workers with React Router v7 SSR

#### Deployment Commands

```bash
# Build for production
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy

# Combined build and deploy
npm run build && npx wrangler deploy
```

#### Local Development

```bash
# Standard React Router dev server (recommended)
npm run dev

# Local development with Workers runtime (for testing)
npm run dev:wrangler

# Build and preview locally
npm run build
npm run start
```

#### Environment Management

**Non-sensitive variables** (committed in `wrangler.jsonc`):
```json
{
  "vars": {
    "NODE_ENV": "production"
  }
}
```

**Sensitive variables** (stored as Wrangler secrets):
```bash
# API URL (kept private)
npx wrangler secret put VITE_LENA_API_URL

# Future secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put STRIPE_SECRET_KEY
```

### Development Workflow

1. **Develop locally** with `npm run dev`
2. **Test changes** with local build: `npm run build && npm run start`
3. **Deploy to production** when ready: `npx wrangler deploy`
4. **Verify deployment** at production URL

### File Structure for Workers

```
workers/
└── app.ts                    # Cloudflare Worker entry point
wrangler.jsonc               # Worker configuration (committed)
worker-configuration.d.ts    # Generated types (gitignored)
```

When working with this codebase, always:
1. Follow the MVC pattern within features
2. Keep models focused on single responsibilities  
3. Use React Router data APIs instead of useEffect for data loading
4. Test business logic in models thoroughly
5. Maintain clean imports through feature index files
6. Leverage React Router v7's SSR and data loading capabilities

<citations>
<document>
<document_type>RULE</document_type>
<document_id>Soas5nvSrDzVGmzDbK8p3i</document_id>
</document>
</citations>
