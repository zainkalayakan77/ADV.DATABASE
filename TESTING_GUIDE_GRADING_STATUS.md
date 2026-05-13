# Testing Guide: Grading Status Badges & Filters

## Quick Start Testing

### Prerequisites
1. Backend server running
2. Teacher account
3. Class with 5+ students
4. Activity with multiple submissions (some graded, some not)

---

## Test 1: Grading Status Badges

### Objective
Verify ungraded and graded badges display correctly

### Steps
1. **Login as Teacher**
2. **Open activity with submissions**
3. **Scroll to "Student Submissions" section**
4. **Observe each submission card**

### Expected Results for Ungraded Submission
- ✅ Blue "Submitted" badge visible
- ✅ Amber/Orange "Ungraded" badge visible
- ✅ Clock icon (🕐) in ungraded badge
- ✅ Both badges side by side

### Expected Results for Graded Submission
- ✅ Blue "Submitted" badge visible
- ✅ Green "Graded" badge visible
- ✅ Star icon (⭐) in graded badge
- ✅ Both badges side by side

### Visual Check
```
Ungraded:
┌─────────────────────────────────────┐
│ John Doe                            │
│ [✓ Submitted] [🕐 Ungraded]        │
└─────────────────────────────────────┘

Graded:
┌─────────────────────────────────────┐
│ Jane Smith                          │
│ [✓ Submitted] [⭐ Graded]           │
└─────────────────────────────────────┘
```

---

## Test 2: Filter Tabs Display

### Objective
Verify filter tabs show correct counts

### Steps
1. **Open activity with mixed submissions**
2. **Locate filter tabs** (below search bar)
3. **Check tab labels and counts**

### Expected Results
- ✅ Three tabs visible:
  - "📋 All [15]"
  - "🕐 Ungraded [8]"
  - "✓✓ Graded [7]"
- ✅ "All" tab is active (blue background)
- ✅ Counts are accurate
- ✅ Icons display correctly

### Visual Check
```
┌─────────────────────────────────────┐
│ 🔍 Search student name...          │
├─────────────────────────────────────┤
│ [📋 All 15] [🕐 Ungraded 8] [✓✓ Graded 7] │
└─────────────────────────────────────┘
```

---

## Test 3: Filter by Ungraded

### Steps
1. **Click "Ungraded" tab**
2. **Observe the list**

### Expected Results
- ✅ Tab becomes active (blue background)
- ✅ Only ungraded submissions visible
- ✅ Graded submissions hidden
- ✅ Counter shows: "Showing 8 of 15 students"
- ✅ All visible items have amber "Ungraded" badge

### Verification
- Count visible items manually
- Should match "Ungraded" tab count
- No green "Graded" badges visible

---

## Test 4: Filter by Graded

### Steps
1. **Click "Graded" tab**
2. **Observe the list**

### Expected Results
- ✅ Tab becomes active (blue background)
- ✅ Only graded submissions visible
- ✅ Ungraded submissions hidden
- ✅ Counter shows: "Showing 7 of 15 students"
- ✅ All visible items have green "Graded" badge

### Verification
- Count visible items manually
- Should match "Graded" tab count
- No amber "Ungraded" badges visible

---

## Test 5: Filter by All

### Steps
1. **Click "All" tab**
2. **Observe the list**

### Expected Results
- ✅ Tab becomes active (blue background)
- ✅ All submissions visible
- ✅ Mix of graded and ungraded
- ✅ Counter shows: "Showing 15 of 15 students" OR no counter
- ✅ Both badge types visible

---

## Test 6: Dynamic Badge Update

### Objective
Verify badge changes after grading

### Steps
1. **Filter to "Ungraded"**
2. **Find a student with amber "Ungraded" badge**
3. **Enter a score** (e.g., 85)
4. **Add feedback** (optional)
5. **Click checkmark to save**

