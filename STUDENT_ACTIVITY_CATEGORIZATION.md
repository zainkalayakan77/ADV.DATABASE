# Student Activity Categorization Feature

## Overview
This feature adds a tab-based filtering system to the Student Activity page, allowing students to easily categorize and view their activities based on submission status and deadlines.

## Features Implemented

### 1. Navigation Tabs
Students now see four tabs above their activity list:
- **All**: Shows all activities (default view)
- **Assigned**: Activities not yet submitted and before deadline
- **Submitted**: Activities that have been turned in
- **Missing**: Activities past deadline without submission

### 2. Tab Counts
Each tab displays a count badge showing the number of activities in that category:
- Example: "Missing (3)" or "Assigned (5)"
- Creates urgency and helps students manage their time
- Updates dynamically based on current data

### 3. Filtering Logic

#### Assigned Tab
- Shows activities where:
  - `submission_id == null` (not submitted)
  - AND `current_time < due_date` (before deadline)
  - OR no deadline set

#### Submitted Tab
- Shows activities where:
  - `submission_id !== null` (has been submitted)
  - Includes both graded and ungraded submissions

#### Missing Tab
- Shows activities where:
  - `submission_id == null` (not submitted)
  - AND `current_time > due_date` (past deadline)

### 4. Visual Status Badges
Each activity card displays a color-coded status badge:

| Status | Color | When Displayed |
|--------|-------|----------------|
| Assigned | Blue (#2196F3) | Not submitted, before deadline |
| Submitted | Green (#4caf50) | Work has been turned in |
| Missing | Red (#f44336) | Past deadline, not submitted |
| Graded | Green (#4caf50) | Submitted and graded (shows score) |

### 5. Empty State Messages
When a tab has no activities, helpful messages are displayed:

- **All Tab**: "No activities yet - Your teacher hasn't posted any activities yet."
- **Assigned Tab**: "You're all caught up! - No pending assignments at the moment."
- **Submitted Tab**: "No submissions yet - You haven't submitted any work yet."
- **Missing Tab**: "Great job! - You have no missing assignments."

### 6. Performance Optimization
- **Client-side filtering**: All filtering happens in the browser using already-fetched data
- **Instant tab switching**: No server calls needed when switching between tabs
- **Efficient rendering**: Only re-renders the activity list, not the entire page

## Technical Implementation

### Frontend Changes

#### CSS (Frontend/css/styles.css)
Added new styles for:
- `.activity-tabs` - Tab container
- `.activity-tab` - Individual tab styling
- `.activity-tab.active` - Active tab state
- `.activity-tab-count` - Count badge styling
- `.status-assigned` - Blue badge for assigned activities
- `.status-missing` - Red badge for missing activities
- `.empty-state` - Empty state message styling

#### JavaScript (Frontend/js/classes.js)
New functions added:
- `renderStudentActivitiesWithTabs()` - Renders tabs and calculates counts
- `filterActivitiesByTab()` - Filters activities based on selected tab
- `renderFilteredActivities()` - Renders filtered activity list with empty states
- `renderTeacherActivities()` - Separate rendering for teacher view (no tabs)

Modified functions:
- `renderClassActivities()` - Now detects user role and renders appropriate view

### User Experience

#### For Students:
1. Open a class to view activities
2. See tabs with counts at the top of the activity list
3. Click any tab to filter activities instantly
4. View color-coded status badges on each activity
5. See helpful messages when a category is empty

#### For Teachers:
- No changes to teacher view
- Teachers continue to see the full activity list without tabs
- Teacher-specific information (total submissions, teacher notes) remains visible

## Design Decisions

### Why Client-Side Filtering?
- **Performance**: Instant tab switching without network latency
- **User Experience**: Smooth, responsive interface
- **Server Load**: Reduces unnecessary API calls
- **Simplicity**: No backend changes required

### Why Separate Views for Students and Teachers?
- **Different Needs**: Students need to track their own submissions; teachers need to see all student submissions
- **Clarity**: Tabs are only relevant for personal activity tracking
- **Flexibility**: Each role gets an optimized interface

### Color Coding Rationale
- **Blue (Assigned)**: Neutral, informative - work to be done
- **Green (Submitted)**: Positive reinforcement - work completed
- **Red (Missing)**: Urgent attention needed - past deadline

## Testing Checklist

### Student View
- [ ] Tabs display with correct counts
- [ ] "All" tab shows all activities
- [ ] "Assigned" tab shows only unsubmitted activities before deadline
- [ ] "Submitted" tab shows only submitted activities
- [ ] "Missing" tab shows only overdue unsubmitted activities
- [ ] Status badges display correct colors
- [ ] Empty state messages appear when appropriate
- [ ] Tab switching is instant (no loading)
- [ ] Active tab is visually highlighted
- [ ] Clicking an activity opens details page

### Teacher View
- [ ] No tabs displayed for teachers
- [ ] All activities visible in list
- [ ] Teacher-specific info (submissions count, notes) visible
- [ ] Activity details accessible

### Edge Cases
- [ ] Class with no activities shows appropriate message
- [ ] Activities without deadlines appear in "Assigned" tab
- [ ] Graded submissions show score in badge
- [ ] Past deadline activities without submission show as "Missing"
- [ ] Tab counts update correctly after submission/unsubmission

## Future Enhancements

### Potential Additions:
1. **Sort Options**: Sort by due date, title, or submission status
2. **Search/Filter**: Search activities by title or description
3. **Calendar View**: Visual calendar showing all deadlines
4. **Notifications**: Badge on "Missing" tab when new activities become overdue
5. **Quick Actions**: Submit or view details directly from activity card
6. **Statistics**: Show completion percentage or grade average
7. **Archive**: Hide completed/graded activities

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on mobile and tablet
- Uses standard CSS and JavaScript (no special dependencies)

## Accessibility
- Keyboard navigation supported for tabs
- Color-coded badges also include text labels
- Empty states provide clear feedback
- Icons paired with text for clarity

## Maintenance Notes
- Tab filtering logic is in `filterActivitiesByTab()` function
- Status badge logic is in `renderFilteredActivities()` function
- To modify empty state messages, edit the `emptyMessages` object
- To change colors, update CSS variables in styles.css
