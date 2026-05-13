# Testing Guide: Student Search & Role-Based UI

## Quick Start Testing

### Prerequisites
1. Backend server running
2. At least one teacher account
3. At least one class with 5+ students enrolled
4. At least one activity with multiple student submissions

---

## Test 1: Role-Based UI (Teacher View)

### Objective
Verify teachers don't see student-specific tabs

### Steps
1. **Login as Teacher**
2. **Navigate to any class**
3. **Check the Activities section**

### Expected Results
- ✅ See list of all activities
- ✅ NO "Assigned" tab visible
- ✅ NO "Submitted" tab visible
- ✅ NO "Missing" tab visible
- ✅ Clean, simple activity list

### Screenshot Verification
- Activities displayed in vertical list
- No tab navigation above activities
- Only activity cards visible

---

## Test 2: Role-Based UI (Student View)

### Objective
Verify students still see their progress tabs

### Steps
1. **Login as Student**
2. **Navigate to any class**
3. **Check the Activities section**

### Expected Results
- ✅ See "All" tab
- ✅ See "Assigned" tab with count
- ✅ See "Submitted" tab with count
- ✅ See "Missing" tab with count
- ✅ Can click tabs to filter activities

### Verification
- All 4 tabs visible
- Counts are accurate
- Filtering works when clicking tabs

---

## Test 3: Student Search - Basic Functionality

### Setup
- Have at least 5 students submit work for an activity

### Steps
1. **Login as Teacher**
2. **Open activity with submissions**
3. **Scroll to "Student Submissions" section**
4. **Locate the search bar** (should be above submissions list)

### Expected Results
- ✅ Search bar visible
- ✅ Placeholder text: "Search student name..."
- ✅ Magnifying glass icon on left
- ✅ All submissions visible below

### Visual Check
```
┌─────────────────────────────────────┐
│ 🔍 Search student name...          │
└─────────────────────────────────────┘
Showing X of Y students (when searching)

[Student Submission 1]
[Student Submission 2]
[Student Submission 3]
```

---

## Test 4: Real-Time Filtering

### Steps
1. **In the search bar, type "Jo"** (partial name)
2. **Observe the list**

### Expected Results
- ✅ List filters immediately (no delay)
- ✅ Only students with "Jo" in name visible
- ✅ Results counter appears: "Showing 2 of 15 students"
- ✅ Clear button (X) appears in search field
- ✅ Hidden submissions smoothly fade out

### Test Variations
- Type "john" → should match "John Doe"
- Type "SMITH" → should match "Smith, Jane"
- Type "doe" → should match "John Doe"

---

## Test 5: Clear Search Functionality

### Method 1: Clear Button
1. **Type any search term**
2. **Click the X button** in search field

### Expected Results
- ✅ Search field clears
- ✅ All submissions reappear
- ✅ Results counter disappears
- ✅ Clear button (X) disappears
- ✅ Search field remains focused

### Method 2: Manual Clear
1. **Type any search term**
2. **Delete all text manually** (backspace)

### Expected Results
- ✅ Same as Method 1
- ✅ Clear button disappears when field is empty

---

## Test 6: Empty State (No Matches)

### Steps
1. **Type a name that doesn't exist** (e.g., "ZZZZZ")
2. **Observe the display**

### Expected Results
- ✅ Submissions list hidden
- ✅ Empty state message appears:
  ```
  🔍
  No student found
  No student matches "ZZZZZ"
  [Clear Search] button
  ```
- ✅ Results counter hidden
- ✅ Clear button (X) still visible in search field

### Additional Test
1. **Click "Clear Search" button** in empty state

### Expected Results
- ✅ Search clears
- ✅ All submissions reappear
- ✅ Empty state disappears

---

## Test 7: Search + Inline Grading Integration

### Steps
1. **Search for specific student** (e.g., "John")
2. **List filters to show only John**
3. **Enter a score** in inline grading field
4. **Add feedback** (optional)
5. **Click checkmark to save**

### Expected Results
- ✅ Grade saves successfully
- ✅ Toast notification appears
- ✅ Search remains active (John still filtered)
- ✅ Can continue grading filtered students
- ✅ Clear search to see all students with grades saved

---

## Test 8: Case Insensitivity

### Test Cases
| Search Term | Should Match |
|-------------|--------------|
| john | John Doe, Johnny Smith |
| SMITH | Smith, Jane |
| doe | John Doe |
| o'brien | O'Brien, Patrick |
| smith-jones | Smith-Jones, Mary |

### Steps
1. **Try each search term above**
2. **Verify correct matches appear**

### Expected Results
- ✅ All variations match correctly
- ✅ Case doesn't matter
- ✅ Special characters handled properly

---

## Test 9: Mobile Responsiveness

### Steps
1. **Open DevTools** (F12)
2. **Switch to mobile view** (iPhone/Android)
3. **Login as teacher**
4. **Open activity with submissions**
5. **Try search functionality**

### Expected Results
- ✅ Search bar displays properly
- ✅ Input is touch-friendly (not too small)
- ✅ Clear button is easily tappable
- ✅ Results display correctly
- ✅ Inline grading still works
- ✅ No horizontal scrolling

