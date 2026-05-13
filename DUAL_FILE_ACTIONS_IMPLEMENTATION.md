# Dual File Actions (View & Download) Implementation

## Overview
This document details the implementation of dual file actions (View & Download) for both teachers and students, allowing everyone to preview files before downloading.

## Implementation Date
May 13, 2026

---

## 🎯 Feature Requirements

### 1. Side-by-Side Buttons
**Requirement**: Wherever a file attachment exists, show two distinct buttons:
- **View Button**: Opens file in Universal Modal Viewer
- **Download Button**: Triggers authenticated download

**Icons**:
- View: Eye icon (`fa-eye`)
- Download: Cloud Download icon (`fa-cloud-download-alt`)

### 2. Student Self-Preview
**Requirement**: Students must be able to view their own submitted files
- Students can preview their submissions
- Helps verify correct file was uploaded
- No need to download to check

---

## 🔧 Implementation Details

### Locations Updated

#### 1. **Activity Attachments** (Teacher's Instructions)
**Location**: Activity details page → Instructions section

**BEFORE**:
```html
<div class="attachment-actions">
    ${isViewable ? `<button>View</button>` : ''}
    <a href="...">Download</a>
</div>
```

**AFTER**:
```html
<div class="attachment-actions">
    <button onclick="viewFile(...)">
        <i class="fas fa-eye"></i> View
    </button>
    <a onclick="downloadFileAuthenticated(...)">
        <i class="fas fa-cloud-download-alt"></i> Download
    </a>
</div>
```

**Changes**:
- ✅ View button always shown (not conditional)
- ✅ Download uses authenticated function
- ✅ Both buttons side-by-side
- ✅ Consistent icons

---

#### 2. **Student's Own Submission** (Student View)
**Location**: Activity details page → Your Submission section

**BEFORE**:
```html
<div class="attachment-actions">
    ${isViewable ? `<button>View</button>` : ''}
    <a href="...">Download</a>
</div>
```

**AFTER**:
```html
<div class="attachment-actions">
    <button onclick="viewFile(...)">
        <i class="fas fa-eye"></i> View
    </button>
    <a onclick="downloadFileAuthenticated(...)">
        <i class="fas fa-cloud-download-alt"></i> Download
    </a>
</div>
```

**Key Feature**: Students can now preview their own submissions!

**Benefits**:
- ✅ Verify correct file uploaded
- ✅ Check content without downloading
- ✅ Catch mistakes before deadline

---

#### 3. **Teacher's View of Student Submissions** (Accordion Cards)
**Location**: Activity details page → Student Submissions list

**BEFORE**:
```html
<div class="attachment-actions">
    ${isViewable ? `<button>View</button>` : ''}
    <a href="...">Download</a>
</div>
```

**AFTER**:
```html
<div class="attachment-actions">
    <button onclick="viewFile(...)">
        <i class="fas fa-eye"></i> View
    </button>
    <a onclick="downloadFileAuthenticated(...)">
        <i class="fas fa-cloud-download-alt"></i> Download
    </a>
</div>
```

**Changes**:
- ✅ View button always available
- ✅ Works with accordion (collapsed/expanded)
- ✅ Authenticated download

---

#### 4. **Edit Activity Page Attachments**
**Location**: Edit activity page → Current Attachments section

**BEFORE**:
```html
<div class="attachment-actions">
    <button onclick="downloadActivityFile(...)">
        <i class="fas fa-download"></i> Download
    </button>
    <button onclick="markFileForRemoval(...)">
        <i class="fas fa-trash"></i> Remove
    </button>
</div>
```

**AFTER**:
```html
<div class="attachment-actions">
    <button onclick="viewActivityFile(...)">
        <i class="fas fa-eye"></i> View
    </button>
    <button onclick="downloadActivityFile(...)">
        <i class="fas fa-cloud-download-alt"></i> Download
    </button>
    <button onclick="markFileForRemoval(...)">
        <i class="fas fa-trash"></i> Remove
    </button>
</div>
```

**Changes**:
- ✅ Added View button
- ✅ Three buttons: View, Download, Remove
- ✅ Consistent styling

---

### JavaScript Functions

