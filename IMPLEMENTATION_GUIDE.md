# Admin Subdomain Routing - Implementation Guide

## Important Note About This Project

This repository is a **Vite + React** application, not a Next.js application. The `middleware.ts` file provided follows the exact specifications requested (Next.js middleware with NextRequest/NextResponse), but **it will not execute in a Vite application deployed to Vercel**.

## Why Middleware.ts Won't Work

Next.js middleware (`middleware.ts` at project root) is a Next.js-specific feature that requires the Next.js framework to execute. When you deploy a Vite application to Vercel, the middleware.ts file is ignored because:

1. Vercel detects the project as a Vite project (via `vite.config.ts`)
2. The build command uses Vite (`"build": "vite build"`)
3. Next.js middleware only runs in Next.js applications

## Three Options to Implement Subdomain Routing

### Option 1: Client-Side Subdomain Detection (Easiest for Vite/SPA)

Since this is a Vite + React SPA, the simplest working solution is to detect the subdomain on the client side and handle routing accordingly.

**Implementation:**

A client-side utility has been provided in `src/utils/subdomainRouter.ts`. Use it in your App component:

```typescript
// In your App.tsx or main router component
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAdminSubdomain, getSubdomainPath } from './utils/subdomainRouter';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect based on subdomain
    if (isAdminSubdomain()) {
      const targetPath = getSubdomainPath(location.pathname);
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    // Your app JSX
  );
}
```

**Pros:**
- ✅ Works immediately with existing Vite setup
- ✅ No deployment configuration needed
- ✅ Simple to implement
- ✅ No breaking changes

**Cons:**
- ❌ Client-side only (slight delay before redirect)
- ❌ SEO implications (search engines see original URL first)
- ❌ Not a true server-side rewrite

### Option 2: Use Vercel Configuration (Limited for SPAs)

Update your `vercel.json` file to use Vercel's native rewrite functionality with host-based matching:

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/admin/:path*",
      "has": [
        {
          "type": "host",
          "value": "admin\\.phynetix\\.me"
        }
      ]
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Note:** This approach has limitations for SPAs because Vite serves everything through `index.html` and React Router handles routing on the client side. Server-side rewrites to `/admin/*` won't work as expected since those paths don't exist on the server.

This option is best combined with client-side routing or requires server-side rendering.

### Option 3: Migrate to Next.js (Use Existing Middleware)

If you want to use the `middleware.ts` file provided, you need to migrate your project from Vite to Next.js:

**Steps to migrate:**

1. **Install Next.js:**
   ```bash
   npm install next@latest react@latest react-dom@latest
   ```

2. **Create Next.js configuration:**
   ```javascript
   // next.config.js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
   }
   
   module.exports = nextConfig
   ```

3. **Update package.json scripts:**
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "next lint"
     }
   }
   ```

4. **Restructure your project:**
   - Move `src/pages/*` to `app/*` (for App Router)
   - Convert React Router routes to Next.js file-based routing
   - Update imports and components for Next.js conventions

5. **Deploy:**
   - The existing `middleware.ts` will automatically work
   - Vercel will detect Next.js and enable middleware support

**Pros:**
- ✅ Full middleware capabilities
- ✅ Better performance with SSR
- ✅ More flexible routing
- ✅ Can execute custom logic

**Cons:**
- ❌ Significant refactoring required
- ❌ Need to learn Next.js conventions
- ❌ Breaking changes to existing code

## Option 4: Use Vercel Edge Functions

Create a Vercel Edge Function to handle subdomain rewrites:

**Note:** This is more complex and may not provide significant benefits over client-side routing for a SPA.

## Recommended Approach

For this **Vite + React SPA project**, we recommend **Option 1 (Client-Side Detection)** because:

1. It works immediately without any deployment configuration
2. It's the standard pattern for SPA routing
3. No refactoring of existing Vite setup needed
4. Simple to implement and maintain
5. Compatible with React Router

If you need true server-side rewrites, consider **Option 3 (Migrate to Next.js)**.

## Current Status

The repository currently contains:
- ✅ `middleware.ts` - Next.js middleware (as requested in problem statement, but won't work with Vite)
- ✅ `MIDDLEWARE_DOCS.md` - Documentation for Next.js middleware
- ✅ `src/utils/subdomainRouter.ts` - Client-side subdomain routing utility (working solution for Vite)
- ✅ `IMPLEMENTATION_GUIDE.md` - This guide explaining all options
- ⏸️ Vite configuration intact

## Next Steps

**To implement the working solution for this Vite project:**

1. Use the provided `src/utils/subdomainRouter.ts` utility
2. Update your `App.tsx` or main router component to call the subdomain detection functions
3. Test locally with hosts file or ngrok to simulate subdomains
4. Deploy to Vercel and configure your `admin.phynetix.me` subdomain

**To use the Next.js middleware:**

1. Follow Option 3 to migrate the project to Next.js
2. The existing `middleware.ts` will automatically work after migration

---

**Questions?** 
- Check Vercel documentation on [rewrites](https://vercel.com/docs/project-configuration#project-configuration/rewrites)
- Review [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- Learn about [Next.js migration](https://nextjs.org/docs/migrating)
- Review [React Router documentation](https://reactrouter.com/) for client-side routing
