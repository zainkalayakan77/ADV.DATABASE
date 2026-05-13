# Enhanced Create Activity Modal - Testing Guide
## Quick Verification Steps

**Time Required**: 10 minutes  
**Prerequisites**: Server running, logged in as teacher

---

## Test 1: Modal Appearance (2 minutes)

### Steps:
1. ✅ Login as teacher
2. ✅ Navigate to any class
3. ✅ Click "Create Activity" button

### Expected Result:
- ✅ Modal slides in smoothly
- ✅ Modal is **800px wide** (or 95% on smaller screens)
- ✅ **Rounded corners** (16px radius)
- ✅ **Soft drop shadow** visible
- ✅ **Gradient header** (blue gradient)
- ✅ Header shows "Create New Assignment" with icon
- ✅ Close button (×) in top right

### Visual Check:
- Header should be blue gradient with white text
- Sections should be in rounded cards
- Plenty of white space
- Professional appearance

---

## Test 2: File Selection & Queue (3 minutes)

### Steps:
1. ✅ In create modal, scroll to "File Attachments"
2. ✅ Click "Choose Files to Attach"
3. ✅ Select 2-3 files (different types: PDF, image, Word doc)
4. ✅ Observe file queue below upload area

### Expected Result:
- ✅ Files appear in queue immediately
- ✅ Each file shows:
  - Appropriate icon (📄 for PDF, 🖼️ for image, etc.)
  - Filename
  - File size (e.g., "2.5 MB")
  - Red trash icon button
- ✅ Files slide in with animation
- ✅ No "No files selected" message

### Visual Check:
```
┌──────────────────────────────────────────┐
│ 📄 homework.pdf                          │
│    2.5 MB                         [🗑️]  │
├──────────────────────────────────────────┤
│ 🖼️ diagram.png                           │
│    856 KB                         [🗑️]  │
└──────────────────────────────────────────┘
```

---

## Test 3: File Removal (2 minutes)

### Steps:
1. ✅ With files in queue, click trash icon on one file
2. ✅ Observe the result

### Expected Result:
- ✅ File disappears from queue
- ✅ Toast notification: "File removed from queue"
- ✅ Other files remain
- ✅ Smooth animation

### Test Multiple Removals:
1. ✅ Remove all files one by one
2. ✅ Queue should show: "No files selected yet"

---

## Test 4: Add More Files (1 minute)

### Steps:
1. ✅ Add 2 files
2. ✅ Click "Choose Files" again
3. ✅ Add 2 more files

### Expected Result:
- ✅ All 4 files appear in queue
- ✅ No duplicates if same file selected
- ✅ Files listed in order added

---

## Test 5: File Size Validation (1 minute)

### Setup:
1. ✅ Find a file larger than 20MB (or create one)

### Steps:
1. ✅ Add the large file to queue
2. ✅ Fill in title
3. ✅ Click "Create Activity"

### Expected Result:
- ✅ Error toast: "Some files exceed 20MB limit: [filename]"
- ✅ Form doesn't submit
- ✅ Modal remains open
- ✅ Can remove large file and try again

---

## Test 6: Complete Activity Creation (2 minutes)

### Steps:
1. ✅ Fill in title: "Test Activity"
2. ✅ Add description: "This is a test"
3. ✅ Set deadline (optional)
4. ✅ Toggle submissions ON
5. ✅ Add 2 files
6. ✅ Add teacher notes (optional)
7. ✅ Click "Create Activity"

### Expected Result:
- ✅ Loading spinner appears
- ✅ Success toast: "Activity created successfully! (2 file(s) attached)"
- ✅ Modal closes
- ✅ Activity appears in class list
- ✅ Files are attached to activity

### Verify:
1. ✅ Click on created activity
2. ✅ Verify files are listed
3. ✅ Can download files

---

## Test 7: Toggle Control (1 minute)

### Steps:
1. ✅ Open create modal
2. ✅ Observe toggle (should be ON by default)
3. ✅ Click toggle to turn OFF
4. ✅ Click toggle to turn ON again

### Expected Result:
- ✅ Toggle switches smoothly
- ✅ **OFF**: Gray background, slider on left
- ✅ **ON**: Green background, slider on right
- ✅ Info box explains ON/OFF states
- ✅ Animation smooth (0.3s transition)

---

## Test 8: Form Validation (1 minute)

### Test 8a: Empty Title
1. ✅ Leave title empty
2. ✅ Click "Create Activity"
3. ✅ Should show error: "Activity title is required"

### Test 8b: Only Title
1. ✅ Enter title only (no description, files, etc.)
2. ✅ Click "Create Activity"
3. ✅ Should create successfully

---