#### 1. **viewActivityFile** (NEW)
```javascript
const viewActivityFile = (filename, originalName) => {
    const fileUrl = `/api/activities/${editPageActivityId}/download/${filename}`;
    viewFile(fileUrl, originalName);
};
```

**Purpose**: Opens activity attachment in modal viewer

**Parameters**:
- `filename`: Server-side filename
- `originalName`: Original filename for display

---

#### 2. **downloadActivityFile** (UPDATED)
```javascript
const downloadActivityFile = (filename) => {
    const fileUrl = `/api/activities/${editPageActivityId}/download/${filename}`;
    const file = editPageActivityData?.attachments?.find(f => f.filename === filename);
    const originalName = file ? file.original_name : filename;
    downloadFileAuthenticated(fileUrl, originalName);
};
```

**Changes**:
- ✅ Now uses `downloadFileAuthenticated` instead of `window.open`
- ✅ Preserves original filename
- ✅ Authenticated download

---

#### 3. **downloadFileAuthenticated** (EXISTING)
```javascript
const downloadFileAuthenticated = async (fileUrl, fileName) => {
    const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${getAuthToken()}`
        }
    });
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
};
```

**Features**:
- ✅ Authenticated fetch with JWT token
- ✅ Programmatic download
- ✅ Preserves original filename
- ✅ Memory cleanup

---

### CSS Styles

#### Attachment Actions Container
```css
.attachment-actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

.attachment-actions .btn {
    white-space: nowrap;
    flex-shrink: 0;
}
```

**Features**:
- Flexbox layout
- 8px gap between buttons
- Wraps on small screens
- Buttons don't shrink

---

#### Button Sizing
```css
.attachment-actions .btn-sm {
    padding: 6px 12px;
    font-size: 0.875rem;
}

