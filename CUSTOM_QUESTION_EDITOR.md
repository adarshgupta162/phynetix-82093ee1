# Custom Question Editor Implementation

## Overview
This document describes the custom question editor implementation for normal tests in the Phynetix platform.

## Architecture

### Components Structure
```
src/components/QuestionEditor/
├── QuestionEditor.tsx       # Main container with routing, state, autosave
├── QuestionMode.tsx         # Question text, image, options editing
├── SolutionMode.tsx         # Solution with split-view preview
├── SettingsMode.tsx         # Marks, difficulty, metadata
├── OptionsEditor.tsx        # Dynamic options with images
├── LaTeXPreview.tsx         # Debounced LaTeX rendering
└── FullscreenToggle.tsx     # Fullscreen mode control
```

### State Management
- Uses React hooks for local state
- `useAutoSave` custom hook for automatic saving every 7 seconds
- Tracks save status: 'saved' | 'saving' | 'unsaved'
- Warns user on navigation if unsaved changes exist

### Data Flow
1. **Load**: Fetch question from `test_section_questions` table
2. **Edit**: Update local state, mark as unsaved
3. **Save**: Auto-save or manual save to database
4. **Navigate**: Back to test editor or duplicate/delete

## Database Schema

### test_section_questions Table
```sql
{
  id: UUID,
  section_id: UUID,
  test_id: UUID,
  question_number: INTEGER,
  question_text: TEXT,
  image_url: TEXT,                    -- Question diagram URL
  options: JSONB,                      -- [{ label, text, image_url }]
  correct_answer: JSONB,               -- "A" or ["A", "C"] or "42"
  solution_text: TEXT,
  solution_image_url: TEXT,
  marks: INTEGER,
  negative_marks: INTEGER,
  difficulty: TEXT,                    -- 'easy' | 'medium' | 'hard'
  time_seconds: INTEGER,
  order_index: INTEGER
}
```

### Options Format
```json
[
  { "label": "A", "text": "Option A text", "image_url": "https://..." },
  { "label": "B", "text": "Option B text", "image_url": null },
  { "label": "C", "text": "Option C text", "image_url": null },
  { "label": "D", "text": "Option D text", "image_url": null }
]
```

### Correct Answer Format
- **Single Choice**: `"A"` (string)
- **Multiple Choice**: `["A", "C"]` (array of strings)
- **Integer**: `"42"` (string containing number)

## Features

### Question Mode
- Large textarea for question text with LaTeX support
- Optional question image upload (stores URL only)
- Dynamic options editor:
  - Add/remove options (minimum 2)
  - Reorder with drag handles
  - Add images to individual options
  - Select correct answer (radio for single, checkbox for multiple)
  - Keyboard navigation (Enter → next option)

### Solution Mode
- Split-view layout:
  - **Left**: Solution text editor with LaTeX support
  - **Right**: Live preview with debounced rendering (400ms)
- Optional solution image
- Clear solution button
- Real-time LaTeX rendering using KaTeX

### Settings Mode
- Marks (positive points)
- Negative marks (penalty)
- Difficulty level (easy/medium/hard)
- Optional time limit per question
- Question number (read-only, auto-managed)

### Fullscreen Mode
- Toggle button in header
- Hides all UI except editor
- ESC key exits fullscreen
- Clean, distraction-free writing experience

### Autosave
- Saves every 7 seconds if changes detected
- Visual indicators:
  - "Saved" (green) - No pending changes
  - "Saving..." (yellow) - Save in progress
  - "Unsaved changes" (yellow) - Pending changes
- Prevents data loss on accidental navigation

### Actions
- **Save**: Manual save (also triggered by autosave)
- **Duplicate**: Create copy of question
- **Delete**: Remove question (with confirmation)
- **Back**: Return to test editor

## Routing

### URL Structure
```
/admin/custom-question-editor/:testId/:questionId
```

### Integration Points
1. **From Test Editor**: Click "Open in Custom Editor" link on any question
2. **After Creating Question**: Automatically navigate to custom editor
3. **From Duplicate**: Navigate to newly created question

### Route Protection
- Wrapped in `<AdminRoute>` component
- Only accessible to admin users
- Only for normal tests (not PDF tests)

## Image Upload Flow

### Storage
- Uses Supabase Storage bucket: `test-pdfs`
- Path format: `question-images/{timestamp}-{filename}`
- Stores only public URL in database (never base64)

### Components
- Reuses existing `QuestionImageUpload` component
- Supports drag-and-drop
- Shows thumbnails with replace/delete options
- 5MB size limit
- Image type validation

## LaTeX Rendering

### Syntax
- Inline math: `$x^2$`
- Display math: `$$\frac{a}{b}$$`

### Implementation
- Uses KaTeX library (already installed)
- Renders in preview with debouncing (400ms)
- Handles errors gracefully with fallback

### Performance
- Debounced rendering prevents excessive re-renders
- Only updates preview after 400ms of no typing

## Keyboard Shortcuts

### Global
- **ESC**: Exit fullscreen mode

### Options Editor
- **Enter**: Move to next option (or add new option if last)
- **Tab**: Navigate between fields

## Backward Compatibility

### With Existing Editor
- Uses same database schema
- Same API endpoints
- Data is interchangeable
- No migration needed

### Test Types
- Only available for normal tests
- PDF tests continue using existing editor
- Test type detection happens at routing level

## Security

### Image Upload
- File type validation (images only)
- Size validation (max 5MB)
- Uses Supabase Storage with RLS policies

### Database
- RLS policies enforce admin-only access
- Foreign key constraints ensure data integrity

## Performance Considerations

### Optimization
- Debounced autosave (7 seconds)
- Debounced LaTeX preview (400ms)
- Only saves if data actually changed
- Minimal re-renders with proper hooks

### Bundle Size
- Reuses existing components and libraries
- No new heavy dependencies added
- KaTeX already included in project

## Future Enhancements (Not Implemented)

These were mentioned in requirements but not critical:
- Multiple solution images (currently single image)
- Undo/redo support
- Subject/Section selection in settings
- Drag-and-drop for option reordering (currently using up/down buttons)

## Testing Checklist

- [ ] Load existing question
- [ ] Edit question text with LaTeX
- [ ] Upload question image
- [ ] Add/remove options
- [ ] Reorder options
- [ ] Add option images
- [ ] Select correct answer (single/multiple/integer)
- [ ] Edit solution with preview
- [ ] Upload solution image
- [ ] Change settings (marks, difficulty)
- [ ] Test autosave
- [ ] Test manual save
- [ ] Test fullscreen mode
- [ ] Test duplicate question
- [ ] Test delete question
- [ ] Test navigation warnings
- [ ] Verify data persists correctly
