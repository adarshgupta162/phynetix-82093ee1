# Time Analysis Page - Component Structure

## Visual Component Hierarchy

```
TimeAnalysis Component
│
├── Section 1: Time Efficiency Summary
│   ├── Glass Card Container
│   └── 3-Column Grid (responsive)
│       ├── Overall Efficiency (Clock icon)
│       │   ├── Large percentage number
│       │   └── Description text
│       ├── Performance Verdict (Target icon)
│       │   ├── Color-coded verdict (Excellent/Average/Poor)
│       │   └── Benchmark note
│       └── Time on Correct (Zap icon)
│           ├── Minutes display
│           └── Total time context
│
├── Section 2: Time Buckets vs Accuracy
│   ├── Glass Card Container
│   ├── Description text
│   ├── Bar Chart (Recharts)
│   │   ├── X-axis: Time ranges (0-30, 30-60, etc.)
│   │   ├── Y-axis: Accuracy percentage
│   │   └── Bars: Blue (normal) / Red (worst bucket)
│   └── Alert Box (conditional)
│       ├── AlertTriangle icon
│       ├── "Worst Performance Block" header
│       └── Detailed insight message
│
├── Section 3: Subject-wise Time Allocation
│   ├── Glass Card Container
│   ├── Description text
│   └── Subject Cards (loop)
│       ├── Subject Header
│       │   ├── Name + Stats (questions, accuracy)
│       │   └── Time spent vs ideal time
│       ├── Dual Progress Bars
│       │   ├── Your time (blue bar)
│       │   └── Ideal time (green bar)
│       └── Recommendation Badge (conditional)
│           ├── Over-invested (yellow warning)
│           ├── Under-invested (green suggestion)
│           └── Optimal (green checkmark)
│
├── Section 4: Speed Trap Detection
│   ├── Glass Card Container
│   ├── Description text
│   ├── 3-Metric Grid
│   │   ├── Slow Questions Count
│   │   ├── Slow Accuracy %
│   │   └── Fast Accuracy %
│   └── Impact Alert (conditional)
│       ├── Significant Impact (red, XCircle icon)
│       └── No Impact (green, CheckCircle icon)
│
└── Section 5: Actionable Strategy
    ├── Glass Card Container
    ├── Description text
    └── Strategy Rules (numbered 1-5)
        ├── Rule Card 1: Max time per question
        ├── Rule Card 2: When to skip
        ├── Rule Card 3: Subject time adjustment
        ├── Rule Card 4: Time block alert
        └── Rule Card 5: Efficiency tip
```

---

## Color Coding System

### Status Colors
- **Success/Excellent**: Green (`text-success`, `bg-success/10`)
- **Warning/Average**: Yellow (`text-warning`, `bg-warning/10`)
- **Destructive/Poor**: Red (`text-destructive`, `bg-destructive/10`)
- **Primary**: Blue (`text-primary`, `bg-primary/10`)

### Subject Colors (matching existing system)
- **Physics**: `hsl(217, 91%, 60%)` (Blue)
- **Chemistry**: `hsl(142, 76%, 45%)` (Green)
- **Mathematics**: `hsl(45, 93%, 50%)` (Yellow)

---

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Cards stack vertically
- Charts maintain full width
- Text sizes adjusted

### Tablet (768px - 1024px)
- 2-column grids where applicable
- Side-by-side metrics
- Optimized chart sizing

### Desktop (> 1024px)
- 3-column grids for metrics
- Full layout as designed
- Maximum content width

---

## Animation System

All sections use Framer Motion with staggered entrance:
- **Section 1**: `delay: 0` (instant)
- **Section 2**: `delay: 0.1` (100ms)
- **Section 3**: `delay: 0.2` (200ms)
- **Section 4**: `delay: 0.3` (300ms)
- **Section 5**: `delay: 0.4` (400ms)

Animation: `opacity: 0 → 1` and `y: 20 → 0` (fade up effect)

---

## Data Calculations

### Time Efficiency (Section 1)
```typescript
efficiency = (timeOnCorrectAnswers / totalTimeUsed) × 100

verdict = efficiency >= 80 ? "Excellent"
        : efficiency >= 60 ? "Average"
        : "Poor"
```

### Time Buckets (Section 2)
```typescript
bucketSize = 30 minutes
numBuckets = ceil(totalTestTime / bucketSize)

// Assign questions to buckets by cumulative time
// Calculate accuracy per bucket
// Find worst bucket by min(accuracy)
```

### Subject Time Allocation (Section 3)
```typescript
idealTime[subject] = (questionsInSubject / totalQuestions) × totalTime
difference = actualTime - idealTime

overInvested = difference > idealTime × 0.2
underInvested = difference < -idealTime × 0.2
```

