# Frontend Implementation Guide
## Activity Edit Overhaul & Flexible Submission Workflow

This guide provides step-by-step instructions for implementing the frontend changes to complete the Activity Edit Overhaul and Flexible Submission Workflow features.

---

## 🎯 Overview

**Backend Status**: ✅ 100% Complete
**Frontend Status**: ⏳ Requires Implementation

The backend is fully functional and ready. This guide will help you implement the frontend components to utilize the new backend features.

---

## 📋 Implementation Checklist

- [ ] Task 1: Add Max Score to Create Activity Modal
- [ ] Task 2: Add Max Score to Edit Activity Modal  
- [ ] Task 3: Create Grading Modal Function
- [ ] Task 4: Add "Mark as Done" Button
- [ ] Task 5: Update Submit Validation
- [ ] Task 6: Display Submission Types

---

## Task 1: Add Max Score to Create Activity Modal

### Location
`Frontend/js/classes.js` - Find the `showCreateActivityModal()` or `handleCreateActivityEnhanced()` function

### Step 1.1: Add HTML Input Field
Find the create activity modal HTML and add this field after the deadline field:

```html
<div class="form-group">
    <label for="create-max-score">
        <i class="fas fa-star"></i> Maximum Points
    </label>
    <input 
        type="number" 
        id="create-max-score" 
        class="form-control"
        min="1" 
        step="0.01" 
        value="100" 
        required
        placeholder="100">
    <small class="form-text">Default: 100 points</small>
</div>
```

### Step 1.2: Update Form Submission
In the `handleCreateActivity()` or `handleCreateActivityEnhanced()` function, add this line when building the FormData:

```javascript
// After other formData.append() calls
formData.append('max_score', document.getElementById('create-max-score').value);
```

### Testing
1. Open create activity modal
2. Verify "Maximum Points" field appears
3. Try creating activity with default (100)
4. Try creating activity with custom value (e.g., 150)
5. Verify activity is created successfully

---

## Task 2: Add Max Score to Edit Activity Modal

### Location
`Frontend/js/classes.js` - Find the `showEditActivityModal()` function

### Step 2.1: Add HTML Input Field
Find the edit activity modal HTML and add this field:

```html
<div class="form-group">
    <label for="edit-max-score">
        <i class="fas fa-star"></i> Maximum Points
    </label>
    <input 
        type="number" 
        id="edit-max-score" 
        class="form-control"
        min="1" 
        step="0.01" 
        required
        placeholder="100">
    <small class="form-text">Points this activity is worth</small>
</div>
```

### Step 2.2: Populate Field When Loading Activity
In `showEditActivityModal()`, after fetching activity data, add:

```javascript
// After populating other fields
document.getElementById('edit-max-score').value = activity.max_score || 100;
```

### Step 2.3: Update Form Submission
In `handleEditActivity()`, add this line when building FormData:

```javascript
// After other formData.append() calls
formData.append('max_score', document.getElementById('edit-max-score').value);
```

### Testing
1. Open edit activity modal for existing activity
2. Verify "Maximum Points" field shows current value
3. Change the value (e.g., from 100 to 150)
4. Save and verify activity updates successfully
5. Reopen modal and verify new value is displayed

---

## Task 3: Create Grading Modal Function

### Location
`Frontend/js/classes.js` - Add new function (can be placed after `submitActivity()`)

### Step 3.1: Add Grading Modal Function