.attachment-actions .btn-icon {
    padding: 8px 12px;
    font-size: 0.875rem;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
```

**Features**:
- Consistent sizing
- Icon + text alignment
- 6px gap between icon and text

---

#### View Button Styling
```css
.btn-icon.btn-view {
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-icon.btn-view:hover:not(:disabled) {
    background: var(--primary-dark);
}

.btn-icon.btn-view:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

**Design**:
- Primary blue color
- White text
- Hover effect (darker blue)
- Disabled state (50% opacity)

---

#### Download Button Styling
```css
.btn-icon.btn-download {
    background: var(--secondary-color);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-icon.btn-download:hover:not(:disabled) {
    background: var(--border-color);
}

.btn-icon.btn-download:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

**Design**:
- Light gray background
- Dark text
- Border for definition
- Hover effect (darker gray)
- Disabled state (50% opacity)

---

## 🎨 Visual Design

### Button Layout (Side-by-Side)
```
┌─────────────────────────────────────────────────┐
│ 📄 assignment.pdf                               │
│                                                 │
│ [👁 View]  [☁ Download]                        │
└─────────────────────────────────────────────────┘
```

### Edit Page (Three Buttons)
```
┌─────────────────────────────────────────────────┐
│ 📄 instructions.pdf                             │
│                                                 │
│ [👁 View]  [☁ Download]  [🗑 Remove]           │
└─────────────────────────────────────────────────┘
```

### Mobile (Wrapped)
```
┌─────────────────────────────┐
│ 📄 assignment.pdf           │
│                             │
│ [👁 View]                   │
│ [☁ Download]                │
└─────────────────────────────┘
```

---

## 🔄 User Workflows

### Workflow 1: Student Uploads and Verifies

```
1. Student uploads file
2. Submission shows "Submitted" status
3. Student sees their attached file
4. Student clicks "View" button
5. Modal opens with file preview
6. Student verifies correct file
7. Student closes modal
8. Confident submission is correct
```

**Before**: Student had to download to verify  
**After**: Student can preview in-app

---

### Workflow 2: Teacher Reviews Submission

```
1. Teacher opens activity
2. Sees list of student submissions
3. Clicks "View" on student's file
4. Modal opens with file preview
5. Teacher reviews content
6. Teacher closes modal
7. Teacher expands card to grade
8. Teacher enters score and feedback
```

**Before**: Teacher had to download or open new tab  
**After**: Teacher previews in-app, stays on page

---

### Workflow 3: Student Downloads Own Submission

```
1. Student wants local copy
2. Student clicks "Download" button
3. Authenticated download starts
4. File saves with original filename
5. Student has local copy
```

**Before**: Direct download link (could fail with auth)  
**After**: Authenticated download (always works)

---

### Workflow 4: Teacher Edits Activity Attachments

```
1. Teacher opens edit activity page
2. Sees current attachments
3. Clicks "View" to preview attachment
4. Modal opens with file
5. Teacher verifies content
6. Teacher closes modal
7. Teacher decides to keep or remove
```

**Before**: Only download available  
**After**: Can preview before deciding

---

## 📊 Comparison: Before vs After

### Before Implementation

| Location | View Button | Download Button | Student Preview |
|----------|-------------|-----------------|-----------------|
| Activity Attachments | Conditional | Direct link | ❌ No |
| Student Submission | Conditional | Direct link | ❌ No |
| Teacher View | Conditional | Direct link | N/A |
| Edit Page | ❌ None | Direct link | N/A |

**Issues**:
- View button only for certain file types
- Direct download links (auth issues)
- Students couldn't preview their own work
- Inconsistent experience

---

### After Implementation

| Location | View Button | Download Button | Student Preview |
|----------|-------------|-----------------|-----------------|
| Activity Attachments | ✅ Always | Authenticated | ✅ Yes |
| Student Submission | ✅ Always | Authenticated | ✅ Yes |
| Teacher View | ✅ Always | Authenticated | N/A |
| Edit Page | ✅ Always | Authenticated | N/A |

**Benefits**:
- View button always available
- Authenticated downloads (no auth errors)
- Students can preview their submissions
- Consistent experience everywhere

---

## 🔒 Security Features

### 1. **Authenticated Downloads**
```javascript
headers: {
    'Authorization': `Bearer ${getAuthToken()}`
}
```
- Every download includes JWT token
- Backend validates before serving
- No unauthorized access

### 2. **Authenticated Views**
- View function uses same authenticated fetch
- Modal viewer includes JWT token
- Blob URLs are session-specific

### 3. **Consistent Security**
- Same authentication for view and download
- No security gaps
- All file access controlled

---

## 🧪 Testing Scenarios

### Test 1: Student Views Own Submission (Image)
**Steps**:
1. Login as student
2. Submit image file to activity
3. View activity details
4. Find "Your Submission" section
5. Click "View" button
6. Verify modal opens with image
7. Close modal
8. Click "Download" button
9. Verify file downloads

**Expected**: Both View and Download work

---

### Test 2: Student Views Own Submission (PDF)
**Steps**:
1. Login as student
2. Submit PDF file to activity
3. View activity details
4. Click "View" button on submission
5. Verify PDF displays in modal
6. Test scrolling through pages
7. Close modal

**Expected**: PDF displays correctly

---

### Test 3: Student Views Own Submission (Word)
**Steps**:
1. Login as student
2. Submit .docx file to activity
3. View activity details
4. Click "View" button on submission
5. Verify document converts to HTML
6. Check formatting preserved
7. Close modal

**Expected**: Word document displays with formatting

---

### Test 4: Teacher Views Student Submission
**Steps**:
1. Login as teacher
2. Open activity with submissions
3. Find student submission with file
4. Click "View" button (card collapsed)
5. Verify modal opens
6. Verify file displays
7. Close modal
8. Expand card
9. Click "View" button again
10. Verify still works

**Expected**: View works in both collapsed and expanded states

---

### Test 5: Teacher Downloads Student Submission
**Steps**:
1. Login as teacher
2. Open activity with submissions
3. Find student submission
4. Click "Download" button
5. Verify file downloads
6. Check filename is correct
7. Open downloaded file
8. Verify content matches

**Expected**: Authenticated download works

---

### Test 6: Activity Attachments (Teacher Instructions)
**Steps**:
1. Login as student or teacher
2. Open activity with attachments
3. Find activity instructions section
4. Click "View" on attachment
5. Verify modal opens
6. Close modal
7. Click "Download" on attachment
8. Verify file downloads

**Expected**: Both buttons work for activity attachments

---

### Test 7: Edit Activity Page
**Steps**:
1. Login as teacher
2. Open edit activity page
3. Find current attachments section
4. Click "View" on attachment
5. Verify modal opens
6. Close modal
7. Click "Download" on attachment
8. Verify file downloads
9. Click "Remove" on attachment
10. Verify marked for removal

**Expected**: All three buttons work (View, Download, Remove)

---

### Test 8: Mobile Responsiveness
**Steps**:
1. Open on mobile device (< 768px)
2. View activity with attachments
3. Check button layout
4. Click "View" button
5. Verify modal is full-screen
6. Close modal
7. Click "Download" button
8. Verify download works

**Expected**: Buttons wrap on mobile, all features work

---

### Test 9: Multiple File Types
**Steps**:
1. Create activity with multiple attachments:
   - Image (.jpg)
   - PDF (.pdf)
   - Word (.docx)
   - Unsupported (.zip)
2. Click "View" on each
3. Verify appropriate viewer for each
4. Verify unsupported shows download option

**Expected**: All file types handled correctly

---

### Test 10: Disabled State (Edit Page)
**Steps**:
1. Login as teacher
2. Open edit activity page
3. Mark attachment for removal
4. Verify "View" button disabled
5. Verify "Download" button disabled
6. Verify "Remove" button shows "Marked"

**Expected**: Buttons disabled when file marked for removal

---

## 📝 Key Takeaways

### What Changed
- ✅ View button always shown (not conditional)
- ✅ Download uses authenticated function
- ✅ Students can preview their own submissions
- ✅ Consistent icons (eye, cloud-download)
- ✅ Side-by-side button layout
- ✅ Added View button to edit page

### What Stayed the Same
- ✅ File serving endpoints
- ✅ Authentication mechanism
- ✅ Modal viewer functionality
- ✅ File storage structure

### Benefits
- ✅ **Student Self-Verification**: Students can check their uploads
- ✅ **Consistent Experience**: Same buttons everywhere
- ✅ **No Auth Errors**: Authenticated downloads
- ✅ **Better UX**: Preview before download
- ✅ **Universal Support**: All file types
- ✅ **Mobile Friendly**: Responsive layout

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [x] JavaScript functions updated
- [x] CSS styles added
- [x] All locations updated
- [x] No syntax errors
- [x] No diagnostics
- [ ] Manual testing completed
- [ ] Mobile testing completed

### Testing Required
- [ ] Test student viewing own submission
- [ ] Test teacher viewing student submission
- [ ] Test activity attachments
- [ ] Test edit page attachments
- [ ] Test all file types
- [ ] Test mobile responsiveness
- [ ] Test authenticated downloads
- [ ] Test disabled states

### Post-Deployment
- [ ] Verify students can preview submissions
- [ ] Verify no authentication errors
- [ ] Verify buttons display correctly
- [ ] Monitor user feedback

---

## ✅ Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Activity Attachments | ✅ Complete | View + Download buttons |
| Student Submission View | ✅ Complete | Students can preview |
| Teacher Submission View | ✅ Complete | View + Download buttons |
| Edit Page Attachments | ✅ Complete | View + Download + Remove |
| JavaScript Functions | ✅ Complete | viewActivityFile, updated downloadActivityFile |
| CSS Styles | ✅ Complete | Button styling, responsive |
| Documentation | ✅ Complete | This document |
| Testing | ⏳ Pending | Manual testing required |

---

## 🎉 Summary

This implementation successfully adds dual file actions (View & Download) throughout the application:

1. **Universal Availability**: View and Download buttons everywhere files appear
2. **Student Self-Preview**: Students can verify their submissions without downloading
3. **Consistent Design**: Same icons and layout across all locations
4. **Authenticated Actions**: Both view and download use JWT tokens
5. **Mobile Responsive**: Buttons wrap appropriately on small screens
6. **Better UX**: Preview before download, stay on same page

The dual file actions provide a complete, consistent file interaction experience for both teachers and students, with the key benefit of allowing students to verify their submissions before the deadline.