### Expected Results
- ✅ "Grade saved successfully!" toast appears
- ✅ Badge changes from amber "Ungraded" to green "Graded"
- ✅ Badge animates (brief scale pulse)
- ✅ Tab counts update:
  - Ungraded: 7 (was 8)
  - Graded: 8 (was 7)
  - All: 15 (unchanged)

### Important
- Badge should change WITHOUT page refresh
- Student may disappear from list (if "Ungraded" filter active)
- This is correct behavior!

---

## Test 7: Filter Count Updates

### Steps
1. **Note initial counts** (e.g., Ungraded: 8, Graded: 7)
2. **Click "Ungraded" tab**
3. **Grade one student**
4. **Observe tab counts**

### Expected Results
- ✅ Ungraded count decreases by 1
- ✅ Graded count increases by 1
- ✅ All count stays same
- ✅ Counts update immediately (no refresh)

### Test Multiple Gradings
1. **Grade 3 more students**
2. **Verify counts update each time**
3. **Final counts should be accurate**

---

## Test 8: Combined Search + Filter

### Objective
Verify search and filter work together

### Steps
1. **Type "John" in search bar**
2. **Click "Ungraded" tab**

### Expected Results
- ✅ Only students named "John" who are ungraded
- ✅ Counter shows filtered count
- ✅ Both filters active simultaneously

### Test Variations
- Search "Smith" + Filter "Graded"
- Search "A" + Filter "Ungraded"
- Clear search, keep filter active

---

## Test 9: Empty State - No Ungraded

### Setup
- Grade all submissions first

### Steps
1. **Click "Ungraded" tab**

### Expected Results
- ✅ Submissions list hidden
- ✅ Empty state displays:
  ```
  🔍
  No submissions in this category
  All submitted work has been graded! Great job!
  [📋 Show All] button
  ```
- ✅ Message is encouraging
- ✅ Button works to show all

---

## Test 10: Empty State - No Graded

### Setup
- Have activity with only ungraded submissions

### Steps
1. **Click "Graded" tab**

### Expected Results
- ✅ Submissions list hidden
- ✅ Empty state displays:
  ```
  🔍
  No submissions in this category
  No graded submissions yet. Grade some students to see them here.
  [📋 Show All] button
  ```
- ✅ Message is helpful
- ✅ Button works to show all

---

## Test 11: Search + Filter Empty State

### Steps
1. **Search for "ZZZZZ"** (non-existent)
2. **Click "Ungraded" tab**

### Expected Results
- ✅ Shows search empty state (not filter empty state)
- ✅ Message: "No student matches 'ZZZZZ'"
- ✅ Clear search button works

---

## Test 12: Mobile Responsiveness

### Steps
1. **Open DevTools** (F12)
2. **Switch to mobile view**
3. **Test all features**

### Expected Results
- ✅ Filter tabs stack vertically
- ✅ Badges stack vertically
- ✅ Tabs are touch-friendly
- ✅ All functionality works
- ✅ No horizontal scrolling

### Test on Actual Devices
- iPhone Safari
- Android Chrome
- iPad

---

## Test 13: Tab Hover Effects

### Steps
1. **Hover over each tab**

### Expected Results
- ✅ Border color changes to blue
- ✅ Background gets light blue tint
- ✅ Tab lifts slightly (translateY)
- ✅ Shadow appears
- ✅ Smooth transition

---

## Test 14: Badge Color Verification

### Color Check
Use browser DevTools to verify:

