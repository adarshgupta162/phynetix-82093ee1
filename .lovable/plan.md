
# Business Model Transformation: Batch-Based Access Control System

## Overview
Transform PhyNetix from an open-access educational platform into a batch-based business model where students must purchase specific batches to access content. This involves creating new database schemas, role-based dashboards, payment integration, and complete UI/UX overhaul.

---

## Phase 1: Database Schema Design

### New Tables Required

**1. batches** - Core batch/course offerings
```sql
- id, name, description, price, original_price
- start_date, end_date, enrollment_deadline
- max_students, is_active, created_by
- features (jsonb), syllabus (jsonb)
- thumbnail_url, category (jee_main, jee_advanced, neet, etc.)
```

**2. batch_enrollments** - Student batch purchases
```sql
- id, user_id, batch_id
- enrolled_at, payment_id, payment_status
- expires_at, is_active
- enrolled_by (admin who enrolled if manual)
```

**3. batch_tests** - Link tests to batches
```sql
- id, batch_id, test_id
- unlock_date, is_bonus
```

**4. payments** - Payment records
```sql
- id, user_id, batch_id, amount
- payment_method, transaction_id
- status (pending, completed, failed, refunded)
- payment_gateway_response (jsonb)
- created_at
```

**5. staff_departments** - Department-based access
```sql
- id, name, description
- department_type (finance, academic, operations, marketing)
```

### Updated Role System
Expand `app_role` enum to include:
- `finance_admin` - Revenue, payments, refunds
- `academic_admin` - Tests, questions, content
- `operations_admin` - Student support, enrollments
- `marketing_admin` - Promotions, coupons
- Retain existing: `admin` (super admin), `teacher`, `student`

---

## Phase 2: Admin Dashboard Restructure

### Remove "View as Student" Functionality
- Remove toggle from AdminLayout
- Remove toggle from DashboardLayout
- Admins stay on admin panel; students cannot access admin routes

### New Department-Specific Dashboards

**Finance Dashboard** (`/admin/finance`)
- Revenue overview (daily/weekly/monthly)
- Payment transactions table
- Refund management
- Coupon code management
- Financial reports export

**Academic Dashboard** (`/admin/academic`)
- Test creation and management
- Question bank management
- Batch-test assignments
- Content scheduling

**Operations Dashboard** (`/admin/operations`)
- Student enrollments management
- Manual enrollment capability
- Student support tickets
- Batch capacity monitoring

**Main Admin Dashboard** (`/admin`)
- Overview of all departments
- Quick stats from each area
- Recent activity across platform
- Access to all sub-dashboards

---

## Phase 3: Student Experience Overhaul

### New Student Dashboard
**Before Login:**
- Landing page shows batch listings
- Pricing for each batch
- "Buy Now" / "Enroll" CTAs

**After Login (No Batch):**
- Dashboard shows available batches to purchase
- "You haven't enrolled in any batch yet"
- Browse batches CTA

**After Login (With Batch):**
- Show only enrolled batch content
- Test library filtered by batch
- Progress specific to batch
- Batch expiry information

### Test Library Changes
- Filter tests by enrolled batches only
- Show "Locked" state for non-enrolled batch tests
- Batch selector if enrolled in multiple batches

### New Pages
- `/batches` - Public batch catalog
- `/batch/:batchId` - Batch details + enrollment
- `/my-batches` - Student's enrolled batches
- `/checkout/:batchId` - Payment flow

---

## Phase 4: Payment Integration

### Payment Flow
1. Student selects batch
2. Apply coupon (optional)
3. Redirect to payment gateway (Razorpay/Stripe)
4. Webhook confirms payment
5. Auto-create enrollment record
6. Send confirmation email

### Admin Manual Enrollment
- Operations admin can enroll students manually
- Record reason for manual enrollment
- Audit trail for compliance

---

## Phase 5: Access Control Implementation

### RLS Policy Updates
All test-related tables get batch-based policies:
```sql
-- Example: test_section_questions
CREATE POLICY "Students can view questions for enrolled batches"
ON test_section_questions FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM batch_tests bt
    JOIN batch_enrollments be ON be.batch_id = bt.batch_id
    WHERE bt.test_id = test_section_questions.test_id
    AND be.user_id = auth.uid()
    AND be.is_active = true
  )
);
```