### Speed Trap Detection (Section 4)
```typescript
slowQuestions = filter(timeSpent > 90 seconds)
fastQuestions = filter(timeSpent <= 90 seconds)

slowAccuracy = correct(slowQuestions) / slowQuestions.length
fastAccuracy = correct(fastQuestions) / fastQuestions.length

significantImpact = slowAccuracy < (fastAccuracy - 15%)
```

### Strategy Generation (Section 5)
```typescript
rules = []

// Rule 1: Time limit
if (significantImpact) {
  rules.push("Limit to 90 seconds per question")
} else {
  rules.push(`Aim for ${avgTime} seconds per question`)
}

// Rule 2: Skipping
if (slowQuestions > 20% of total) {
  rules.push("Skip questions taking >2 minutes")
}

// Rule 3-4: Subject and time block recommendations
// Rule 5: Efficiency boost

return rules.slice(0, 5) // Max 5 rules
```

---

## Edge Case Handling

### No Time Data
```tsx
if (!hasActualTimeData) {
  return <FriendlyMessage />
}
```

### Empty Buckets
```typescript
const filtered = timeBuckets.filter(b => b.total > 0)
```

### Division by Zero
```typescript
const efficiency = totalTimeUsed > 0 
  ? (timeOnCorrect / totalTimeUsed) × 100 
  : 0
```

### Single Subject
Layout still works correctly with one iteration of subject cards.

---

## Integration Points

### Sidebar Navigation
```typescript
// In AnalysisSidebar.tsx
{ id: "time", label: "Time Analysis", icon: Clock }
```

### Page Routing
```typescript
// In AnalysisPage.tsx
{activeTab === "time" && (
  <TimeAnalysis
    questions={testData.questions}
    totalTimeSeconds={testData.totalTimeSeconds}
    hasTimeData={testData.hasTimeData}
  />
)}
```

### Data Source
```typescript
// From Supabase test_attempts table
const timePerQuestion = attempt.time_per_question || {}
const hasTimeData = Object.keys(timePerQuestion).length > 0
```

---

## Accessibility Features

1. **Icons + Text**: Never rely on color alone
2. **Contrast Ratios**: All text meets WCAG AA standards on dark background
3. **Semantic HTML**: Proper heading hierarchy (h1 → h2 → h3)
4. **Focus Indicators**: Visible focus states on interactive elements
5. **Alt Text**: Icons have descriptive purposes
6. **Readable Font Sizes**: Minimum 12px, body text 14-16px

---

## Performance Optimizations

1. **useMemo Hooks**: All calculations memoized
   - `timeStats`
   - `timeBuckets`
   - `subjectStats`
   - `speedTraps`
   - `strategy`

2. **Single-Pass Algorithms**: O(n) complexity where possible

3. **Conditional Rendering**: Only render alerts when needed

4. **Efficient Data Structures**:
   - `Record<string, T>` for O(1) lookups
   - `Map` for subject grouping
   - Array methods (filter, map, reduce)

---

## Testing Checklist

### Functional Tests
- [ ] Section 1 calculates efficiency correctly
- [ ] Section 2 assigns questions to correct time buckets
- [ ] Section 3 compares actual vs ideal time
- [ ] Section 4 detects speed traps accurately
- [ ] Section 5 generates relevant strategies

### UI/UX Tests
- [ ] All sections visible and properly styled
- [ ] Charts render correctly
- [ ] Alert boxes appear when conditions met
- [ ] Responsive on mobile, tablet, desktop
- [ ] Animations smooth and non-intrusive

### Edge Case Tests
- [ ] No time data: Friendly message shown
- [ ] All correct: 100% efficiency
- [ ] All incorrect: 0% efficiency
- [ ] Single subject: Layout works
- [ ] Short test: Single bucket
- [ ] Long test: Multiple buckets

---

## Maintenance Notes

### Constants to Adjust
```typescript
const IDEAL_TIME_THRESHOLD = 90; // seconds per question
const EXCELLENT_EFFICIENCY = 80; // percentage
const AVERAGE_EFFICIENCY = 60; // percentage
const BUCKET_SIZE = 30 * 60; // seconds (30 minutes)
```

### Adding New Sections
1. Add new section in TimeAnalysis component
2. Increment animation delay
3. Update documentation
4. Add tests

### Modifying Strategy Rules
Edit the `strategy` useMemo calculation to change rule generation logic.

---

## Browser Compatibility

- **Chrome**: ✅ Fully supported
- **Firefox**: ✅ Fully supported
- **Safari**: ✅ Fully supported
- **Edge**: ✅ Fully supported
- **Mobile Safari**: ✅ Fully supported
- **Mobile Chrome**: ✅ Fully supported

Recharts and Framer Motion are well-supported across all modern browsers.