**Ungraded Badge:**
- Background: Orange gradient (#ff9800 to #f57c00)
- Text: White
- Shadow: Orange glow

**Graded Badge:**
- Background: Green gradient (#4caf50 to #45a049)
- Text: White
- Shadow: Green glow

---

## Test 15: Workflow Simulation

### Realistic Teacher Workflow

1. **Open activity** (15 submissions, 8 ungraded)
2. **Click "Ungraded" tab**
3. **See 8 ungraded submissions**
4. **Grade first student** (score: 90)
   - Badge changes to "Graded"
   - Counts update: Ungraded 7, Graded 8
5. **Grade second student** (score: 85)
   - Badge changes to "Graded"
   - Counts update: Ungraded 6, Graded 9
6. **Continue until all graded**
7. **Ungraded tab shows 0**
8. **Click "Ungraded" tab**
9. **See empty state**: "All submitted work has been graded!"
10. **Click "Show All"**
11. **See all 15 submissions with green badges**

### Success Criteria
- ✅ Smooth workflow
- ✅ No page refreshes needed
- ✅ Counts always accurate
- ✅ Badges update correctly
- ✅ Empty states helpful

---

## Test 16: Performance Test

### Large Class Simulation

**Setup**: Activity with 50+ submissions

### Steps
1. **Open activity**
2. **Click filter tabs**
3. **Observe performance**

### Expected Results
- ✅ Tabs load instantly
- ✅ Filtering is instant
- ✅ No lag when switching tabs
- ✅ Badge updates are smooth
- ✅ No browser freezing

---

## Test 17: Regression Testing

### Verify Old Features Still Work

#### ✅ Student Search
- Search bar still works
- Filters correctly
- Clear button works

#### ✅ Inline Grading
- Can enter scores
- Can add feedback
- Save button works
- Toast notifications appear

#### ✅ File Viewing
- View buttons work
- Files open correctly
- Download works

#### ✅ Submission Toggle
- Toggle still controls submissions
- Lock messages display

---

## Common Issues & Solutions

### Issue: Badges not showing
**Solution**: 
- Verify submission has `submission_date`
- Check browser console for errors
- Refresh page

### Issue: Counts incorrect
**Solution**:
- Check `data-grading-status` attributes
- Verify score values in database
- Call `updateFilterCounts()` manually

### Issue: Filter not working
**Solution**:
- Check active tab class
- Verify `filterByGradingStatus()` function
- Check console for JavaScript errors

### Issue: Badge doesn't change after grading
**Solution**:
- Verify grade saved successfully
- Check `saveInlineGrade()` function
- Ensure `updateFilterCounts()` is called

---

## Success Criteria

All tests pass when:
- ✅ Badges display correctly (colors, icons, text)
- ✅ Filter tabs show accurate counts
- ✅ Filtering works for all three tabs
- ✅ Badges update after grading
- ✅ Counts update in real-time
- ✅ Search + filter work together
- ✅ Empty states display correctly
- ✅ Mobile responsive
- ✅ No performance issues
- ✅ No regression in existing features

---

## Quick Smoke Test (5 minutes)

1. ✅ Open activity with submissions
2. ✅ See badges (amber/green)
3. ✅ See filter tabs with counts
4. ✅ Click "Ungraded" - see only ungraded
5. ✅ Grade one student
6. ✅ Badge changes to green
7. ✅ Counts update
8. ✅ Click "Graded" - see graded students
9. ✅ Click "All" - see everyone
10. ✅ Search + filter together

**If all pass → Feature is working! 🎉**

---

## Reporting Issues

If you find a bug, report:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/device**
5. **Console errors**
6. **Screenshots** (especially of badges/tabs)

---

## Demo Script (For Stakeholders)

### Setup
"I'm a teacher with 15 students. 8 have submitted but aren't graded yet."

### Demo
1. **Show submissions list**
   - "Notice each submission has a status badge."
   - "Amber means ungraded, green means graded."

2. **Show filter tabs**
   - "I can filter by status: All, Ungraded, or Graded."
   - "See the counts? 8 ungraded, 7 graded."

3. **Filter to ungraded**
   - *Click "Ungraded" tab*
   - "Now I only see the 8 that need grading."

4. **Grade a student**
   - *Enter score and save*
   - "Watch the badge change from amber to green."
   - "And the counts update: now 7 ungraded, 8 graded."

5. **Show graded**
   - *Click "Graded" tab*
   - "Here are all the ones I've finished."

6. **Combine with search**
   - *Type student name*
   - "I can search within the filtered list too."

### Conclusion
"This makes grading large classes much more efficient. I can focus on ungraded work, track my progress, and see everything at a glance."