```javascript
// Grade submission modal
const gradeSubmissionModal = async (submissionId, studentName) => {
    try {
        showLoading();
        
        // Fetch submission details
        const response = await fetch(`/api/activities/submissions/${submissionId}/details`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load submission details');
        }
        
        const data = await response.json();
        const maxScore = data.activity?.max_score || 100;
        const submission = data.submission || {};
        
        // Determine submission type
        const isMarkAsDone = submission.content === '[MARKED_AS_DONE]';
        const hasFile = submission.file_path || submission.file;
        const hasContent = submission.content && submission.content !== '[MARKED_AS_DONE]';
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal-overlay" id="grade-modal-overlay" onclick="closeGradeModal()"></div>
            <div class="modal" id="grade-modal" style="display: block;">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2><i class="fas fa-check-circle"></i> Grade Submission</h2>
                        <button class="close-btn" onclick="closeGradeModal()">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="student-info">
                            <p><strong>Student:</strong> ${escapeHtml(studentName)}</p>
                            <p><strong>Submitted:</strong> ${submission.submission_date ? formatDate(submission.submission_date) : 'N/A'}</p>
                        </div>
                        
                        <div class="submission-preview">
                            <h3>Submission Content</h3>
                            
                            ${isMarkAsDone ? `
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i>
                                    <strong>Submitted via "Mark as Done"</strong>
                                    <p>No digital content provided. Student may have submitted physical work.</p>
                                </div>
                            ` : ''}
                            
                            ${hasContent ? `
                                <div class="content-box">
                                    <strong>Text Content:</strong>
                                    <p>${escapeHtml(submission.content)}</p>
                                </div>
                            ` : ''}
                            
                            ${hasFile ? `
                                <div class="file-box">
                                    <strong>Attached File:</strong>
                                    <a href="${submission.file?.download_url || '#'}" 
                                       target="_blank" 
                                       class="btn btn-sm btn-secondary">
                                        <i class="fas fa-download"></i>
                                        ${escapeHtml(submission.file?.original_name || 'Download File')}
                                    </a>
                                </div>
                            ` : ''}
                            
                            ${!hasFile && !hasContent && !isMarkAsDone ? `
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>No files attached - Physical Submission</strong>
                                    <p>Student may have submitted work in person.</p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <form id="grade-form" onsubmit="return false;">
                            <div class="form-group">
                                <label for="grade-score">
                                    <i class="fas fa-star"></i> Score *
                                </label>
                                <input 
                                    type="number" 
                                    id="grade-score" 
                                    class="form-control"
                                    min="0" 
                                    max="${maxScore}" 
                                    step="0.01" 
                                    value="${submission.score || ''}" 
                                    required
                                    placeholder="Enter score">
                                <small class="form-text">
                                    Maximum: ${maxScore} points
                                </small>
                            </div>
                            
                            <div class="form-group">
                                <label for="grade-feedback">
                                    <i class="fas fa-comment"></i> Feedback
                                </label>
                                <textarea 
                                    id="grade-feedback" 
                                    class="form-control"
                                    rows="4"
                                    placeholder="Provide feedback to the student...">${submission.feedback || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeGradeModal()">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="submitGrade(${submissionId}, ${data.activity?.activity_id})">
                            <i class="fas fa-save"></i> Save Grade
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus on score input
        document.getElementById('grade-score').focus();
        
    } catch (error) {
        console.error('Grade modal error:', error);
        showToast('Failed to load grading form', 'error');
    } finally {
        hideLoading();
    }
};

// Close grading modal
const closeGradeModal = () => {
    document.getElementById('grade-modal')?.remove();
    document.getElementById('grade-modal-overlay')?.remove();
};

