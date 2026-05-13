# Testing Guide: Accordion-Style Grading UI

## Overview
This guide provides step-by-step instructions for testing the accordion-style collapsible grading interface.

## Test Date
May 13, 2026

---

## 🎯 Testing Objectives

1. Verify accordion expand/collapse functionality
2. Verify auto-collapse after grading
3. Verify View button accessibility
4. Verify search and filter integration
5. Verify smooth animations
6. Verify mobile responsiveness
7. Verify no regressions in existing features

---

## 🧪 Test Scenarios

### Test 1: Default Collapsed State

**Prerequisites**:
- Teacher account logged in
- Activity with multiple student submissions

**Steps**:
1. Navigate to an activity with submissions
2. Scroll to "Student Submissions" section
3. Observe the initial state of all submission cards

**Expected Results**:
- ✅ All submission cards are collapsed by default
- ✅ Each card shows only:
  - Student name
  - Submission date/time
  - "Submitted" badge
  - "Graded" or "Ungraded" badge
  - "View" button (if file attached)
  - Chevron icon pointing down (v)
- ✅ Card height is approximately 60-80px
- ✅ No grading section visible
- ✅ No content or file details visible

**Pass Criteria**: All cards collapsed, minimal height, essential info visible

---

### Test 2: Expand Single Card

**Prerequisites**:
- On activity page with collapsed submission cards

**Steps**:
1. Click anywhere on a student's submission card
2. Observe the animation
3. Check the expanded content