## Test 9: Modal Close & Reset (1 minute)

### Test 9a: Close with X
1. ✅ Open modal
2. ✅ Add some files
3. ✅ Click X button
4. ✅ Reopen modal
5. ✅ File queue should be empty

### Test 9b: Close with Cancel
1. ✅ Open modal
2. ✅ Add some files
3. ✅ Click "Cancel"
4. ✅ Reopen modal
5. ✅ File queue should be empty

### Test 9c: Close with Escape
1. ✅ Open modal
2. ✅ Press Escape key
3. ✅ Modal should close

---

## Test 10: Responsive Design (1 minute)

### Desktop (> 768px)
1. ✅ Modal is 800px wide
2. ✅ Comfortable spacing
3. ✅ Buttons side by side

### Tablet (768px)
1. ✅ Resize browser to ~768px
2. ✅ Modal adjusts to 95% width
3. ✅ Still readable

### Mobile (< 768px)
1. ✅ Resize browser to ~375px
2. ✅ Modal is 98% width
3. ✅ Buttons stack vertically
4. ✅ File items stack
5. ✅ Touch-friendly

---

## Quick Verification Checklist

After running all tests, verify:

- [ ] Modal is 800px wide (desktop)
- [ ] Rounded corners visible
- [ ] Drop shadow present
- [ ] Gradient header displays
- [ ] Files appear in queue
- [ ] File icons correct
- [ ] File sizes display
- [ ] Remove button works
- [ ] Can add multiple files
- [ ] File size validation works
- [ ] Activity creates successfully
- [ ] Toggle switches smoothly
- [ ] Form validation works
- [ ] Modal resets on close
- [ ] Responsive on mobile
- [ ] No console errors

---

## Visual Inspection

### Header
- [ ] Blue gradient background
- [ ] White text
- [ ] Plus icon visible
- [ ] "Create New Assignment" title
- [ ] Close button (×) in circle

### Sections
- [ ] Each section in rounded card
- [ ] Section titles with icons
- [ ] Proper spacing between sections
- [ ] Hover effects on cards

### File Queue
- [ ] Files in rounded cards
- [ ] Icons colored correctly
- [ ] File sizes formatted (KB/MB)
- [ ] Trash icons red
- [ ] Hover effects on file cards

### Toggle
- [ ] Large toggle switch (60px wide)
- [ ] Smooth animation
- [ ] Green when ON
- [ ] Gray when OFF
- [ ] Info box below toggle

### Footer
- [ ] Buttons aligned right
- [ ] Cancel button gray
- [ ] Create button blue
- [ ] Icons in buttons
- [ ] Hover effects

---

## Performance Check

### Timing
- [ ] Modal opens in < 100ms
- [ ] File adds in < 50ms
- [ ] File removes in < 50ms
- [ ] Form submits in < 2s

### Animations
- [ ] Modal slide-in smooth
- [ ] File slide-in smooth
- [ ] Toggle transition smooth
- [ ] Button hover smooth

---

## Browser Console Commands

### Check if files are stored:
```javascript
selectedFiles
// Should show array of File objects
```

### Check file count:
```javascript
selectedFiles.length
// Should show number of files in queue
```

### Manually add file to queue:
```javascript
// Not recommended, but for testing:
const file = new File(["content"], "test.txt", { type: "text/plain" });
selectedFiles.push(file);
renderFileQueue();
```

### Clear file queue:
```javascript
selectedFiles = [];
renderFileQueue();
```

---

## Common Issues & Solutions

### Issue: Files don't appear in queue

**Cause**: Event listener not attached  
**Solution**: 
- Refresh page
- Check console for errors
- Verify `handleFileSelection` function exists

### Issue: Remove button doesn't work

**Cause**: Function not defined  
**Solution**:
- Check `removeFileFromQueue` exists
- Verify onclick attribute correct
- Check console for errors

### Issue: Modal too small

**Cause**: CSS not loaded  
**Solution**:
- Clear browser cache
- Verify styles.css loaded
- Check `.modal-content-large` class

### Issue: No gradient header

**Cause**: CSS not applied  
**Solution**:
- Check `.modal-header-enhanced` class
- Verify CSS loaded
- Check browser compatibility

---

## Success Criteria

### ✅ All Tests Pass

- Modal displays correctly
- Files can be added
- Files can be removed
- File validation works
- Activity creates successfully
- Toggle works smoothly
- Form validation works
- Modal resets properly
- Responsive design works

### ✅ Visual Quality

- Professional appearance
- Smooth animations
- Clear visual hierarchy
- Intuitive interface
- Mobile-friendly

---

**Testing Time**: 10 minutes  
**Difficulty**: Easy  
**Coverage**: Complete feature set