// Submit grade
const submitGrade = async (submissionId, activityId) => {
    try {
        const score = document.getElementById('grade-score').value;
        const feedback = document.getElementById('grade-feedback').value;
        
        if (!score) {
            showToast('Please enter a score', 'error');
            return;
        }
        
        showLoading();
        
        const result = await API.gradeSubmission(submissionId, parseFloat(score), feedback);
        
        showToast('Submission graded successfully!', 'success');
        closeGradeModal();
        
        // Refresh activity details
        if (activityId) {
            viewActivityDetails(activityId);
        }
        
    } catch (error) {
        console.error('Submit grade error:', error);
        showToast(error.message || 'Failed to save grade', 'error');
    } finally {
        hideLoading();
    }
};
```

### Step 3.2: Add CSS Styles
Add these styles to `Frontend/css/styles.css`:

```css
/* Grading Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
}

.student-info {
    background: var(--secondary-color);
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
}

.submission-preview {
    margin: 1.5rem 0;
}

.content-box, .file-box {
    background: var(--card-background);
    border: 1px solid var(--border-color);
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
}

.alert {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
}

.alert-info {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    color: #1565c0;
}

.alert-warning {
    background: #fff3e0;
    border-left: 4px solid #ff9800;
    color: #e65100;
}
```

### Testing
1. View activity as teacher with submissions
2. Click "Grade" button on a submission
3. Verify modal opens with submission details
4. Verify max score is displayed correctly
5. Enter score and feedback
6. Save and verify grade is saved
7. Test with different submission types:
   - Regular submission (text + file)
   - Text-only submission
   - File-only submission
   - Mark as Done submission
   - Empty submission (physical)

---

## Task 4: Add "Mark as Done" Button

### Location
`Frontend/js/classes.js` - Find where student submission form is rendered in `renderActivityDetails()`

### Step 4.1: Add Button to Submission Area
Find the submission form HTML and update the button area:

```html
<!-- Existing submission form -->
<div class="submission-form">
    <div class="form-group">
        <label for="submission-content">Your Work (Optional)</label>
        <textarea id="submission-content" rows="5" placeholder="Enter your work here..."></textarea>
    </div>
    
    <div class="form-group">
        <label for="submission-file">Attach File (Optional)</label>
        <input type="file" id="submission-file">
    </div>
    
    <div class="submission-actions">
        <button class="btn btn-primary" onclick="submitActivity(${activity.activity_id})">
            <i class="fas fa-paper-plane"></i> Turn In
        </button>
        <button class="btn btn-secondary" onclick="markActivityAsDone(${activity.activity_id})">
            <i class="fas fa-check"></i> Mark as Done
        </button>
    </div>
    <p class="help-text">
        <i class="fas fa-info-circle"></i>
        You can submit text, a file, or both. Use "Mark as Done" if you submitted physical work.
    </p>
</div>
```

### Step 4.2: Add Mark as Done Function
Add this function after `submitActivity()`:

```javascript
// Mark activity as done (no content/file required)
const markActivityAsDone = async (activityId) => {
    // Confirmation dialog
    const confirmed = confirm(
        'Mark as done without attaching files?\n\n' +
        'This will submit the activity without any digital content. ' +
        'Use this if you submitted physical work or completed the activity offline.\n\n' +
        'Continue?'
    );
    
    if (!confirmed) return;
    
    try {
        showLoading();
        
        // Create FormData with mark_as_done flag
        const formData = new FormData();
        formData.append('mark_as_done', 'true');
        
        const response = await fetch(`/api/activities/${activityId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to mark as done');
        }
        
        showToast('Activity marked as done successfully!', 'success');
        
        // Reload activity details to show submission
        viewActivityDetails(activityId);
        
    } catch (error) {
        console.error('Mark as done error:', error);
        showToast(error.message || 'Failed to mark as done', 'error');
    } finally {
        hideLoading();
    }
};
```

### Testing
1. View activity as student
2. Verify "Mark as Done" button appears
3. Click button and verify confirmation dialog
4. Confirm and verify activity is submitted
5. Verify activity moves to "Submitted" tab
6. Verify teacher sees "Mark as Done" indicator

---

## Task 5: Update Submit Validation

### Location
`Frontend/js/classes.js` - Find the `submitActivity()` function

### Step 5.1: Update Validation Logic
Change the validation from requiring both to requiring either:

```javascript
const submitActivity = async (activityId) => {
    const content = document.getElementById('submission-content')?.value.trim() || '';
    const fileInput = document.getElementById('submission-file');
    const file = fileInput?.files[0];
    
    // CHANGED: Allow submission if EITHER content OR file is provided
    if (!content && !file) {
        showToast('Please provide either text content or attach a file before submitting', 'error');
        return;
    }
    
    const confirmed = confirm('Are you sure you want to submit this work?');
    if (!confirmed) return;
    
    try {
        showLoading();
        
        // Create FormData for file upload
        const formData = new FormData();
        if (content) formData.append('content', content);
        if (file) formData.append('file', file);
        
        const response = await fetch(`/api/activities/${activityId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit work');
        }
        
        showToast('Work submitted successfully!', 'success');
        
        // Reload activity details to show submission
        viewActivityDetails(activityId);
        
    } catch (error) {
        console.error('Submit activity error:', error);
        showToast(error.message || 'Failed to submit work', 'error');
    } finally {
        hideLoading();
    }
};
```

### Step 5.2: Update Form Labels
Update the form labels to indicate fields are optional:

```html
<label for="submission-content">Your Work (Optional)</label>
<label for="submission-file">Attach File (Optional)</label>
```

### Testing
1. Try submitting with only text (no file) - should work ✅
2. Try submitting with only file (no text) - should work ✅
3. Try submitting with both - should work ✅
4. Try submitting with neither - should show error ❌

---

## Task 6: Display Submission Types

### Location
`Frontend/js/classes.js` - Find where teacher views submissions in `renderActivityDetails()`

### Step 6.1: Update Submission Display Logic
Find the teacher's submission list rendering and update:

```javascript
// In the teacher's view of submissions
allSubmissions.map(sub => {
    // Determine submission type
    const isMarkAsDone = sub.content === '[MARKED_AS_DONE]';
    const hasFile = sub.file_path || sub.file;
    const hasContent = sub.content && sub.content !== '[MARKED_AS_DONE]';
    
    return `
        <div class="submission-card">
            <div class="submission-header">
                <h4>${escapeHtml(sub.student_name)}</h4>
                ${sub.submission_date ? `
                    <span class="submission-date">
                        <i class="fas fa-clock"></i>
                        ${formatDate(sub.submission_date)}
                    </span>
                ` : '<span class="no-submission">Not submitted</span>'}
            </div>
            
            ${sub.submission_id ? `
                <div class="submission-content">
                    ${isMarkAsDone ? `
                        <div class="submission-type mark-as-done">
                            <i class="fas fa-check-circle"></i>
                            <strong>Submitted via "Mark as Done"</strong>
                            <p>No digital content provided</p>
                        </div>
                    ` : ''}
                    
                    ${hasContent ? `
                        <div class="text-content">
                            <strong>Text Content:</strong>
                            <p>${escapeHtml(sub.content.substring(0, 150))}${sub.content.length > 150 ? '...' : ''}</p>
                        </div>
                    ` : ''}
                    
                    ${hasFile ? `
                        <div class="file-content">
                            <strong>Attached File:</strong>
                            <a href="${sub.file?.download_url || '#'}" target="_blank">
                                <i class="fas fa-file"></i>
                                ${escapeHtml(sub.file?.original_name || 'Download')}
                            </a>
                        </div>
                    ` : ''}
                    
                    ${!hasFile && !hasContent && !isMarkAsDone ? `
                        <div class="submission-type physical">
                            <i class="fas fa-hand-paper"></i>
                            <strong>No files attached - Physical Submission</strong>
                        </div>
                    ` : ''}
                    
                    ${sub.score !== null ? `
                        <div class="grade-display">
                            <strong>Grade:</strong> ${formatScore(sub.score)}
                            ${sub.feedback ? `<p><strong>Feedback:</strong> ${escapeHtml(sub.feedback)}</p>` : ''}
                        </div>
                    ` : `
                        <button class="btn btn-sm btn-primary" 
                                onclick="gradeSubmissionModal(${sub.submission_id}, '${escapeHtml(sub.student_name)}')">
                            <i class="fas fa-check"></i> Grade
                        </button>
                    `}
                </div>
            ` : ''}
        </div>
    `;
}).join('');
```

### Step 6.2: Add CSS Styles
Add these styles to `Frontend/css/styles.css`:

```css
/* Submission Type Indicators */
.submission-type {
    padding: 0.75rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.submission-type.mark-as-done {
    background: #e3f2fd;
    border-left: 4px solid #2196f3;
    color: #1565c0;
}

.submission-type.physical {
    background: #fff3e0;
    border-left: 4px solid #ff9800;
    color: #e65100;
}

.submission-type i {
    font-size: 1.2rem;
}

.text-content, .file-content {
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: var(--secondary-color);
    border-radius: 4px;
}

.grade-display {
    margin-top: 1rem;
    padding: 1rem;
    background: #e8f5e9;
    border-left: 4px solid #4caf50;
    border-radius: 4px;
}
```

### Testing
1. View activity as teacher
2. Verify different submission types display correctly:
   - Mark as Done: Blue indicator
   - Physical: Orange indicator
   - Regular: Shows content/file
3. Verify grade button appears for ungraded submissions
4. Verify grade display appears for graded submissions

---

## 🧪 Complete Testing Checklist

### Create Activity
- [ ] Max score field appears in create modal
- [ ] Default value is 100
- [ ] Can create with custom max score
- [ ] Activity created successfully

### Edit Activity
- [ ] Max score field appears in edit modal
- [ ] Current value is displayed
- [ ] Can update max score
- [ ] Activity updated successfully

### Grading
- [ ] Grading modal opens correctly
- [ ] Max score is displayed
- [ ] Score validation works (0 to max_score)
- [ ] Can grade regular submissions
- [ ] Can grade Mark as Done submissions
- [ ] Can grade physical submissions
- [ ] Grade saves successfully

### Student Submission
- [ ] "Mark as Done" button appears
- [ ] Confirmation dialog shows
- [ ] Mark as Done submits successfully
- [ ] Can submit text only
- [ ] Can submit file only
- [ ] Can submit both
- [ ] Cannot submit neither

### Teacher View
- [ ] Mark as Done submissions show blue indicator
- [ ] Physical submissions show orange indicator
- [ ] Regular submissions show content/file
- [ ] Graded submissions show score
- [ ] Ungraded submissions show grade button

### Dashboard
- [ ] Only 3 stat cards show (no Submissions Made)
- [ ] Clicking activity navigates to details

---

## 🚀 Deployment

### Step 1: Implement Changes
Follow each task above in order

### Step 2: Test Locally
Complete the testing checklist

### Step 3: Deploy
1. Commit frontend changes
2. Deploy to server
3. Clear browser caches
4. Test in production

---

## 💡 Tips

### Debugging
- Check browser console for errors
- Verify API responses in Network tab
- Test with different user roles (student/teacher)
- Test with different submission types

### Common Issues
- **Modal not showing**: Check z-index and display styles
- **Validation not working**: Check input IDs match JavaScript
- **API errors**: Verify backend is deployed and running
- **Styling issues**: Clear browser cache

### Best Practices
- Test each task before moving to next
- Use browser dev tools to debug
- Test with multiple browsers
- Test on mobile devices

---

**Status**: Ready for Implementation
**Estimated Time**: 4-6 hours
**Difficulty**: Intermediate