**Expected Results**:
- ✅ Card expands smoothly (300ms animation)
- ✅ Chevron icon rotates 180 degrees (points up ^)
- ✅ Background changes to light gray (#f8f9fa)
- ✅ Header gets bottom border
- ✅ Grading section slides into view
- ✅ Content visible:
  - Text content (if any)
  - Attached file with View/Download buttons
  - Score input field
  - Feedback textarea
  - Save button (checkmark)
- ✅ Animation is smooth, no jumps or flickers

**Pass Criteria**: Smooth expansion, all content visible, chevron rotates

---

### Test 3: Collapse Expanded Card

**Prerequisites**:
- One card expanded from Test 2

**Steps**:
1. Click on the same expanded card's header
2. Observe the animation

**Expected Results**:
- ✅ Card collapses smoothly (300ms animation)
- ✅ Chevron icon rotates back to down position (v)
- ✅ Background returns to white
- ✅ Grading section slides out of view
- ✅ Card returns to minimal height (60-80px)
- ✅ Animation is smooth, no jumps

**Pass Criteria**: Smooth collapse, returns to original state

---

### Test 4: Multiple Cards Expanded

**Prerequisites**:
- Multiple submission cards available

**Steps**:
1. Expand first student's card
2. Without collapsing, expand second student's card
3. Expand third student's card
4. Observe all three cards

**Expected Results**:
- ✅ All three cards remain expanded
- ✅ Each card shows its own grading section
- ✅ No interference between cards
- ✅ Chevrons all point up
- ✅ Can scroll through all expanded cards

**Pass Criteria**: Multiple cards can be expanded simultaneously

---

### Test 5: Auto-Collapse After Grading

**Prerequisites**:
- One card expanded
- Student has submitted work

**Steps**:
1. Expand an ungraded student's card
2. Enter a score (e.g., 85)
3. Enter feedback (optional)
4. Click the checkmark (save) button
5. Observe the sequence of events
6. Wait for auto-collapse

**Expected Results**:
- ✅ Loading spinner appears briefly
- ✅ Success toast: "Grade saved successfully!"
- ✅ Badge changes from "Ungraded" to "Graded"
- ✅ Save button briefly shows green (success animation)
- ✅ After ~800ms, card begins collapsing
- ✅ Card fully collapses smoothly
- ✅ Chevron rotates back to down position
- ✅ Filter counts update

**Pass Criteria**: Grade saves, badge updates, card auto-collapses after delay

---

### Test 6: View Button When Collapsed

**Prerequisites**:
- Student with attached file submission

**Steps**:
1. Find a collapsed card with "View" button
2. Click the "View" button
3. Observe the behavior

**Expected Results**:
- ✅ File viewer modal opens
- ✅ File displays correctly
- ✅ Card does NOT expand
- ✅ Card remains collapsed
- ✅ Chevron stays pointing down

**Pass Criteria**: View button works without expanding card

---

### Test 7: View Button When Expanded

**Prerequisites**:
- Student with attached file submission

**Steps**:
1. Expand a card with "View" button
2. Click the "View" button in the expanded state
3. Observe the behavior

**Expected Results**:
- ✅ File viewer modal opens
- ✅ File displays correctly
- ✅ Card remains expanded
- ✅ Can close viewer and continue grading

**Pass Criteria**: View button works in expanded state

---

### Test 8: Search with Collapsed Cards

**Prerequisites**:
- Multiple submission cards
- All cards collapsed

**Steps**:
1. Type a student name in the search bar (e.g., "John")
2. Observe the filtering
3. Check the state of visible cards
4. Clear the search
5. Observe all cards return

**Expected Results**:
- ✅ Only matching students visible
- ✅ Non-matching cards hidden (display: none)
- ✅ Visible cards remain collapsed
- ✅ Search results count updates
- ✅ Clear button (X) appears
- ✅ Clearing search shows all cards again
- ✅ All cards still collapsed

**Pass Criteria**: Search works, collapsed state maintained

---

### Test 9: Filter Tabs with Collapsed Cards

**Prerequisites**:
- Mix of graded and ungraded submissions
- All cards collapsed

**Steps**:
1. Click "Ungraded" filter tab
2. Observe which cards are visible
3. Check card states
4. Click "Graded" filter tab
5. Observe which cards are visible
6. Click "All" filter tab
7. Observe all cards return

**Expected Results**:
- ✅ "Ungraded" shows only ungraded submissions
- ✅ "Graded" shows only graded submissions
- ✅ "All" shows all submissions
- ✅ Cards remain collapsed during filtering
- ✅ Filter counts are accurate
- ✅ Active tab highlighted
- ✅ Results count updates

**Pass Criteria**: Filters work, collapsed state maintained

---

### Test 10: Combined Search and Filter

**Prerequisites**:
- Multiple students with mix of graded/ungraded

**Steps**:
1. Type "John" in search bar
2. Click "Ungraded" filter tab
3. Observe results
4. Expand one visible card
5. Grade the student
6. Observe auto-collapse and filtering
7. Click "Graded" tab
8. Observe the graded student appears

**Expected Results**:
- ✅ Only ungraded Johns visible initially
- ✅ Cards remain collapsed
- ✅ Can expand and grade
- ✅ After grading, card auto-collapses
- ✅ Card disappears from "Ungraded" view
- ✅ Card appears in "Graded" view
- ✅ Search term still active
- ✅ Dual filtering works correctly

**Pass Criteria**: Search and filter work together seamlessly

---

### Test 11: Rapid Toggle Interactions

**Prerequisites**:
- Multiple submission cards

**Steps**:
1. Rapidly click on different student cards
2. Click expand, then immediately click collapse
3. Click multiple cards in quick succession
4. Observe animations and states

**Expected Results**:
- ✅ Animations don't conflict
- ✅ Each card maintains correct state
- ✅ Chevrons update correctly
- ✅ No visual glitches
- ✅ No JavaScript errors in console
- ✅ Smooth handling of rapid clicks

**Pass Criteria**: Handles rapid interactions gracefully

---

### Test 12: Mobile Responsiveness (< 768px)

**Prerequisites**:
- Mobile device or browser dev tools (responsive mode)
- Set viewport to < 768px width

**Steps**:
1. Open activity with submissions on mobile
2. Observe card layout
3. Try expanding a card
4. Try clicking View button
5. Try using search
6. Try using filters

**Expected Results**:
- ✅ Cards display correctly on mobile
- ✅ Header elements wrap appropriately
- ✅ Buttons are accessible (not overlapping)
- ✅ Accordion works smoothly
- ✅ View button doesn't overlap chevron
- ✅ Search bar full width
- ✅ Filter tabs wrap if needed
- ✅ Grading section readable
- ✅ Score input and feedback textarea usable

**Pass Criteria**: Fully functional on mobile devices

---

### Test 13: Animation Smoothness

**Prerequisites**:
- Multiple submission cards

**Steps**:
1. Expand a card and observe animation
2. Collapse a card and observe animation
3. Check for any stuttering or jumps
4. Verify timing feels natural

**Expected Results**:
- ✅ Expand animation: 300ms, smooth
- ✅ Collapse animation: 300ms, smooth
- ✅ Chevron rotation: 300ms, smooth
- ✅ No content jumping
- ✅ No layout shifts
- ✅ Padding transitions smoothly
- ✅ Max-height transitions smoothly

**Pass Criteria**: All animations smooth and natural

---

### Test 14: Chevron Icon Behavior

**Prerequisites**:
- Submission cards available

**Steps**:
1. Observe chevron in collapsed state
2. Expand card and observe chevron
3. Collapse card and observe chevron
4. Hover over chevron button

**Expected Results**:
- ✅ Collapsed: Chevron points down (v)
- ✅ Expanded: Chevron points up (^)
- ✅ Rotation is smooth (180 degrees)
- ✅ Hover shows background circle
- ✅ Hover changes color
- ✅ Cursor shows pointer

**Pass Criteria**: Chevron provides clear visual feedback

---

### Test 15: Grading Functionality (No Regression)

**Prerequisites**:
- Expanded submission card

**Steps**:
1. Expand a card
2. Enter score
3. Enter feedback
4. Click save
5. Verify grade saved
6. Reload page
7. Verify grade persists

**Expected Results**:
- ✅ Score input accepts numbers
- ✅ Validation works (0 to max_score)
- ✅ Feedback textarea works
- ✅ Save button works
- ✅ Success toast appears
- ✅ Badge updates
- ✅ Grade persists after reload
- ✅ Student sees grade

**Pass Criteria**: Grading functionality unchanged

---

### Test 16: Empty States

**Prerequisites**:
- Activity with no submissions

**Steps**:
1. Open activity with zero submissions
2. Observe the display

**Expected Results**:
- ✅ Shows "No submissions yet" message
- ✅ No accordion cards displayed
- ✅ No JavaScript errors

**Pass Criteria**: Handles empty state gracefully

---

### Test 17: Not Submitted Students

**Prerequisites**:
- Activity with some students who haven't submitted

**Steps**:
1. Find a "Not Submitted" student card
2. Observe the card
3. Try to expand it

**Expected Results**:
- ✅ Card shows "Not Submitted" badge
- ✅ No "View" button (no file)
- ✅ Card can expand
- ✅ No grading section (no submission to grade)
- ✅ Only shows student name and status

**Pass Criteria**: Not submitted students handled correctly

---

### Test 18: Performance with Many Submissions

**Prerequisites**:
- Activity with 50+ student submissions

**Steps**:
1. Open activity with many submissions
2. Observe initial load time
3. Scroll through all cards
4. Expand several cards
5. Use search and filters

**Expected Results**:
- ✅ Page loads quickly
- ✅ Scrolling is smooth
- ✅ No lag when expanding cards
- ✅ Search is responsive
- ✅ Filters apply quickly
- ✅ No performance degradation

**Pass Criteria**: Performs well with large datasets

---

### Test 19: Browser Compatibility

**Prerequisites**:
- Access to multiple browsers

**Steps**:
1. Test in Chrome
2. Test in Firefox
3. Test in Safari
4. Test in Edge
5. Verify accordion works in all

**Expected Results**:
- ✅ Works in Chrome
- ✅ Works in Firefox
- ✅ Works in Safari
- ✅ Works in Edge
- ✅ Animations smooth in all browsers
- ✅ No visual differences

**Pass Criteria**: Cross-browser compatibility

---

### Test 20: Accessibility

**Prerequisites**:
- Keyboard and screen reader available

**Steps**:
1. Navigate using Tab key
2. Try to expand card with Enter/Space
3. Navigate through expanded content
4. Use screen reader to read card content

**Expected Results**:
- ✅ Can tab to cards
- ✅ Can tab to View button
- ✅ Can tab to chevron button
- ✅ Enter/Space expands card
- ✅ Can tab through grading inputs
- ✅ Screen reader announces states
- ✅ Focus indicators visible

**Pass Criteria**: Keyboard accessible, screen reader friendly

---

## 🐛 Common Issues and Solutions

### Issue 1: Card Doesn't Expand
**Symptom**: Clicking card does nothing
**Solution**: Check JavaScript console for errors, verify toggleSubmissionAccordion function exists
**Verification**: Open console, click card, check for errors

### Issue 2: Animation Stutters
**Symptom**: Jerky expand/collapse animation
**Solution**: Check CSS transitions are applied, verify max-height value is sufficient
**Verification**: Inspect element, check computed styles

### Issue 3: Chevron Doesn't Rotate
**Symptom**: Chevron stays in same position
**Solution**: Check JavaScript sets transform style, verify CSS transition on icon
**Verification**: Inspect chevron element, check inline styles

### Issue 4: Auto-Collapse Doesn't Work
**Symptom**: Card stays expanded after grading
**Solution**: Check setTimeout in saveInlineGrade function, verify 800ms delay
**Verification**: Add console.log in setTimeout callback

### Issue 5: View Button Expands Card
**Symptom**: Clicking View expands the card
**Solution**: Verify event.stopPropagation() is present in onclick
**Verification**: Check HTML for stopPropagation call

### Issue 6: Search Doesn't Work with Accordion
**Symptom**: Search shows wrong cards or doesn't filter
**Solution**: Check data-student-name attribute is set correctly
**Verification**: Inspect card elements, verify attributes

### Issue 7: Mobile Layout Broken
**Symptom**: Buttons overlap or layout breaks on mobile
**Solution**: Check responsive CSS media queries are applied
**Verification**: Inspect at < 768px width, check computed styles

---

## 📊 Test Results Template

### Test Session Information
- **Date**: _______________
- **Tester**: _______________
- **Environment**: Development / Staging / Production
- **Browser**: _______________
- **Browser Version**: _______________
- **Device**: Desktop / Mobile / Tablet

### Test Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Default Collapsed State | ⬜ Pass / ⬜ Fail | |
| 2 | Expand Single Card | ⬜ Pass / ⬜ Fail | |
| 3 | Collapse Expanded Card | ⬜ Pass / ⬜ Fail | |
| 4 | Multiple Cards Expanded | ⬜ Pass / ⬜ Fail | |
| 5 | Auto-Collapse After Grading | ⬜ Pass / ⬜ Fail | |
| 6 | View Button When Collapsed | ⬜ Pass / ⬜ Fail | |
| 7 | View Button When Expanded | ⬜ Pass / ⬜ Fail | |
| 8 | Search with Collapsed Cards | ⬜ Pass / ⬜ Fail | |
| 9 | Filter Tabs with Collapsed Cards | ⬜ Pass / ⬜ Fail | |
| 10 | Combined Search and Filter | ⬜ Pass / ⬜ Fail | |
| 11 | Rapid Toggle Interactions | ⬜ Pass / ⬜ Fail | |
| 12 | Mobile Responsiveness | ⬜ Pass / ⬜ Fail | |
| 13 | Animation Smoothness | ⬜ Pass / ⬜ Fail | |
| 14 | Chevron Icon Behavior | ⬜ Pass / ⬜ Fail | |
| 15 | Grading Functionality | ⬜ Pass / ⬜ Fail | |
| 16 | Empty States | ⬜ Pass / ⬜ Fail | |
| 17 | Not Submitted Students | ⬜ Pass / ⬜ Fail | |
| 18 | Performance with Many Submissions | ⬜ Pass / ⬜ Fail | |
| 19 | Browser Compatibility | ⬜ Pass / ⬜ Fail | |
| 20 | Accessibility | ⬜ Pass / ⬜ Fail | |

### Overall Result
- **Total Tests**: 20
- **Passed**: _____ / 20
- **Failed**: _____ / 20
- **Pass Rate**: _____%

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## 🚀 Quick Test Script

For rapid testing, use this quick script:

```bash
# Test 1: Default state
1. Login as teacher
2. Open activity with 10+ submissions
3. Verify: All cards collapsed (60-80px height)

# Test 2: Expand/Collapse
1. Click on first student card
2. Verify: Expands smoothly, chevron rotates
3. Click again
4. Verify: Collapses smoothly, chevron rotates back

# Test 3: Auto-collapse
1. Expand ungraded student
2. Enter score: 85
3. Click save
4. Verify: Success toast, badge updates, auto-collapses

# Test 4: View button
1. Find student with file
2. Card collapsed
3. Click "View" button
4. Verify: File opens, card stays collapsed

# Test 5: Search and filter
1. Type student name in search
2. Click "Ungraded" filter
3. Verify: Only matching ungraded students visible
4. Verify: Cards remain collapsed
```

---

## ✅ Success Criteria

The feature is considered fully tested and ready for production when:

1. ✅ All 20 test scenarios pass
2. ✅ No console errors during normal operation
3. ✅ Animations are smooth (300ms)
4. ✅ Auto-collapse works (800ms delay)
5. ✅ Search and filters work with accordion
6. ✅ Mobile responsive design works
7. ✅ No regressions in grading functionality
8. ✅ Performance is acceptable (< 2s load for 50 submissions)
9. ✅ Cross-browser compatibility confirmed
10. ✅ Accessibility requirements met

---

**End of Testing Guide**
