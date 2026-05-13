# Testing Guide: Student Activity Categorization

## Quick Test Scenarios

### Scenario 1: Student with Mixed Activities
**Setup:**
- Login as a student
- Join a class with multiple activities:
  - Some submitted
  - Some not submitted (before deadline)
  - Some not submitted (past deadline)

**Expected Results:**
1. See 4 tabs: All, Assigned, Submitted, Missing
2. Each tab shows correct count in badge
3. "All" tab shows all activities
4. "Assigned" tab shows only unsubmitted activities before deadline (blue badges)
5. "Submitted" tab shows only submitted activities (green badges)
6. "Missing" tab shows only overdue activities (red badges)

### Scenario 2: Student with No Activities
**Setup:**
- Login as a student
- Join a new class with no activities

**Expected Results:**
1. See tabs with all counts at (0)
2. "All" tab shows: "No activities yet"
3. Other tabs show appropriate empty messages

### Scenario 3: Student All Caught Up
**Setup:**
- Login as a student
- Submit all activities before deadlines

**Expected Results:**
1. "Assigned" tab count is (0)
2. "Missing" tab count is (0)
3. "Submitted" tab shows all activities
4. "Assigned" tab shows: "You're all caught up!"
5. "Missing" tab shows: "Great job! You have no missing assignments."

### Scenario 4: Student with Missing Work
**Setup:**
- Login as a student
- Have activities past deadline without submission

**Expected Results:**
1. "Missing" tab shows count > 0 (e.g., "Missing (3)")
2. "Missing" tab displays overdue activities with red badges
3. Activities show "Missing" status

### Scenario 5: Teacher View
**Setup:**
- Login as a teacher
- View class activities

**Expected Results:**
1. NO tabs displayed
2. All activities shown in list format
3. Teacher-specific info visible (submission counts, teacher notes)
4. Normal activity list behavior

### Scenario 6: Tab Switching Performance
**Setup:**
- Login as a student with 10+ activities
- Click through all tabs multiple times

**Expected Results:**
1. Tab switching is instant (no loading spinner)
2. No network requests when switching tabs
3. Smooth transitions between tabs
4. Active tab is clearly highlighted

### Scenario 7: Activity Submission Flow
**Setup:**
- Login as a student
- View an "Assigned" activity
- Submit the activity
- Return to class activities

**Expected Results:**
1. Activity moves from "Assigned" to "Submitted" tab
2. "Assigned" count decreases by 1
3. "Submitted" count increases by 1
4. Badge changes from blue to green

### Scenario 8: Graded Submission
**Setup:**
- Login as a student
- View a submitted activity that has been graded

**Expected Results:**
1. Activity appears in "Submitted" tab
2. Badge shows "Graded: [score]" (e.g., "Graded: 85/100")
3. Badge is green

## Visual Checks

### Tab Appearance
- [ ] Tabs are horizontally aligned
- [ ] Active tab has blue underline
- [ ] Active tab has light blue background
- [ ] Count badges are circular/rounded
- [ ] Count badges have correct colors (blue for active, white for inactive)

### Status Badges
- [ ] "Assigned" badge is blue
- [ ] "Submitted" badge is green
- [ ] "Missing" badge is red
- [ ] Badges are aligned to the right of activity cards
- [ ] Badge text is readable

### Empty States
- [ ] Icon is large and visible
- [ ] Title is bold and clear
- [ ] Message is helpful and encouraging
- [ ] Centered on page

### Activity Cards
- [ ] Cards are clickable
- [ ] Hover effect works (slight lift and shadow)
- [ ] Activity info is on the left
- [ ] Status badge is on the right
- [ ] All text is readable

## Browser Testing

Test in the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Responsive Design Testing

Test at these viewport sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Accessibility Testing

- [ ] Tab through tabs using keyboard
- [ ] Press Enter/Space to activate tabs
- [ ] Screen reader announces tab names and counts
- [ ] Color contrast meets WCAG standards
- [ ] Icons have text labels

## Edge Cases to Test

1. **Activity with no deadline**
   - Should appear in "Assigned" tab
   - Should not appear in "Missing" tab

2. **Activity submitted exactly at deadline**
   - Should appear in "Submitted" tab
   - Should not appear in "Missing" tab

3. **Activity unsubmitted after deadline**
   - Should move from "Submitted" to "Missing"
   - Counts should update

4. **Very long activity titles**
   - Should wrap or truncate properly
   - Should not break layout

5. **Many activities (50+)**
   - Should render without lag
   - Tab switching should remain fast
   - Scrolling should be smooth

## Common Issues and Solutions

### Issue: Tabs not showing for students
**Solution:** Check that activities have submission data (submission_id field). The system detects student view by checking for submission fields.

### Issue: Counts are incorrect
**Solution:** Check date/time comparison logic in `filterActivitiesByTab()`. Ensure server and client times are synchronized.

### Issue: Empty state not showing
**Solution:** Verify that `renderFilteredActivities()` is checking for empty arrays correctly.

### Issue: Tab switching causes page reload
**Solution:** Ensure event listeners are using `addEventListener` and not causing navigation.

### Issue: Status badges wrong color
**Solution:** Check CSS class names match between JavaScript and CSS file.

## Performance Benchmarks

Expected performance:
- Initial render: < 100ms for 50 activities
- Tab switch: < 50ms (instant)
- Activity click: < 100ms to navigate

## Regression Testing

After implementing this feature, verify:
- [ ] Activity creation still works
- [ ] Activity submission still works
- [ ] Activity details page still works
- [ ] Teacher grading still works
- [ ] Activity editing still works
- [ ] Class navigation still works

## Sign-Off Checklist

Before marking this feature as complete:
- [ ] All test scenarios pass
- [ ] Visual checks complete
- [ ] Browser testing complete
- [ ] Responsive design verified
- [ ] Accessibility verified
- [ ] Edge cases handled
- [ ] Performance acceptable
- [ ] No regressions found
- [ ] Documentation updated
- [ ] Code reviewed
