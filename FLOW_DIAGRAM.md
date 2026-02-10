# Multi-Domain Routing Flow Diagram

## User Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Visits Site                         │
│                     (phynetix.me or admin.*)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   Vercel Edge Middleware│
                │   (middleware.ts)       │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │ Check Authentication    │
                │ & Extract Role from JWT │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │ Domain-Based Validation │
                └────────────┬────────────┘
                             │
                ┌────────────▼────────────┐
                │ Add Security Headers    │
                └────────────┬────────────┘
                             │
                             ▼
                      ┌──────────┐
                      │  React   │
                      │   App    │
                      └──────────┘
```

## Admin User Login Flow

```
┌──────────────────┐
│ Admin visits     │
│ phynetix.me      │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Clicks Login       │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────┐
│ useAuth.signIn()        │
│ - Authenticates         │
│ - Checks role = "admin" │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ getRedirectUrl(true)        │
│ Returns: admin.phynetix.me  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ window.location.href =      │
│ "https://admin.phynetix.me" │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Browser navigates to        │
│ admin.phynetix.me/admin     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Edge Middleware validates   │
│ - Token valid? ✓            │
│ - Role = admin? ✓           │
│ - Domain = admin.*? ✓       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ AdminRoute component        │
│ - Checks isAdmin ✓          │
│ - Validates domain ✓        │
│ - Renders admin dashboard   │
└─────────────────────────────┘
```

## Regular User Login Flow

```
┌──────────────────┐
│ User visits      │
│ phynetix.me      │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Clicks Login       │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────┐
│ useAuth.signIn()        │
│ - Authenticates         │
│ - Checks role = "user"  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ No domain redirect          │
│ (User stays on phynetix.me) │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Navigate to /dashboard      │
│ (React Router)              │
└─────────────────────────────┘
```

## Non-Admin Attempts Admin Access

```
┌──────────────────────────┐
│ Regular user manually    │
│ types admin.phynetix.me  │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Edge Middleware intercepts  │
│ - Token valid? ✓            │
│ - Role = admin? ✗           │
│ - Domain = admin.*? ✓       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 307 Redirect                │
│ Location: phynetix.me/dash  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User redirected to          │
│ phynetix.me/dashboard       │
└─────────────────────────────┘
```

## Admin Logout Flow

```
┌──────────────────────────┐
│ Admin on                 │
│ admin.phynetix.me        │
└────────┬─────────────────┘
         │
         ▼
┌────────────────────┐
│ Clicks Logout      │
└────────┬───────────┘
         │
         ▼
┌─────────────────────────────┐
│ useAuth.signOut()           │
│ - Clears session            │
│ - Checks isAdminDomain()    │
│ - Returns true              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ getRedirectUrl(false, '/')  │
│ Returns: phynetix.me/       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ window.location.href =      │
│ "https://phynetix.me/"      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User redirected to main     │
│ domain landing page         │
└─────────────────────────────┘
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Edge Network                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Vercel Edge Middleware                     │    │
│  │          (middleware.ts)                            │    │
│  │  - JWT token validation                             │    │
│  │  - Domain-based access control                      │    │
│  │  - Server-side redirects                            │    │
│  │  - Security headers                                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Layer 2: Client Application                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          React Application                          │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │   Authentication Hook (useAuth.tsx)      │     │    │
│  │  │   - Domain-aware login                   │     │    │
│  │  │   - Role-based redirects                 │     │    │
│  │  │   - Session management                   │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │   Domain Utilities (domain.ts)           │     │    │
│  │  │   - Domain detection                     │     │    │
│  │  │   - URL generation                       │     │    │
│  │  │   - Access validation                    │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │   Admin Route Guard (AdminRoute.tsx)     │     │    │
│  │  │   - Role verification                    │     │    │
│  │  │   - Domain validation                    │     │    │
│  │  │   - Redirect logic                       │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Layer 3: Backend Services                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Supabase                                   │    │
│  │  - Authentication                                   │    │
│  │  - User roles (user_roles table)                   │    │
│  │  - JWT token generation                             │    │
│  │  - Session storage                                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Domain Routing Matrix

```
╔═══════════════╦══════════════╦════════════════╦═══════════════╗
║   User Role   ║    Domain    ║     Path       ║    Action     ║
╠═══════════════╬══════════════╬════════════════╬═══════════════╣
║ Admin         ║ phynetix.me  ║ /admin/*       ║ Redirect to   ║
║               ║              ║                ║ admin.*       ║
╠═══════════════╬══════════════╬════════════════╬═══════════════╣
║ Admin         ║ admin.*      ║ /admin/*       ║ Allow         ║
╠═══════════════╬══════════════╬════════════════╬═══════════════╣
║ User          ║ phynetix.me  ║ /*             ║ Allow         ║
╠═══════════════╬══════════════╬════════════════╬═══════════════╣
║ User          ║ admin.*      ║ /*             ║ Redirect to   ║
║               ║              ║                ║ phynetix.me   ║
╠═══════════════╬══════════════╬════════════════╬═══════════════╣
║ Unauthenticated║ admin.*     ║ /admin/*       ║ Redirect to   ║
║               ║              ║                ║ phynetix.me   ║
║               ║              ║                ║ /auth         ║
╠═══════════════╬══════════════╬════════════════╬═══════════════╣
║ Any           ║ localhost    ║ /*             ║ Allow (dev)   ║
╚═══════════════╩══════════════╩════════════════╩═══════════════╝
```

## Development vs Production Mode

```
┌─────────────────────────────────────────────────────────────┐
│                    Development (localhost)                   │
│                                                              │
│  • Domain redirects: DISABLED                               │
│  • Middleware: SKIPPED                                      │
│  • Routing: React Router only                               │
│  • Admin/User routes: Both accessible                       │
│  • Testing: Easy and fast                                   │
│                                                              │
│  localhost:5173/admin → AdminRoute checks role → Allow/Block│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Production (*.phynetix.me)                    │
│                                                              │
│  • Domain redirects: ENABLED                                │
│  • Middleware: ACTIVE                                       │
│  • Routing: Edge + React Router                             │
│  • Admin routes: Only on admin.*                            │
│  • Testing: Full security enforcement                       │
│                                                              │
│  admin.phynetix.me → Middleware validates → Allow/Redirect  │
└─────────────────────────────────────────────────────────────┘
```

## Security Chain

```
Request → Edge Middleware → React App → Component
   ↓            ↓              ↓           ↓
JWT Check   Domain Check   useAuth    AdminRoute
   ↓            ↓              ↓           ↓
Role Check  Access Check   Role Verify Domain Check
   ↓            ↓              ↓           ↓
  ✓/✗          ✓/✗            ✓/✗         ✓/✗
   
If any step fails: Redirect to appropriate location
```

## File Dependency Graph

```
                middleware.ts (Edge)
                      │
                      ▼
              ┌───────────────┐
              │  React App    │
              └───────┬───────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   useAuth.tsx   domain.ts    AdminRoute.tsx
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
                 useDomain.ts
                      │
                      ▼
                 domain.ts
```

---

## Quick Reference

**Main Domain:** phynetix.me
**Admin Domain:** admin.phynetix.me

**Key Files:**
- `middleware.ts` - Server-side validation
- `src/utils/domain.ts` - Domain utilities
- `src/hooks/useAuth.tsx` - Authentication
- `src/components/AdminRoute.tsx` - Route guard

**Environment:**
- Development: Domain redirects disabled
- Production: Full domain routing enabled
