# Custom Question Editor - UI Layout

## Visual Layout Description

### Full Editor View
```
┌─────────────────────────────────────────────────────────────────┐
│ Header                                                           │
│ [← Back] Question 1  [single_choice]  [●Saved]                 │
│                    [Save] [Duplicate] [Delete] [Fullscreen]     │
├─────────────────────────────────────────────────────────────────┤
│ Tabs: [Question] [Solution] [Settings]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Content Area - Changes based on active tab]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Question Mode Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Question Text (supports LaTeX)                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Enter question text...                                       │ │
│ │ Use LaTeX: $\frac{a}{b}$ for fractions                      │ │
│ │                                                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Question Diagram (Optional)                                     │
│ [Add Image] or [📷 Image attached] [×]                         │
│                                                                  │
│ Options (Enter → next, click to mark correct)                  │
│ ┌──┬──────────────────────────────────┬─────────┬────────────┐ │
│ │↕│ A │ [option text____________] │ ( ) correct│[📷][×]│ │
│ │↕│ B │ [option text____________] │ ( ) correct│[📷][×]│ │
│ │↕│ C │ [option text____________] │ ( ) correct│[📷][×]│ │
│ │↕│ D │ [option text____________] │ ( ) correct│[📷][×]│ │
│ └──┴──────────────────────────────────┴─────────┴────────────┘ │
│ [+ Add Option]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Solution Mode Layout (Split View)
```
┌──────────────────────────┬──────────────────────────────────────┐
│ Solution Editor          │ Live Preview                         │
│ [Clear Solution]         │                                      │
├──────────────────────────┼──────────────────────────────────────┤
│                          │                                      │
│ ┌──────────────────────┐ │  Rendered solution with LaTeX:      │
│ │ Write solution...    │ │                                      │
│ │ Use LaTeX:           │ │  The formula x² + y² = z²          │
│ │ $\frac{a}{b}$       │ │  represents the Pythagorean         │
│ │                      │ │  theorem...                          │
│ │                      │ │                                      │
│ │                      │ │  [Solution image if uploaded]       │
│ └──────────────────────┘ │                                      │
│                          │                                      │
│ Solution Image (Optional)│                                      │
│ [Add Image]              │                                      │
│                          │                                      │
└──────────────────────────┴──────────────────────────────────────┘
```

### Settings Mode Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Marking Scheme                                                   │
│ ┌────────────────┬────────────────┐                             │
│ │ Marks          │ Negative Marks │                             │
│ │ [____4____]   │ [____1____]   │                             │
│ └────────────────┴────────────────┘                             │
│                                                                  │
│ Difficulty Level                                                │
│ [Medium ▼] (Easy / Medium / Hard)                              │
│                                                                  │
│ Time Limit (Optional, in seconds)                               │
│ [_________] Leave empty for no time limit                      │
│                                                                  │
│ Question Number                                                  │
│ 1  (automatically managed)                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Fullscreen Mode
```
┌─────────────────────────────────────────────────────────────────┐
│ [Exit Fullscreen (ESC)] Question 1  [●Saved]   [Save] [Delete] │
├─────────────────────────────────────────────────────────────────┤
│ [Question] [Solution] [Settings]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                     [Full Content Area]                          │
│                     No sidebars or distractions                  │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## UI Components Used

### From shadcn/ui
- Button - All action buttons
- Tabs - Mode switching
- Textarea - Question/solution text
- Input - Option text, settings
- Label - Field labels
- RadioGroup - Single choice answers
- Checkbox - Multiple choice answers
- Select - Difficulty dropdown

### Custom Components
- QuestionImageUpload - Reusable image upload
- LaTeXPreview - Real-time rendering
- FullscreenToggle - Fullscreen control
- OptionsEditor - Dynamic options list

## Color Coding

### Save Status
- 🟢 Green "Saved" - All changes saved
- 🟡 Yellow "Saving..." - Save in progress
- 🟡 Yellow "Unsaved changes" - Pending changes

### UI Elements
- Primary actions - Primary color (blue/accent)
- Destructive actions - Red/destructive
- Secondary actions - Ghost/outline
- Labels - Muted foreground

## Keyboard Navigation

```
Tab       → Move between fields
Enter     → Next option (in options editor)
ESC       → Exit fullscreen
Ctrl+S    → Manual save (browser default)
```

## Responsive Behavior

### Desktop (Primary Target)
- Full split-view in Solution mode
- All features visible
- Optimal editing experience

### Tablet
- Split-view may stack vertically
- Touch-friendly controls
- Full functionality maintained

### Mobile
- Not optimized (desktop-first design)
- Admin panel typically accessed on desktop

## Dark Mode Support

All components support dark mode through:
- Tailwind dark: classes
- shadcn/ui theming
- CSS custom properties
- Automatic color adjustments

## Accessibility

### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- ESC key support

### Screen Readers
- ARIA labels where needed
- Semantic HTML structure
- Form labels properly associated

### Visual
- Sufficient color contrast
- Focus indicators visible
- Error states clearly marked