### Edge Function Security
- `start-test` - Verify batch enrollment before allowing
- `submit-test` - Same verification
- New `create-enrollment` - Handle payment webhook

---

## Phase 6: UI Components

### New Components Needed
- `BatchCard` - Display batch info with pricing
- `BatchCatalog` - Grid of available batches
- `EnrollmentBadge` - Show enrollment status
- `PaymentModal` - Handle checkout
- `BatchSelector` - For multi-batch students
- `FinanceDashboard` - Finance admin view
- `AcademicDashboard` - Academic admin view
- `OperationsDashboard` - Operations admin view

### Modified Components
- `DashboardLayout` - Remove admin toggle, add batch context
- `AdminLayout` - Remove student view toggle
- `TestLibrary` - Add batch filtering
- `AdminRoute` - Support department-based access

---

## Phase 7: File Changes Summary

### New Files (~25 files)
```text
src/pages/
  ├── BatchCatalog.tsx
  ├── BatchDetails.tsx
  ├── Checkout.tsx
  ├── MyBatches.tsx
  └── admin/
      ├── FinanceDashboard.tsx
      ├── AcademicDashboard.tsx
      ├── OperationsDashboard.tsx
      ├── BatchManagement.tsx
      ├── EnrollmentManagement.tsx
      ├── PaymentManagement.tsx
      └── CouponManagement.tsx

src/components/
  ├── batch/
  │   ├── BatchCard.tsx
  │   ├── BatchCatalog.tsx
  │   ├── BatchSelector.tsx
  │   └── EnrollmentBadge.tsx
  └── payment/
      └── CheckoutFlow.tsx

src/hooks/
  ├── useBatches.tsx
  └── useEnrollment.tsx

supabase/functions/
  ├── create-enrollment/index.ts
  ├── payment-webhook/index.ts
  └── verify-enrollment/index.ts
```

### Modified Files (~15 files)
```text
src/App.tsx - Add new routes
src/lib/permissions.ts - Add new roles/permissions
src/hooks/useAuth.tsx - Add batch context
src/components/layout/DashboardLayout.tsx - Remove admin toggle
src/components/layout/AdminLayout.tsx - Remove student toggle, add dept nav
src/pages/Dashboard.tsx - Show batch-specific content
src/pages/TestLibrary.tsx - Filter by enrolled batches
src/pages/admin/AdminDashboard.tsx - Overview dashboard
src/pages/admin/AdminUsers.tsx - Add enrollment management
src/components/AdminRoute.tsx - Support department roles
```

---

## Implementation Order

1. **Week 1: Database + Backend**
   - Create new tables with migrations
   - Update RLS policies
   - Create enrollment edge functions

2. **Week 2: Admin Dashboards**
   - Finance dashboard
   - Academic dashboard (refactor existing)
   - Operations dashboard
   - Remove view toggles

3. **Week 3: Student Experience**
   - Batch catalog pages
   - Enrollment flow
   - Filtered test library
   - My batches page

4. **Week 4: Payment Integration**
   - Payment gateway setup
   - Checkout flow
   - Webhooks
   - Manual enrollment for admins

5. **Week 5: Polish + Testing**
   - End-to-end testing
   - Edge cases
   - Mobile responsiveness
   - Documentation

---

## Technical Considerations

### Security
- All batch access verified server-side via RLS
- Payment webhooks verify signatures
- Manual enrollments require admin audit trail

### Performance
- Batch enrollment cached in auth context
- Lazy load test content after enrollment verification

### Scalability
- Batches can have multiple tests
- Students can enroll in multiple batches
- Support for batch bundles/combos later

---

## Questions to Confirm

Before implementation, please confirm:
1. **Payment Gateway**: Which gateway to use? (Razorpay recommended for India)
2. **Batch Structure**: Can one test belong to multiple batches?
3. **Enrollment Duration**: Time-based (expiry date) or permanent access?
4. **Refund Handling**: Manual refunds only or automated?
5. **Free Batches**: Support for free trial batches?