### Test on Actual Devices
- iPhone Safari
- Android Chrome
- iPad Safari

---

## Test 10: Performance with Many Students

### Setup
- Create activity with 20+ student submissions

### Steps
1. **Open activity**
2. **Type in search bar**
3. **Observe performance**

### Expected Results
- ✅ No lag when typing
- ✅ Filtering is instant
- ✅ Smooth animations
- ✅ No browser freezing

### Stress Test (Optional)
- Test with 50+ students
- Test with 100+ students
- Should still be acceptable

---

## Test 11: Edge Cases

### Test 11.1: No Submissions
1. **Open activity with zero submissions**

**Expected**: 
- ✅ Search bar NOT shown
- ✅ Only "No submissions yet" message

### Test 11.2: Single Submission
1. **Open activity with one submission**

**Expected**:
- ✅ Search bar shown
- ✅ Can search (even with one result)
- ✅ Works correctly

### Test 11.3: All Students Not Submitted
1. **Open activity where no one submitted**

**Expected**:
- ✅ Search bar shown
- ✅ Can search student names
- ✅ Shows "Not Submitted" status

### Test 11.4: Rapid Typing
1. **Type very quickly in search field**

**Expected**:
- ✅ No lag or errors
- ✅ Filters correctly
- ✅ No duplicate results

---

## Test 12: Browser Compatibility

### Test in Each Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Chrome Mobile

### Verify in Each
- ✅ Search bar displays correctly
- ✅ Icons render properly
- ✅ Filtering works
- ✅ Animations smooth
- ✅ No console errors

---

## Test 13: Accessibility

### Keyboard Navigation
1. **Tab to search field**
2. **Type to search**
3. **Tab to clear button**
4. **Press Enter to clear**

### Expected Results
- ✅ Can navigate with keyboard only
- ✅ Focus indicators visible
- ✅ All functions accessible

### Screen Reader (Optional)
- Search field has proper label
- Results count announced
- Empty state readable

---

## Common Issues & Solutions

### Issue: Search bar not visible
**Solution**: 
- Verify you're logged in as teacher
- Ensure activity has submissions
- Check browser console for errors

### Issue: Filtering not working
**Solution**:
- Check browser console for JavaScript errors
- Verify `filterStudentSubmissions()` function exists
- Clear browser cache and refresh

### Issue: Clear button not appearing
**Solution**:
- Type at least one character
- Check CSS for `display: none` override
- Verify button element exists in DOM

### Issue: Empty state not showing
**Solution**:
- Search for non-existent name
- Check `no-search-results` div exists
- Verify display logic in JavaScript

---

## Regression Testing

### Verify Old Features Still Work

#### ✅ Inline Grading
- Can still grade without searching
- Grades save correctly
- Visual feedback works

#### ✅ File Viewing
- View buttons still work
- Files open in new tab
- No access token errors

#### ✅ Submission Toggle
- Toggle still controls submissions
- Lock messages display correctly

#### ✅ Notifications
- Grading sends notifications
- Students receive updates

---

## Success Criteria

All tests pass when:
- ✅ Teachers don't see student tabs
- ✅ Students still see all tabs
- ✅ Search bar visible for teachers
- ✅ Real-time filtering works
- ✅ Case-insensitive matching
- ✅ Clear button functions
- ✅ Empty state displays correctly
- ✅ Mobile responsive
- ✅ No performance issues
- ✅ No regression in existing features

---

## Quick Smoke Test (3 minutes)

1. ✅ Login as teacher
2. ✅ Verify no student tabs visible
3. ✅ Open activity with 5+ submissions
4. ✅ See search bar above submissions
5. ✅ Type partial name
6. ✅ List filters in real-time
7. ✅ See results counter
8. ✅ Click clear button
9. ✅ All submissions reappear
10. ✅ Grade one student inline

**If all pass → Feature is working! 🎉**

---

## Reporting Issues

If you find a bug, report:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/device**
5. **Console errors** (F12 → Console tab)
6. **Screenshots**

---

## Demo Script (For Stakeholders)

### Setup
"I'm logged in as a teacher with a class of 15 students who have submitted work."

### Demo
1. **Show activity page**
   - "Notice there are no student-specific tabs here - just a clean list of activities."

2. **Open activity with submissions**
   - "Here are all 15 student submissions."

3. **Use search**
   - "Let me search for 'John'..."
   - *Type 'John'*
   - "The list instantly filters to show only Johns."
   - "See the counter: 'Showing 2 of 15 students'"

4. **Grade student**
   - "I can grade right here inline..."
   - *Enter score and feedback*
   - "Saved! The search stays active."

5. **Clear search**
   - "Click the X to see everyone again."
   - *Click clear button*
   - "All students back, with grades saved."

6. **Show empty state**
   - "If I search for someone not in the class..."
   - *Type 'ZZZZZ'*
   - "Clear message: 'No student found matching ZZZZZ'"

### Conclusion
"This makes grading large classes much faster and keeps the interface clean for teachers."
