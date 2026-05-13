# Activity Tabs UI Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Class: Mathematics 101                    │
├─────────────────────────────────────────────────────────────────┤
│  Activities  |  Members  |  Settings                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────┬────────────┬────────────┬────────────┐             │
│  │  All   │  Assigned  │ Submitted  │  Missing   │  ← Tabs     │
│  │  (12)  │    (5)     │    (4)     │    (3)     │             │
│  └────────┴────────────┴────────────┴────────────┘             │
│  ▔▔▔▔▔▔▔▔                                          ← Active     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Algebra Assignment                      [Assigned]     │   │
│  │  Solve the given algebra problems                       │   │
│  │  📅 Due: Dec 31, 2024  👤 Mr. Smith                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Geometry Quiz                          [Submitted]     │   │
│  │  Complete all geometry questions                        │   │
│  │  📅 Due: Dec 25, 2024  👤 Mr. Smith                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Homework Chapter 5                      [Missing]      │   │
│  │  Read and answer questions from chapter 5               │   │
│  │  📅 Due: Dec 20, 2024  👤 Mr. Smith                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tab States

### Active Tab (Selected)
```
┌────────────┐
│  Assigned  │  ← Blue underline (3px)
│    (5)     │  ← Light blue background
└────────────┘
▔▔▔▔▔▔▔▔▔▔▔▔
```
- **Text Color**: Primary Blue (#1976d2)
- **Border Bottom**: 3px solid blue
- **Background**: Light blue (rgba(25, 118, 210, 0.05))
- **Count Badge**: White background, blue text

### Inactive Tab
```
┌────────────┐
│ Submitted  │  ← No underline
│    (4)     │  ← Transparent background
└────────────┘
```
- **Text Color**: Gray (#757575)
- **Border Bottom**: None
- **Background**: Transparent
- **Count Badge**: Blue background, white text

### Hover State
```
┌────────────┐
│  Missing   │  ← Slight blue tint
│    (3)     │  ← Cursor: pointer
└────────────┘
```
- **Text Color**: Primary Blue (#1976d2)
- **Background**: Light blue (rgba(25, 118, 210, 0.05))
- **Cursor**: Pointer

## Status Badges

### Assigned Badge (Blue)
```
┌──────────┐
│ Assigned │  ← Blue background (#2196F3)
└──────────┘  ← White text
```

### Submitted Badge (Green)
```
┌───────────┐
│ Submitted │  ← Green background (#4caf50)
└───────────┘  ← White text
```

### Missing Badge (Red)
```
┌─────────┐
│ Missing │  ← Red background (#f44336)
└─────────┘  ← White text
```

### Graded Badge (Green with Score)
```
┌──────────────┐
│ Graded: 85/100│  ← Green background (#4caf50)
└──────────────┘  ← White text
```

## Activity Card Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Activity Title                              [Status Badge] │
│  Brief description of the activity                          │
│  📅 Due: Dec 31, 2024  👤 Created by: Mr. Smith            │
└─────────────────────────────────────────────────────────────┘
     ↑                                              ↑
  Left-aligned                                Right-aligned
  Activity Info                               Status Badge
```

### Card Hover Effect
```
┌─────────────────────────────────────────────────────────────┐
│  Activity Title                              [Status Badge] │  ← Lifts up 2px
│  Brief description                                          │  ← Shadow increases
│  📅 Due: Dec 31, 2024  👤 Mr. Smith                        │  ← Border turns blue
└─────────────────────────────────────────────────────────────┘
```

## Empty State Display

### When No Activities in Tab
```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                          📋                                  │
│                                                              │
│                   You're all caught up!                      │
│                                                              │
│              No pending assignments at the moment.           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Empty State Variations

**All Tab (No Activities)**
```
    📋
No activities yet
Your teacher hasn't posted any activities yet.
```

**Assigned Tab (All Caught Up)**
```
    ✅
You're all caught up!
No pending assignments at the moment.
```

**Submitted Tab (Nothing Submitted)**
```
    📝
No submissions yet
You haven't submitted any work yet.
```

**Missing Tab (No Missing Work)**
```
    😊
Great job!
You have no missing assignments.
```

## Color Palette

### Primary Colors
- **Primary Blue**: #1976d2 (Tabs, links, active states)
- **Success Green**: #4caf50 (Submitted, graded)
- **Warning Orange**: #ff9800 (Pending states)
- **Error Red**: #f44336 (Missing, overdue)
- **Info Blue**: #2196F3 (Assigned)

### Text Colors
- **Primary Text**: #212121 (Headings, main content)
- **Secondary Text**: #757575 (Descriptions, metadata)

### Background Colors
- **Page Background**: #fafafa
- **Card Background**: #ffffff
- **Border Color**: #e0e0e0

## Typography

### Tab Text
- **Font Size**: 0.95rem
- **Font Weight**: 500 (Medium)
- **Font Family**: Roboto, Segoe UI, sans-serif

### Tab Count Badge
- **Font Size**: 0.8rem
- **Font Weight**: 600 (Semi-bold)
- **Padding**: 0.15rem 0.5rem
- **Border Radius**: 12px

### Activity Title
- **Font Size**: 1.1rem
- **Font Weight**: 600 (Semi-bold)
- **Color**: #212121

### Activity Description
- **Font Size**: 0.9rem
- **Font Weight**: 400 (Regular)
- **Color**: #757575

### Status Badge
- **Font Size**: 0.8rem
- **Font Weight**: 500 (Medium)
- **Padding**: 6px 12px
- **Border Radius**: 12px

## Spacing and Layout

### Tab Container
- **Gap Between Tabs**: 0.5rem
- **Bottom Border**: 2px solid #e0e0e0
- **Margin Bottom**: 1.5rem

### Activity Cards
- **Padding**: 1rem
- **Margin Bottom**: 0.75rem
- **Border Radius**: 8px
- **Border**: 1px solid #e0e0e0

### Empty State
- **Padding**: 3rem 2rem
- **Icon Size**: 3rem
- **Icon Margin Bottom**: 1rem

## Responsive Behavior

### Desktop (> 1024px)
- Tabs display in single row
- Activity cards full width
- All information visible

### Tablet (768px - 1024px)
- Tabs may wrap to two rows if needed
- Activity cards full width
- Descriptions may truncate

### Mobile (< 768px)
- Tabs wrap to multiple rows
- Tab text may be smaller
- Activity cards stack vertically
- Some metadata may be hidden

## Interaction States

### Tab Click
1. Remove 'active' class from all tabs
2. Add 'active' class to clicked tab
3. Filter activities instantly (no loading)
4. Update activity list below

### Activity Card Click
1. Show hover effect (lift + shadow)
2. Navigate to activity details page
3. Maintain tab state on return

### Empty State
1. Display centered message
2. Show relevant icon
3. Provide encouraging text
4. No interaction needed

## Animation Timing

- **Tab Transition**: 0.2s ease
- **Card Hover**: 0.2s ease
- **Badge Appearance**: Instant (no animation)
- **List Update**: Instant (no fade/slide)

## Accessibility Features

### Keyboard Navigation
- **Tab Key**: Move between tabs
- **Enter/Space**: Activate selected tab
- **Arrow Keys**: Navigate between tabs (optional)

### Screen Reader Support
- Tab announces: "Assigned, 5 activities, button"
- Badge announces: "Status: Assigned"
- Empty state announces full message

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Badges use both color AND text labels
- Icons paired with text for clarity

## Implementation Notes

### CSS Classes
- `.activity-tabs` - Tab container
- `.activity-tab` - Individual tab
- `.activity-tab.active` - Active tab state
- `.activity-tab-count` - Count badge
- `.activity-status` - Status badge base
- `.status-assigned` - Blue badge
- `.status-submitted` - Green badge
- `.status-missing` - Red badge
- `.empty-state` - Empty state container

### JavaScript Functions
- `renderStudentActivitiesWithTabs()` - Main render function
- `filterActivitiesByTab()` - Filter logic
- `renderFilteredActivities()` - Render filtered list
- `renderTeacherActivities()` - Teacher view (no tabs)

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## Performance Considerations

- **Initial Render**: < 100ms for 50 activities
- **Tab Switch**: < 50ms (client-side only)
- **Memory Usage**: Minimal (activities cached in memory)
- **Network Requests**: Zero after initial load
