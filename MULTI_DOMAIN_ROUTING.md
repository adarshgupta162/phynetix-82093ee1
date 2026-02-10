# Multi-Domain Routing System Documentation

## Overview

This document explains the multi-domain routing system implemented for the Phynetix application. The system supports two domains:
- **phynetix.me** - Main domain for regular users
- **admin.phynetix.me** - Admin subdomain for administrative users

## Architecture

The multi-domain routing system consists of three layers:

### 1. Edge Middleware (`middleware.ts`)
Server-side domain validation that runs on Vercel's Edge Network.

**Responsibilities:**
- Validates user authentication from Supabase JWT tokens
- Checks user role (admin vs. user)
- Performs domain-based redirects
- Adds security headers

**Logic:**
- Non-admin users on `admin.phynetix.me` → Redirect to `phynetix.me/dashboard`
- Unauthenticated users accessing admin routes → Redirect to `phynetix.me/auth`
- Admin users on `phynetix.me` accessing `/admin/*` routes → Redirect to `admin.phynetix.me`

### 2. Client-Side Domain Utilities (`src/utils/domain.ts`)
Helper functions for domain detection and URL generation.

**Functions:**
- `getCurrentDomain()` - Gets current hostname
- `isAdminDomain()` - Checks if on admin subdomain
- `isMainDomain()` - Checks if on main domain
- `getRedirectUrl(isAdmin, targetPath)` - Generates appropriate redirect URL
- `validateDomainAccess(isAdmin)` - Validates domain access
- `getMainDomainUrl(path)` - Gets main domain URL
- `getAdminDomainUrl(path)` - Gets admin domain URL

**Development Mode:**
In localhost, domain-based redirects are disabled. All routing is handled by React Router.

### 3. Authentication Hook (`src/hooks/useAuth.tsx`)
Enhanced with domain-aware login and logout logic.

**Login Flow:**
1. User authenticates via Supabase
2. System checks user role (admin or user)
3. If admin → Redirect to `admin.phynetix.me`
4. If user → Stay on `phynetix.me`

**Logout Flow:**
1. Clear session and role state
2. If on admin domain → Redirect to `phynetix.me`
3. Otherwise → Navigate to home page

### 4. Admin Route Guard (`src/components/AdminRoute.tsx`)
Enhanced component that protects admin routes with domain validation.

**Features:**
- Checks authentication status
- Verifies admin role
- Validates domain access
- Redirects unauthorized users
- Shows loading state during verification

## User Flows

### Admin User Login
1. Admin logs in on `phynetix.me`
2. Authentication succeeds, role is identified as "admin"
3. User is redirected to `admin.phynetix.me/admin`
4. All admin navigation happens on admin subdomain

### Regular User Login
1. User logs in on `phynetix.me`
2. Authentication succeeds, role is identified as "user"
3. User stays on `phynetix.me` and navigates to dashboard
4. Cannot access admin routes

### Non-Admin Attempts Admin Access
1. User manually types `admin.phynetix.me`
2. Edge middleware checks authentication and role
3. User is redirected to `phynetix.me/dashboard`

### Admin Logout
1. Admin clicks logout on `admin.phynetix.me`
2. Session is cleared
3. User is redirected to `phynetix.me`

## Configuration

### Environment Variables

The application requires the following environment variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Vercel Setup:**
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable with values from your Supabase project
4. Ensure variables are available for all environments (Production, Preview, Development)

**Note:** These are regular environment variables, not Vercel secrets. The VITE_ prefix makes them available to the client-side build.

### Vercel Configuration (`vercel.json`)
- Configures domain rewrites for SPA routing
- Sets security headers
- Defines environment variables

### Domain Setup
Both `phynetix.me` and `admin.phynetix.me` must point to the same Vercel project.

**Steps:**
1. Add both domains in Vercel project settings
2. Configure DNS records for both domains
3. Ensure SSL certificates are active

## Security Features

1. **Double Verification**: Role is checked both client-side and server-side
2. **JWT Token Validation**: Tokens are decoded and expiry is checked
   - **Important Note**: The current implementation uses basic JWT decoding without signature verification
   - For enhanced production security, implement proper JWT signature verification using:
     - Supabase JWT secret from environment variables
     - Supabase's official token verification methods
     - A JWT verification library like 'jose' or '@supabase/supabase-js'
3. **Session Management**: Supabase handles secure session storage
4. **Domain Isolation**: Strict domain matching prevents access through unintended domains
5. **Security Headers**: 
   - Strict-Transport-Security
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Referrer-Policy

## Development vs. Production

### Development (localhost)
- Domain-based redirects are **disabled**
- All routing handled by React Router
- Both admin and user routes accessible on same domain
- Easier testing and development

### Production (phynetix.me domains)
- Full domain-based routing **enabled**
- Edge middleware enforces domain rules
- Cross-domain redirects for role-based access
- Enhanced security through domain isolation

## Testing Checklist

- [ ] Admin user logs in → redirected to admin.phynetix.me
- [ ] Normal user logs in → stays on phynetix.me
- [ ] Non-admin manually types admin.phynetix.me → blocked/redirected
- [ ] Admin user on phynetix.me accessing /admin → redirected to admin subdomain
- [ ] User logs out from admin domain → redirected to main domain
- [ ] Direct URL access to admin routes by non-admin → blocked
- [ ] Page refresh on admin domain with valid admin session → works
- [ ] Token expiration on admin domain → proper handling
- [ ] No infinite redirect loops in any scenario

## Troubleshooting

### Issue: Infinite redirect loop
**Solution:** Check that domain detection logic correctly identifies localhost and doesn't trigger redirects in development.

### Issue: Admin cannot access admin domain
**Solution:** 
1. Verify user role in Supabase `user_roles` table
2. Check JWT token contains correct role
3. Clear browser cookies and try again

### Issue: User stays on wrong domain
**Solution:**
1. Check Edge middleware is deployed
2. Verify domain DNS configuration
3. Check Vercel logs for middleware execution

### Issue: 403/404 errors on admin domain
**Solution:**
1. Ensure both domains point to same Vercel project
2. Check vercel.json rewrites configuration
3. Verify middleware.ts is at project root

## File Structure

```
├── middleware.ts                  # Vercel Edge Middleware
├── vercel.json                    # Vercel configuration
├── .env.example                   # Environment variables template
├── src/
│   ├── utils/
│   │   └── domain.ts             # Domain utility functions
│   ├── hooks/
│   │   ├── useAuth.tsx           # Enhanced authentication hook
│   │   └── useDomain.ts          # Domain utilities hook
│   ├── components/
│   │   └── AdminRoute.tsx        # Enhanced admin route guard
│   └── App.tsx                   # Route configuration
```

## Additional Notes

- The system is designed to be transparent to users
- Redirects happen automatically without user intervention
- All domain logic gracefully degrades in development
- The implementation follows React and TypeScript best practices
- Code includes comprehensive JSDoc comments

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Verify Supabase authentication setup
3. Review domain DNS configuration
4. Check browser console for client-side errors
