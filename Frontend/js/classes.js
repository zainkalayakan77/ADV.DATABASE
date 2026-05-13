// Classes Management Functions

let currentClassId = null;
let currentClassData = null;

// Make currentClassId accessible globally for dashboard refresh
window.currentClassId = null;

// Show classes page
const showClasses = async () => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show classes page
    document.getElementById('classes-page').style.display = 'block';
    
    // Load classes data
    await loadUserClasses();
};

// Load user's classes and store for filtering
const loadUserClasses = async () => {
    const data = await handleAPICall(
        () => classAPI.getUserClasses(),
        'Failed to load classes'
    );
    
    if (data) {
        allClasses = data.classes;
        renderClassesGrid(data.classes);
    }
};

// Render classes grid with management options
const renderClassesGrid = (classes) => {
    const container = document.getElementById('classes-grid');
    
    if (!classes || classes.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-chalkboard" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3>No Classes Yet</h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">
                    Create your first class or join an existing one to get started.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="showCreateClassModal()">
                        <i class="fas fa-plus"></i> Create Class
                    </button>
                    <button class="btn btn-secondary" onclick="showJoinClassModal()">
                        <i class="fas fa-sign-in-alt"></i> Join Class
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = classes.map(classItem => `
        <div class="class-card" onclick="showClassDetails(${classItem.class_id})">
            <div class="class-card-header">
                <h3>${escapeHtml(classItem.class_name)}</h3>
                <div class="class-settings" onclick="event.stopPropagation(); toggleClassSettings(${classItem.class_id})">
                    <i class="fas fa-cog"></i>
                    <div class="settings-dropdown" id="settings-${classItem.class_id}">
                        ${classItem.role === 'Teacher' ? `
                            <a href="#" onclick="event.stopPropagation(); archiveClass(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')">
                                <i class="fas fa-archive"></i> Archive Room
                            </a>
                            <a href="#" onclick="event.stopPropagation(); deleteClass(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')" class="danger">
                                <i class="fas fa-trash"></i> Delete Room
                            </a>
                        ` : `
                            <a href="#" onclick="event.stopPropagation(); archiveClassPersonal(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')">
                                <i class="fas fa-archive"></i> Archive Class
                            </a>
                            <a href="#" onclick="event.stopPropagation(); leaveClass(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')" class="danger">
                                <i class="fas fa-sign-out-alt"></i> Leave Class
                            </a>
                        `}
                    </div>
                </div>
            </div>
            <div class="class-code">Code: ${classItem.class_code}</div>
            ${classItem.subject ? `<p class="class-subject"><i class="fas fa-book"></i> ${escapeHtml(classItem.subject)}</p>` : ''}
            ${classItem.section ? `<p class="class-section"><i class="fas fa-users"></i> Section ${escapeHtml(classItem.section)}</p>` : ''}
            ${classItem.description ? `<p class="class-description">${escapeHtml(classItem.description)}</p>` : ''}
            <div class="class-meta">
                <div>
                    <span class="role-badge role-${classItem.role.toLowerCase()}">
                        ${classItem.role}
                    </span>
                </div>
                <div>
                    <small><i class="fas fa-tasks"></i> ${classItem.total_activities} activities</small><br>
                    <small><i class="fas fa-users"></i> ${classItem.total_members} members</small>
                </div>
            </div>
            <div class="class-meta">
                <small>Created by: ${escapeHtml(classItem.created_by_name)}</small>
                <small>Joined: ${formatDate(classItem.enrolled_at)}</small>
            </div>
        </div>
    `).join('');
};

// Show class details page
const showClassDetails = async (classId) => {
    currentClassId = classId;
    window.currentClassId = classId; // Make accessible globally
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show class details page
    document.getElementById('class-details-page').style.display = 'block';
    
    // Load class details
    await loadClassDetails(classId);
};

// Load class details with access validation
const loadClassDetails = async (classId) => {
    try {
        const data = await handleAPICall(
            () => classAPI.getDetails(classId),
            'Failed to load class details'
        );
        
        if (data) {
            currentClassData = data;
            renderClassDetails(data);
            renderClassMembers(data.members, data.user_role);
            await loadClassActivities(classId);
        }
    } catch (error) {
        // If access is denied, user might have been kicked
        if (error.message.includes('Access denied') || error.message.includes('revoked')) {
            showToast('Your access to this class has been revoked. Redirecting to dashboard...', 'error');
            setTimeout(() => {
                showDashboard();
            }, 2000);
        } else {
            console.error('Load class details error:', error);
        }
    }
};

// Render class details
const renderClassDetails = (data) => {
    const { class: classInfo, user_role } = data;
    
    // Update page title
    document.getElementById('class-details-title').textContent = classInfo.class_name;
    
    // Update class actions based on user role (removed Manage Members button)
    const actionsContainer = document.getElementById('class-actions');
    if (user_role === 'Teacher') {
        actionsContainer.innerHTML = `
            <button class="btn btn-primary" onclick="showCreateActivityModal()">
                <i class="fas fa-plus"></i> Create Activity
            </button>
        `;
    } else {
        actionsContainer.innerHTML = '';
    }
    
    // Update class info card
    document.getElementById('class-info').innerHTML = `
        <h3>${escapeHtml(classInfo.class_name)}</h3>
        <div class="class-code">Class Code: ${classInfo.class_code}</div>
        ${classInfo.description ? `<p>${escapeHtml(classInfo.description)}</p>` : ''}
        <div class="class-meta">
            <span><i class="fas fa-user"></i> Created by: ${escapeHtml(classInfo.created_by_name)}</span>
            <span><i class="fas fa-calendar"></i> Created: ${formatDate(classInfo.created_at)}</span>
        </div>
        <div class="class-meta">
            <span class="role-badge role-${user_role.toLowerCase()}">Your Role: ${user_role}</span>
        </div>
    `;
};

// Load class activities with better error handling
const loadClassActivities = async (classId) => {
    try {
        const data = await handleAPICall(
            () => activityAPI.getClassActivities(classId),
            'Failed to load activities'
        );
        
        if (data) {
            renderClassActivities(data.activities);
        }
    } catch (error) {
        // If access is denied, user might have been kicked
        if (error.message.includes('Access denied') || error.message.includes('revoked')) {
            showToast('Your access to this class has been revoked. Redirecting to dashboard...', 'error');
            setTimeout(() => {
                showDashboard();
            }, 2000);
        } else {
            console.error('Load activities error:', error);
        }
    }
};

// Render class activities with proper student view
const renderClassActivities = (activities) => {
    const container = document.getElementById('class-activities');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-tasks"></i><br>
                    No activities yet
                </p>
            </div>
        `;
        return;
    }
    
    // Store activities globally for filtering
    window.currentActivities = activities;
    
    // Check user role from currentClassData (set in loadClassDetails)
    const userRole = currentClassData?.user_role || 'Student';
    const isTeacher = userRole === 'Teacher';
    
    if (isTeacher) {
        // Teachers see a simple list without tabs
        renderTeacherActivities(activities);
    } else {
        // Students see tabs for filtering (Assigned, Submitted, Missing)
        renderStudentActivitiesWithTabs(activities);
    }
};

// Render activities with tabs for students
const renderStudentActivitiesWithTabs = (activities) => {
    const container = document.getElementById('class-activities');
    
    // Calculate counts for each category
    const now = new Date();
    const counts = {
        all: activities.length,
        assigned: activities.filter(a => !a.submission_id && (!a.deadline || new Date(a.deadline) >= now)).length,
        submitted: activities.filter(a => a.submission_id !== null).length,
        missing: activities.filter(a => !a.submission_id && a.deadline && new Date(a.deadline) < now).length
    };
    
    // Create tabs HTML
    const tabsHTML = `
        <div class="activity-tabs">
            <button class="activity-tab active" data-filter="all">
                <i class="fas fa-list"></i>
                All
                <span class="activity-tab-count">${counts.all}</span>
            </button>
            <button class="activity-tab" data-filter="assigned">
                <i class="fas fa-clipboard-list"></i>
                Assigned
                <span class="activity-tab-count">${counts.assigned}</span>
            </button>
            <button class="activity-tab" data-filter="submitted">
                <i class="fas fa-check-circle"></i>
                Submitted
                <span class="activity-tab-count">${counts.submitted}</span>
            </button>
            <button class="activity-tab" data-filter="missing">
                <i class="fas fa-exclamation-triangle"></i>
                Missing
                <span class="activity-tab-count">${counts.missing}</span>
            </button>
        </div>
        <div id="activities-list"></div>
    `;
    
    container.innerHTML = tabsHTML;
    
    // Add click handlers to tabs
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.activity-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter activities
            const filter = tab.dataset.filter;
            filterActivitiesByTab(activities, filter);
        });
    });
    
    // Show all activities initially
    filterActivitiesByTab(activities, 'all');
};

// Filter activities based on selected tab
const filterActivitiesByTab = (activities, filter) => {
    const now = new Date();
    let filteredActivities = [];
    
    switch(filter) {
        case 'assigned':
            filteredActivities = activities.filter(a => 
                !a.submission_id && (!a.deadline || new Date(a.deadline) >= now)
            );
            break;
        case 'submitted':
            filteredActivities = activities.filter(a => a.submission_id !== null);
            break;
        case 'missing':
            filteredActivities = activities.filter(a => 
                !a.submission_id && a.deadline && new Date(a.deadline) < now
            );
            break;
        default:
            filteredActivities = activities;
    }
    
    renderFilteredActivities(filteredActivities, filter);
};

// Render filtered activities
const renderFilteredActivities = (activities, filter) => {
    const listContainer = document.getElementById('activities-list');
    
    if (activities.length === 0) {
        // Show empty state message
        const emptyMessages = {
            all: {
                icon: 'fa-tasks',
                title: 'No activities yet',
                message: 'Your teacher hasn\'t posted any activities yet.'
            },
            assigned: {
                icon: 'fa-check-circle',
                title: 'You\'re all caught up!',
                message: 'No pending assignments at the moment.'
            },
            submitted: {
                icon: 'fa-clipboard-check',
                title: 'No submissions yet',
                message: 'You haven\'t submitted any work yet.'
            },
            missing: {
                icon: 'fa-smile',
                title: 'Great job!',
                message: 'You have no missing assignments.'
            }
        };
        
        const msg = emptyMessages[filter] || emptyMessages.all;
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas ${msg.icon}"></i>
                <h3>${msg.title}</h3>
                <p>${msg.message}</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = activities.map(activity => {
        const hasSubmission = activity.submission_id !== null;
        const isGraded = activity.score !== null;
        const isOverdue = activity.deadline && new Date() > new Date(activity.deadline);
        
        // Determine status badge
        let statusBadge = '';
        let statusClass = '';
        
        if (hasSubmission) {
            if (isGraded) {
                statusBadge = `Graded: ${formatScore(activity.score)}`;
                statusClass = 'status-submitted';
            } else {
                statusBadge = 'Submitted';
                statusClass = 'status-submitted';
            }
        } else if (isOverdue) {
            statusBadge = 'Missing';
            statusClass = 'status-missing';
        } else {
            statusBadge = 'Assigned';
            statusClass = 'status-assigned';
        }
        
        return `
            <div class="activity-item" onclick="viewActivityDetails(${activity.activity_id})">
                <div class="activity-info">
                    <h4>${escapeHtml(activity.title)}</h4>
                    ${activity.description ? `<p>${escapeHtml(activity.description)}</p>` : ''}
                    <p><i class="fas fa-clock"></i> Due: ${formatDate(activity.deadline)}</p>
                    <p><i class="fas fa-user"></i> Created by: ${escapeHtml(activity.created_by_name)}</p>
                </div>
                <span class="activity-status ${statusClass}">${statusBadge}</span>
            </div>
        `;
    }).join('');
};

// Render activities for teachers (no tabs - clean vertical list)
const renderTeacherActivities = (activities) => {
    const container = document.getElementById('class-activities');
    
    container.innerHTML = activities.map(activity => {
        // Calculate submission statistics
        const totalSubmissions = activity.total_submissions || 0;
        const isOverdue = activity.deadline && new Date() > new Date(activity.deadline);
        const isAcceptingSubmissions = activity.is_accepting_submissions !== false;
        
        // Determine status badge for teacher view
        let statusBadge = '';
        if (!isAcceptingSubmissions) {
            statusBadge = `<span class="activity-status status-closed">Closed</span>`;
        } else if (isOverdue) {
            statusBadge = `<span class="activity-status status-overdue">Past Deadline</span>`;
        } else {
            statusBadge = `<span class="activity-status status-open">Open</span>`;
        }
        
        return `
            <div class="activity-item" onclick="viewActivityDetails(${activity.activity_id})">
                <div class="activity-info">
                    <h4>${escapeHtml(activity.title)}</h4>
                    ${activity.description ? `<p>${escapeHtml(activity.description)}</p>` : ''}
                    <div class="activity-meta-row">
                        ${activity.deadline ? `<span><i class="fas fa-clock"></i> Due: ${formatDate(activity.deadline)}</span>` : '<span><i class="fas fa-infinity"></i> No deadline</span>'}
                        <span><i class="fas fa-file-alt"></i> ${totalSubmissions} submission${totalSubmissions !== 1 ? 's' : ''}</span>
                        <span><i class="fas fa-calendar"></i> Created: ${formatDate(activity.created_at)}</span>
                    </div>
                </div>
                ${statusBadge}
            </div>
        `;
    }).join('');
};

// Render class members with kick functionality
const renderClassMembers = (members, userRole) => {
    const container = document.getElementById('class-members');
    
    if (!members || members.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p style="text-align: center; color: var(--text-secondary);">No members found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="members-list">
            ${members.map(member => `
                <div class="member-item">
                    <div class="member-info">
                        <h4>${escapeHtml(member.name)}</h4>
                        <p>${escapeHtml(member.email)}</p>
                        <small>Joined: ${formatDate(member.enrolled_at)}</small>
                    </div>
                    <div class="member-actions">
                        <span class="role-badge role-${member.role.toLowerCase()}">${member.role}</span>
                        ${userRole === 'Teacher' && member.role === 'Student' ? `
                            <button class="btn btn-error btn-sm" onclick="kickMember(${member.user_id}, '${escapeHtml(member.name)}')" 
                                    style="margin-left: 10px; padding: 4px 8px; font-size: 0.8rem;">
                                <i class="fas fa-user-times"></i> Kick
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// Show/hide tabs
const showTab = (tabName) => {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
};

// Modal functions
const showCreateClassModal = () => {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('create-class-modal').style.display = 'block';
};

const showJoinClassModal = () => {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('join-class-modal').style.display = 'block';
};

const closeModal = () => {
    document.getElementById('modal-overlay').style.display = 'none';
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset forms
    document.querySelectorAll('.modal form').forEach(form => {
        form.reset();
    });
};

// Handle create class with subject and section
const handleCreateClass = async (event) => {
    event.preventDefault();
    
    const className = document.getElementById('class-name').value.trim();
    const subject = document.getElementById('class-subject').value.trim();
    const section = document.getElementById('class-section').value.trim();
    const description = document.getElementById('class-description').value.trim();
    
    if (!className) {
        showToast('Class name is required', 'error');
        return;
    }
    
    const result = await handleAPICall(
        () => classAPI.create({ class_name: className, subject, section, description }),
        'Failed to create class'
    );
    
    if (result) {
        showToast('Class created successfully!', 'success');
        closeModal();
        await loadUserClasses(); // Refresh classes list
    }
};

// Filter classes in real-time
let allClasses = [];

const filterClasses = () => {
    const searchTerm = document.getElementById('class-search').value.toLowerCase();
    
    if (!searchTerm) {
        renderClassesGrid(allClasses);
        return;
    }
    
    const filtered = allClasses.filter(classItem => {
        const name = classItem.class_name.toLowerCase();
        const subject = (classItem.subject || '').toLowerCase();
        const section = (classItem.section || '').toLowerCase();
        const description = (classItem.description || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               subject.includes(searchTerm) || 
               section.includes(searchTerm) ||
               description.includes(searchTerm);
    });
    
    renderClassesGrid(filtered);
};

// Handle join class with kicked user support
const handleJoinClass = async (event) => {
    event.preventDefault();
    
    const classCode = document.getElementById('class-code').value.trim().toUpperCase();
    
    if (!classCode) {
        showToast('Class code is required', 'error');
        return;
    }
    
    try {
        showLoading();
        const response = await fetch('/api/classes/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ class_code: classCode })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            // Handle kicked user case
            if (result.kicked) {
                hideLoading();
                showKickedUserModal(result.class_id, result.class_name);
                return;
            }
            throw new Error(result.error || 'Failed to join class');
        }
        
        showToast(`Successfully joined ${result.class.name}!`, 'success');
        closeModal();
        await loadUserClasses(); // Refresh classes list
        
    } catch (error) {
        console.error('Join class error:', error);
        showToast(error.message || 'Failed to join class', 'error');
    } finally {
        hideLoading();
    }
};

// Show modal for kicked users to request re-entry
const showKickedUserModal = (classId, className) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Request Re-entry</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div style="padding: 20px;">
                <p><strong>Class:</strong> ${escapeHtml(className)}</p>
                <p>You were previously removed from this class. To rejoin, you need to request permission from the teacher.</p>
                
                <div class="form-group">
                    <label for="rejoin-message">Message to Teacher (Optional)</label>
                    <textarea id="rejoin-message" rows="3" placeholder="Explain why you'd like to rejoin the class..."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="submitRejoinRequest(${classId}, '${escapeHtml(className)}'); this.closest('.modal').remove();">
                        <i class="fas fa-paper-plane"></i> Request Re-entry
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Submit rejoin request
const submitRejoinRequest = async (classId, className) => {
    const message = document.getElementById('rejoin-message')?.value.trim() || '';
    
    const result = await handleAPICall(
        () => fetch(`/api/members/classes/${classId}/join-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ message })
        }).then(res => res.json()),
        'Failed to submit rejoin request'
    );
    
    if (result) {
        showToast(`Re-entry request sent for ${className}. Please wait for teacher approval.`, 'success');
        closeModal();
    }
};

// Toggle class settings dropdown
const toggleClassSettings = (classId) => {
    const dropdown = document.getElementById(`settings-${classId}`);
    // Close all other dropdowns
    document.querySelectorAll('.settings-dropdown').forEach(d => {
        if (d.id !== `settings-${classId}`) {
            d.classList.remove('show');
        }
    });
    dropdown.classList.toggle('show');
};

// Archive class
const archiveClass = async (classId, className) => {
    const confirmed = confirm(`Are you sure you want to archive "${className}"? You can restore it later from Archived Rooms.`);
    if (!confirmed) return;
    
    const result = await handleAPICall(
        () => classAPI.archive(classId),
        'Failed to archive class'
    );
    
    if (result) {
        showToast(`"${className}" has been archived`, 'success');
        await loadUserClasses(); // Refresh classes list
    }
};

// Delete class
const deleteClass = async (classId, className) => {
    const confirmed = confirm(`⚠️ WARNING: Are you sure you want to permanently delete "${className}"?\n\nThis will delete:\n- All activities\n- All submissions\n- All member enrollments\n\nThis action CANNOT be undone!`);
    if (!confirmed) return;
    
    const doubleConfirm = prompt(`Type "${className}" to confirm deletion:`);
    if (doubleConfirm !== className) {
        showToast('Deletion cancelled - name did not match', 'info');
        return;
    }
    
    const result = await handleAPICall(
        () => classAPI.delete(classId),
        'Failed to delete class'
    );
    
    if (result) {
        showToast(`"${className}" has been permanently deleted`, 'success');
        await loadUserClasses(); // Refresh classes list
    }
};

// Show archived classes
const showArchivedClasses = async () => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show archived classes page
    document.getElementById('archived-classes-page').style.display = 'block';
    
    // Load archived classes
    await loadArchivedClasses();
};

// Load archived classes
const loadArchivedClasses = async () => {
    const result = await handleAPICall(
        () => classAPI.getArchived(),
        'Failed to load archived classes'
    );
    
    if (result) {
        allArchivedClasses = result.classes;
        renderArchivedClasses(result.classes);
    }
};

// Render archived classes
const renderArchivedClasses = (classes) => {
    const container = document.getElementById('archived-classes-grid');
    const currentUser = getCurrentUser();
    const currentUserId = currentUser ? currentUser.user_id : null;
    
    if (!classes || classes.length === 0) {
        container.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-archive" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 20px;"></i>
                <h3>No Archived Classes</h3>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">
                    You haven't archived any classes yet.
                </p>
                <button class="btn btn-secondary" onclick="showClasses()">
                    <i class="fas fa-arrow-left"></i> Back to Active Classes
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = classes.map(classItem => {
        const isTeacherArchived = classItem.class_status === 'Archived';
        const isPersonalArchive = classItem.personal_archive === 1 || classItem.personal_archive === true;
        const isRoomOwner = currentUserId && classItem.created_by === currentUserId;
        
        // Only room owner can restore teacher-archived classes
        const canRestoreGlobal = isRoomOwner && isTeacherArchived;
        // Students can restore their personal archives (but not teacher-archived)
        const canRestorePersonal = classItem.role === 'Student' && isPersonalArchive && !isTeacherArchived;
        
        return `
        <div class="class-card archived-card">
            <div class="class-card-header">
                <h3>${escapeHtml(classItem.class_name)}</h3>
                <span class="archive-badge ${isTeacherArchived ? 'badge-teacher-archived' : 'badge-personal-archived'}">
                    <i class="fas fa-archive"></i> 
                    ${isTeacherArchived ? 'Archived by Teacher' : 'Personally Archived'}
                </span>
            </div>
            <div class="class-code">Code: ${classItem.class_code}</div>
            ${classItem.subject ? `<p class="class-subject"><i class="fas fa-book"></i> ${escapeHtml(classItem.subject)}</p>` : ''}
            ${classItem.section ? `<p class="class-section"><i class="fas fa-users"></i> Section ${escapeHtml(classItem.section)}</p>` : ''}
            ${classItem.description ? `<p class="class-description">${escapeHtml(classItem.description)}</p>` : ''}
            
            ${isTeacherArchived && classItem.role === 'Student' ? `
                <div class="info-banner read-only-banner">
                    <i class="fas fa-lock"></i> <strong>Read-Only Mode</strong> - You can view materials but cannot submit new work
                </div>
            ` : ''}
            
            ${isTeacherArchived && !isRoomOwner && classItem.role === 'Teacher' ? `
                <div class="info-banner owner-only-banner">
                    <i class="fas fa-info-circle"></i> Only the room owner can restore this class
                </div>
            ` : ''}
            
            <div class="class-meta">
                <div>
                    <span class="role-badge role-${classItem.role.toLowerCase()}">
                        ${classItem.role}
                    </span>
                    ${isRoomOwner ? '<span class="owner-badge"><i class="fas fa-crown"></i> Owner</span>' : ''}
                </div>
                <div>
                    <small><i class="fas fa-tasks"></i> ${classItem.total_activities} activities</small><br>
                    <small><i class="fas fa-users"></i> ${classItem.total_members} members</small>
                </div>
            </div>
            <div class="class-meta">
                <small>Created by: ${escapeHtml(classItem.created_by_name)}</small>
                <small>Archived: ${formatDate(classItem.enrolled_at)}</small>
            </div>
            
            <div class="class-actions" style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                ${canRestoreGlobal ? `
                    <button class="btn btn-primary btn-sm" onclick="unarchiveClass(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                ` : ''}
                
                ${canRestorePersonal ? `
                    <button class="btn btn-primary btn-sm" onclick="unarchiveClassPersonal(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                ` : ''}
                
                ${classItem.role === 'Student' ? `
                    <button class="btn btn-secondary btn-sm" onclick="leaveClass(${classItem.class_id}, '${escapeHtml(classItem.class_name)}')">
                        <i class="fas fa-sign-out-alt"></i> Leave Class
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    }).join('');
};

// Filter archived classes
let allArchivedClasses = [];

const filterArchivedClasses = () => {
    const searchTerm = document.getElementById('archived-search').value.toLowerCase();
    
    if (!searchTerm) {
        renderArchivedClasses(allArchivedClasses);
        return;
    }
    
    const filtered = allArchivedClasses.filter(classItem => {
        const name = classItem.class_name.toLowerCase();
        const subject = (classItem.subject || '').toLowerCase();
        const section = (classItem.section || '').toLowerCase();
        const description = (classItem.description || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               subject.includes(searchTerm) || 
               section.includes(searchTerm) ||
               description.includes(searchTerm);
    });
    
    renderArchivedClasses(filtered);
};

// Archive class personally (Student)
const archiveClassPersonal = async (classId, className) => {
    const confirmed = confirm(`Archive "${className}"? You can restore it later from Archived Rooms.`);
    if (!confirmed) return;
    
    const result = await handleAPICall(
        () => classAPI.archivePersonal(classId),
        'Failed to archive class'
    );
    
    if (result) {
        showToast(`"${className}" has been archived`, 'success');
        await loadUserClasses(); // Refresh classes list
    }
};

// Unarchive class personally (Student)
const unarchiveClassPersonal = async (classId, className) => {
    const result = await handleAPICall(
        () => classAPI.unarchivePersonal(classId),
        'Failed to unarchive class'
    );
    
    if (result) {
        showToast(`"${className}" has been restored`, 'success');
        showClasses(); // Redirect to active classes
    }
};

// Leave class (Student)
const leaveClass = async (classId, className) => {
    const confirmed = confirm(`Are you sure you want to leave "${className}"?\n\nYou will need to rejoin using the class code if you change your mind.`);
    if (!confirmed) return;
    
    const result = await handleAPICall(
        () => classAPI.leave(classId),
        'Failed to leave class'
    );
    
    if (result) {
        showToast(`You have left "${className}"`, 'success');
        await loadUserClasses(); // Refresh classes list
    }
};

// Unarchive class
const unarchiveClass = async (classId, className) => {
    const result = await handleAPICall(
        () => classAPI.unarchive(classId),
        'Failed to unarchive class'
    );
    
    if (result) {
        showToast(`"${className}" has been restored`, 'success');
        showClasses(); // Redirect to active classes
    }
};

// Update member role
const updateMemberRole = async (userId, newRole) => {
    if (!currentClassId) return;
    
    const confirmed = confirm(`Are you sure you want to change this member's role to ${newRole}?`);
    if (!confirmed) return;
    
    const result = await handleAPICall(
        () => classAPI.updateMemberRole(currentClassId, userId, newRole),
        'Failed to update member role'
    );
    
    if (result) {
        showToast('Member role updated successfully!', 'success');
        await loadClassDetails(currentClassId); // Refresh class details
    }
};

// View activity details (placeholder)
const viewActivityDetails = async (activityId) => {
    try {
        showLoading();
        
        // Store current activity ID globally for grading
        window.currentActivityId = activityId;
        
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show activity details page
        document.getElementById('activity-details-page').style.display = 'block';
        
        // Fetch activity details
        const response = await fetch(`/api/activities/${activityId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load activity details');
        }
        
        // Render activity details
        renderActivityDetails(data);
        
    } catch (error) {
        console.error('View activity details error:', error);
        showToast(error.message || 'Failed to load activity details', 'error');
        backToClass();
    } finally {
        hideLoading();
    }
};

// Render activity details
const renderActivityDetails = (data) => {
    const { activity, user_submission, all_submissions, user_role, is_archived, can_submit } = data;
    
    // Update page title
    document.getElementById('activity-details-title').textContent = activity.title;
    
    // Render main activity content
    const mainContent = document.getElementById('activity-main-content');
    mainContent.innerHTML = `
        <div class="activity-header">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h2>${escapeHtml(activity.title)}</h2>
                    <div class="activity-meta">
                        <span><i class="fas fa-user"></i> ${escapeHtml(activity.created_by_name)}</span>
                        <span><i class="fas fa-calendar"></i> Created: ${formatDate(activity.created_at)}</span>
                        ${activity.deadline ? `<span class="deadline ${new Date(activity.deadline) < new Date() ? 'overdue' : ''}">
                            <i class="fas fa-clock"></i> Due: ${formatDate(activity.deadline)}
                        </span>` : ''}
                    </div>
                </div>
                ${user_role === 'Teacher' && !is_archived ? `
                    <button class="btn btn-secondary btn-sm" onclick="showEditActivityPage(${activity.activity_id})" title="Edit Activity">
                        <i class="fas fa-pencil-alt"></i> Edit
                    </button>
                ` : ''}
            </div>
            ${is_archived ? `
                <div class="archive-notice">
                    <i class="fas fa-archive"></i> This class is archived (Read-Only Mode)
                </div>
            ` : ''}
        </div>
        
        <div class="activity-body">
            <h3>Instructions</h3>
            ${activity.description ? `
                <div class="activity-description">${escapeHtml(activity.description).replace(/\n/g, '<br>')}</div>
            ` : `
                <p class="empty-state"><i class="fas fa-info-circle"></i> No instructions provided by the teacher.</p>
            `}
            
            ${activity.attachments && activity.attachments.length > 0 ? `
                <div class="activity-attachments">
                    <h3><i class="fas fa-paperclip"></i> Attachments (${activity.attachments.length})</h3>
                    <div class="attachments-list">
                        ${activity.attachments.map(file => {
                            const fileExtension = file.original_name.split('.').pop().toLowerCase();
                            const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
                            
                            return `
                                <div class="attachment-item">
                                    <i class="fas fa-file"></i>
                                    <span class="attachment-name">${escapeHtml(file.original_name)}</span>
                                    <div class="attachment-actions">
                                        <button type="button" class="btn btn-sm btn-primary" onclick="viewFile('${file.download_url}', '${escapeHtml(file.original_name)}')">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                        <a href="${file.download_url}" class="btn btn-sm btn-secondary" download onclick="event.preventDefault(); downloadFileAuthenticated('${file.download_url}', '${escapeHtml(file.original_name)}')">
                                            <i class="fas fa-cloud-download-alt"></i> Download
                                        </a>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${user_role === 'Teacher' && activity.teacher_notes ? `
                <div class="teacher-notes-section">
                    <h3><i class="fas fa-sticky-note"></i> Teacher's Private Notes</h3>
                    <div class="teacher-notes">${escapeHtml(activity.teacher_notes).replace(/\n/g, '<br>')}</div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Render submission section
    const submissionSection = document.getElementById('activity-submission');
    
    if (user_role === 'Student') {
        submissionSection.innerHTML = `
            <div class="submission-card">
                <h3>Your Submission</h3>
                
                ${user_submission ? `
                    <div class="submission-status submitted">
                        <i class="fas fa-check-circle"></i> Submitted on ${formatDate(user_submission.submission_date)}
                    </div>
                    
                    ${!user_submission.content && !user_submission.file ? `
                        <div class="submission-empty-notice">
                            <i class="fas fa-hand-paper"></i> <strong>Turned in (No attachment)</strong>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px;">
                                You submitted this activity without digital content. This is useful for hardcopy/physical work.
                            </p>
                        </div>
                    ` : ''}
                    
                    ${user_submission.content ? `
                        <div class="submission-content">
                            <strong>Your Work:</strong>
                            <p>${escapeHtml(user_submission.content)}</p>
                        </div>
                    ` : ''}
                    
                    ${user_submission.file ? `
                        <div class="submission-file">
                            <strong>Attached File:</strong>
                            <div class="attachment-item">
                                <i class="fas fa-file"></i>
                                <span class="attachment-name">${escapeHtml(user_submission.file.original_name)}</span>
                                <div class="attachment-actions">
                                    <button type="button" class="btn btn-sm btn-primary" onclick="viewFile('${user_submission.file.download_url}', '${escapeHtml(user_submission.file.original_name)}')">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                    <a href="${user_submission.file.download_url}" class="btn btn-sm btn-secondary" download onclick="event.preventDefault(); downloadFileAuthenticated('${user_submission.file.download_url}', '${escapeHtml(user_submission.file.original_name)}')">
                                        <i class="fas fa-cloud-download-alt"></i> Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${user_submission.score !== null ? `
                        <div class="submission-grade">
                            <strong>Grade:</strong> ${formatScore(user_submission.score)}
                            ${user_submission.feedback ? `
                                <div class="feedback">
                                    <strong>Feedback:</strong>
                                    <p>${escapeHtml(user_submission.feedback)}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="submission-locked-notice">
                            <i class="fas fa-lock"></i> Submission locked because grading has started.
                        </div>
                    ` : `
                        <div class="submission-pending">
                            <i class="fas fa-hourglass-half"></i> Waiting for teacher to grade
                        </div>
                        ${can_submit && !is_archived ? `
                            <button class="btn btn-warning" onclick="unsubmitActivity(${activity.activity_id})">
                                <i class="fas fa-undo"></i> Unsubmit
                            </button>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 10px;">
                                <i class="fas fa-info-circle"></i> Click "Unsubmit" to modify your work before grading
                            </p>
                        ` : !activity.is_accepting_submissions ? `
                            <div class="submission-closed-notice">
                                <i class="fas fa-ban"></i> Submissions for this activity are currently closed by the teacher.
                            </div>
                        ` : ''}
                    `}
                ` : `
                    ${can_submit ? `
                        <div class="submission-form">
                            <div class="form-group">
                                <label for="submission-content">Your Work (Optional)</label>
                                <textarea id="submission-content" rows="6" placeholder="Enter your work here or leave empty for hardcopy/physical work..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="submission-file">
                                    <i class="fas fa-paperclip"></i> Attach File (Optional)
                                    <small style="display: block; color: var(--text-secondary); margin-top: 5px;">
                                        Supported: .docx, .pdf, .pptx, .jpg, .png (Max 20MB)
                                    </small>
                                </label>
                                <input type="file" id="submission-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt" onchange="validateSubmissionFile()">
                                <div id="file-preview" style="margin-top: 10px;"></div>
                            </div>
                            
                            <button class="btn btn-primary" id="submit-btn" onclick="submitActivity(${activity.activity_id})">
                                <i class="fas fa-paper-plane"></i> Turn In
                            </button>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 10px;">
                                <i class="fas fa-info-circle"></i> You can submit without content for hardcopy/physical work
                            </p>
                        </div>
                    ` : !activity.is_accepting_submissions ? `
                        <div class="submission-closed-notice">
                            <i class="fas fa-ban"></i> Submissions for this activity are currently closed by the teacher.
                        </div>
                    ` : is_archived ? `
                        <div class="submission-blocked">
                            <i class="fas fa-lock"></i> Submissions are not allowed in archived classes
                        </div>
                    ` : ''}
                `}
            </div>
        `;
    } else if (user_role === 'Teacher') {
        submissionSection.innerHTML = `
            <div class="submissions-overview">
                <h3>Student Submissions (${all_submissions.length})</h3>
                
                ${all_submissions.length > 0 ? `
                    <!-- Student Search Bar -->
                    <div class="student-search-container">
                        <div class="search-input-wrapper">
                            <i class="fas fa-search search-icon-inline"></i>
                            <input type="text" 
                                   id="student-search-input" 
                                   class="student-search-input" 
                                   placeholder="Search student name..."
                                   oninput="filterStudentSubmissions()">
                            <button type="button" 
                                    class="clear-search-btn" 
                                    id="clear-search-btn" 
                                    onclick="clearStudentSearch()"
                                    style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="search-results-count" id="search-results-count"></div>
                        
                        <!-- Grading Status Filter Tabs -->
                        <div class="grading-filter-tabs">
                            <button class="grading-filter-tab active" data-filter="all" onclick="filterByGradingStatus('all')">
                                <i class="fas fa-list"></i> All
                                <span class="filter-count">${all_submissions.length}</span>
                            </button>
                            <button class="grading-filter-tab" data-filter="ungraded" onclick="filterByGradingStatus('ungraded')">
                                <i class="fas fa-clock"></i> Ungraded
                                <span class="filter-count">${all_submissions.filter(s => s.submission_date && s.score === null).length}</span>
                            </button>
                            <button class="grading-filter-tab" data-filter="graded" onclick="filterByGradingStatus('graded')">
                                <i class="fas fa-check-double"></i> Graded
                                <span class="filter-count">${all_submissions.filter(s => s.score !== null).length}</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="submissions-list" id="submissions-list">
                        ${all_submissions.map(sub => {
                            // Determine grading status
                            const isGraded = sub.score !== null;
                            const hasSubmitted = sub.submission_date !== null;
                            
                            return `
                            <div class="submission-item accordion-item" 
                                 data-student-name="${escapeHtml(sub.student_name).toLowerCase()}" 
                                 data-student-id="${sub.student_id}"
                                 data-grading-status="${hasSubmitted ? (isGraded ? 'graded' : 'ungraded') : 'not-submitted'}"
                                 data-submission-id="${sub.submission_id || ''}">
                                <div class="submission-header accordion-header" onclick="toggleSubmissionAccordion(${sub.submission_id || 0}, '${sub.student_id}')">
                                    <div class="submission-header-left">
                                        <strong>${escapeHtml(sub.student_name)}</strong>
                                        ${sub.submission_date ? `
                                            <span class="submission-date">${formatDate(sub.submission_date)}</span>
                                        ` : `
                                            <span class="status-badge status-not-submitted">Not Submitted</span>
                                        `}
                                    </div>
                                    <div class="submission-header-right">
                                        <div class="status-badges-group">
                                            ${sub.submission_date ? `
                                                <span class="status-badge status-submitted">
                                                    <i class="fas fa-check-circle"></i> Submitted
                                                </span>
                                                ${isGraded ? `
                                                    <span class="status-badge status-graded">
                                                        <i class="fas fa-star"></i> Graded
                                                    </span>
                                                ` : `
                                                    <span class="status-badge status-ungraded">
                                                        <i class="fas fa-clock"></i> Ungraded
                                                    </span>
                                                `}
                                            ` : ''}
                                        </div>
                                        ${sub.file ? `
                                            <button type="button" class="btn btn-sm btn-primary view-submission-btn" 
                                                    onclick="event.stopPropagation(); viewFile('${sub.file.download_url}', '${escapeHtml(sub.file.original_name)}')"
                                                    title="View Submission">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                        ` : ''}
                                        <button type="button" class="accordion-toggle-btn" title="Expand/Collapse">
                                            <i class="fas fa-chevron-down"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="submission-body accordion-body">
                                    ${sub.content ? `
                                        <div class="submission-content">
                                            <strong>Text Content:</strong>
                                            <p>${escapeHtml(sub.content)}</p>
                                        </div>
                                    ` : ''}
                                    ${sub.file ? `
                                        <div class="submission-file">
                                            <strong>Attached File:</strong>
                                            <div class="attachment-item">
                                                <i class="fas fa-file"></i>
                                                <span class="attachment-name">${escapeHtml(sub.file.original_name)}</span>
                                                <div class="attachment-actions">
                                                    <button type="button" class="btn btn-sm btn-primary" onclick="viewFile('${sub.file.download_url}', '${escapeHtml(sub.file.original_name)}')">
                                                        <i class="fas fa-eye"></i> View
                                                    </button>
                                                    <a href="${sub.file.download_url}" class="btn btn-sm btn-secondary" download onclick="event.preventDefault(); downloadFileAuthenticated('${sub.file.download_url}', '${escapeHtml(sub.file.original_name)}')">
                                                        <i class="fas fa-cloud-download-alt"></i> Download
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${sub.submission_date ? `
                                        <div class="inline-grading-section">
                                            <div class="inline-grade-input-group">
                                                <label for="score-${sub.submission_id}">Score:</label>
                                                <input type="number" 
                                                       id="score-${sub.submission_id}" 
                                                       class="inline-score-input" 
                                                       min="0" 
                                                       max="${activity.max_score || 100}" 
                                                       step="0.01" 
                                                       value="${sub.score !== null ? sub.score : ''}"
                                                       placeholder="0"
                                                       onchange="saveInlineGrade(${sub.submission_id}, ${activity.activity_id})">
                                                <span class="max-score-label">/ ${activity.max_score || 100}</span>
                                                <button type="button" 
                                                        class="btn-icon-inline btn-save-grade" 
                                                        onclick="saveInlineGrade(${sub.submission_id}, ${activity.activity_id})"
                                                        title="Save Grade">
                                                    <i class="fas fa-check"></i>
                                                </button>
                                            </div>
                                            <div class="inline-feedback-group">
                                                <label for="feedback-${sub.submission_id}">Feedback (Optional):</label>
                                                <textarea id="feedback-${sub.submission_id}" 
                                                          class="inline-feedback-input" 
                                                          rows="2" 
                                                          placeholder="Provide feedback to the student...">${sub.feedback || ''}</textarea>
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                    
                    <!-- Empty State for No Search Results -->
                    <div class="no-search-results" id="no-search-results" style="display: none;">
                        <i class="fas fa-search"></i>
                        <h4>No student found</h4>
                        <p>No student matches "<span id="search-term-display"></span>"</p>
                        <button class="btn btn-secondary btn-sm" onclick="clearStudentSearch()">
                            <i class="fas fa-times"></i> Clear Search
                        </button>
                    </div>
                    
                    <!-- Empty State for No Filter Results -->
                    <div class="no-filter-results" id="no-filter-results" style="display: none;">
                        <i class="fas fa-filter"></i>
                        <h4>No submissions in this category</h4>
                        <p id="filter-message"></p>
                        <button class="btn btn-secondary btn-sm" onclick="filterByGradingStatus('all')">
                            <i class="fas fa-list"></i> Show All
                        </button>
                    </div>
                ` : `
                    <p class="empty-state"><i class="fas fa-inbox"></i> No submissions yet</p>
                `}
            </div>
        `;
    }
};

// Submit activity work
const submitActivity = async (activityId) => {
    const content = document.getElementById('submission-content').value.trim();
    const fileInput = document.getElementById('submission-file');
    const file = fileInput?.files[0];
    
    // Allow empty submissions for hardcopy/physical work
    const confirmMessage = (!content && !file) 
        ? 'You are submitting without any file or text. This is useful for hardcopy/physical work. Continue?'
        : 'Are you sure you want to submit this work?';
    
    const confirmed = confirm(confirmMessage);
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
        
        // Refresh dashboard data to update submission counters
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
        
        // Reload class activities to update the tab counts and status
        if (window.currentClassId) {
            loadClassActivities(window.currentClassId);
        }
        
    } catch (error) {
        console.error('Submit activity error:', error);
        showToast(error.message || 'Failed to submit work', 'error');
    } finally {
        hideLoading();
    }
};

// Validate submission file and enable/disable submit button
const validateSubmissionFile = () => {
    const fileInput = document.getElementById('submission-file');
    const contentInput = document.getElementById('submission-content');
    const submitBtn = document.getElementById('submit-btn');
    const filePreview = document.getElementById('file-preview');
    
    const file = fileInput?.files[0];
    const content = contentInput?.value.trim();
    
    // Always enable submit button (allow empty submissions for hardcopy work)
    if (submitBtn) {
        submitBtn.disabled = false;
    }
    
    // Show file preview
    if (file && filePreview) {
        const fileSize = (file.size / (1024 * 1024)).toFixed(2); // Convert to MB
        const maxSize = 20; // 20MB
        
        if (file.size > maxSize * 1024 * 1024) {
            filePreview.innerHTML = `
                <div style="color: var(--error-color); padding: 10px; background: rgba(220, 53, 69, 0.1); border-radius: 4px;">
                    <i class="fas fa-exclamation-triangle"></i> File too large! Maximum size is ${maxSize}MB. Your file is ${fileSize}MB.
                </div>
            `;
            submitBtn.disabled = true;
            return;
        }
        
        filePreview.innerHTML = `
            <div style="padding: 10px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 4px;">
                <i class="fas fa-file"></i> <strong>${escapeHtml(file.name)}</strong> (${fileSize} MB)
                <button type="button" onclick="clearSubmissionFile()" style="float: right; background: none; border: none; color: var(--error-color); cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    } else if (filePreview) {
        filePreview.innerHTML = '';
    }
};

// Clear selected file
const clearSubmissionFile = () => {
    const fileInput = document.getElementById('submission-file');
    if (fileInput) {
        fileInput.value = '';
        validateSubmissionFile();
    }
};

// Enable submit button when content is typed
if (document.getElementById('submission-content')) {
    document.getElementById('submission-content').addEventListener('input', validateSubmissionFile);
}

// Back to class from activity details
const backToClass = () => {
    if (currentClassId) {
        showClassDetails(currentClassId);
    } else {
        showClasses();
    }
};

// Show create activity modal
const showCreateActivityModal = () => {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('create-activity-modal').style.display = 'block';
};

// Handle create activity with file upload
const handleCreateActivity = async (event) => {
    event.preventDefault();
    
    if (!currentClassId) {
        showToast('No class selected', 'error');
        return;
    }
    
    const title = document.getElementById('activity-title').value.trim();
    const description = document.getElementById('activity-description').value.trim();
    const deadline = document.getElementById('activity-deadline').value;
    const teacherNotes = document.getElementById('teacher-notes').value.trim();
    const acceptingSubmissions = document.getElementById('activity-accepting-submissions').checked;
    const files = document.getElementById('activity-files').files;
    
    if (!title) {
        showToast('Activity title is required', 'error');
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('deadline', deadline);
    formData.append('teacher_notes', teacherNotes);
    formData.append('is_accepting_submissions', acceptingSubmissions);
    
    // Add files to FormData
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        showLoading();
        const response = await fetch(`/api/activities/class/${currentClassId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to create activity');
        }
        
        showToast('Activity created successfully!', 'success');
        closeModal();
        await loadClassActivities(currentClassId); // Refresh activities
        
    } catch (error) {
        console.error('Create activity error:', error);
        showToast(error.message || 'Failed to create activity', 'error');
    } finally {
        hideLoading();
    }
};

// Kick member function with reason
const kickMember = async (userId, userName) => {
    if (!currentClassId) return;
    
    const confirmed = confirm(`Are you sure you want to kick ${userName} from this class? They will need to request to rejoin.`);
    if (!confirmed) return;
    
    const reason = prompt('Reason for kicking (this will be shown to the student):') || 'No reason provided';
    
    try {
        showLoading();
        const response = await fetch(`/api/members/classes/${currentClassId}/kick`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ userId, reason })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to kick member');
        }
        
        showToast(`${userName} has been kicked from the class`, 'success');
        await loadClassDetails(currentClassId); // Refresh class details
        
    } catch (error) {
        console.error('Kick member error:', error);
        showToast(error.message || 'Failed to kick member', 'error');
    } finally {
        hideLoading();
    }
};


// Show edit activity modal
let currentEditActivityId = null;
let currentEditActivityData = null;
let filesToRemove = []; // Track files marked for removal

const showEditActivityModal = async (activityId) => {
    currentEditActivityId = activityId;
    filesToRemove = []; // Reset removal list
    
    try {
        showLoading();
        
        // Fetch current activity data
        const response = await fetch(`/api/activities/${activityId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load activity');
        }
        
        currentEditActivityData = data.activity;
        
        // Pre-fill the form
        document.getElementById('edit-activity-title').value = data.activity.title || '';
        document.getElementById('edit-activity-description').value = data.activity.description || '';
        document.getElementById('edit-teacher-notes').value = data.activity.teacher_notes || '';
        
        // Format deadline for datetime-local input
        if (data.activity.deadline) {
            const deadline = new Date(data.activity.deadline);
            const formattedDeadline = deadline.toISOString().slice(0, 16);
            document.getElementById('edit-activity-deadline').value = formattedDeadline;
        } else {
            document.getElementById('edit-activity-deadline').value = '';
        }
        
        // Set submission toggle state - ensure boolean comparison
        const isAccepting = data.activity.is_accepting_submissions === true || data.activity.is_accepting_submissions === 1;
        document.getElementById('edit-activity-accepting-submissions').checked = isAccepting;
        
        // Show existing attachments with remove buttons
        const existingFiles = document.getElementById('edit-existing-files');
        if (data.activity.attachments && data.activity.attachments.length > 0) {
            existingFiles.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <strong>Current Attachments:</strong>
                    <div id="attachment-list" style="margin-top: 10px;">
                        ${data.activity.attachments.map(file => `
                            <div class="attachment-item" data-filename="${escapeHtml(file.filename)}" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-file"></i>
                                    <span>${escapeHtml(file.original_name)}</span>
                                </div>
                                <button type="button" class="remove-file-btn" data-filename="${escapeHtml(file.filename)}" 
                                    style="background: var(--error-color); color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">
                                    <i class="fas fa-trash"></i> Remove
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 10px;">
                        <i class="fas fa-info-circle"></i> Click "Remove" to delete files, or add new files below
                    </p>
                </div>
            `;
            
            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-file-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const filename = e.currentTarget.dataset.filename;
                    removeAttachment(filename);
                });
            });
        } else {
            existingFiles.innerHTML = '<p style="color: var(--text-secondary);">No attachments yet</p>';
        }
        
        // Show modal
        document.getElementById('modal-overlay').style.display = 'block';
        document.getElementById('edit-activity-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Load activity error:', error);
        showToast(error.message || 'Failed to load activity', 'error');
    } finally {
        hideLoading();
    }
};

// Remove attachment from UI and mark for deletion
const removeAttachment = (filename) => {
    // Add to removal list
    if (!filesToRemove.includes(filename)) {
        filesToRemove.push(filename);
    }
    
    // Remove from UI
    const attachmentItem = document.querySelector(`.attachment-item[data-filename="${filename}"]`);
    if (attachmentItem) {
        attachmentItem.style.opacity = '0.5';
        attachmentItem.style.textDecoration = 'line-through';
        const removeBtn = attachmentItem.querySelector('.remove-file-btn');
        if (removeBtn) {
            removeBtn.textContent = 'Marked for removal';
            removeBtn.disabled = true;
            removeBtn.style.background = 'var(--text-secondary)';
            removeBtn.style.cursor = 'not-allowed';
        }
    }
    
    showToast('File marked for removal. Click "Save Changes" to confirm.', 'info');
};

// Handle edit activity submission
const handleEditActivity = async (event) => {
    event.preventDefault();
    
    if (!currentEditActivityId) {
        showToast('No activity selected', 'error');
        return;
    }
    
    const title = document.getElementById('edit-activity-title').value.trim();
    const description = document.getElementById('edit-activity-description').value.trim();
    const deadline = document.getElementById('edit-activity-deadline').value;
    const teacherNotes = document.getElementById('edit-teacher-notes').value.trim();
    const acceptingSubmissions = document.getElementById('edit-activity-accepting-submissions').checked;
    const files = document.getElementById('edit-activity-files').files;
    
    if (!title) {
        showToast('Activity title is required', 'error');
        return;
    }
    
    // Check if anything changed - compare boolean values properly
    const currentAccepting = currentEditActivityData.is_accepting_submissions === true || currentEditActivityData.is_accepting_submissions === 1;
    const hasChanges = 
        title !== currentEditActivityData.title ||
        description !== (currentEditActivityData.description || '') ||
        teacherNotes !== (currentEditActivityData.teacher_notes || '') ||
        deadline !== (currentEditActivityData.deadline ? new Date(currentEditActivityData.deadline).toISOString().slice(0, 16) : '') ||
        acceptingSubmissions !== currentAccepting ||
        files.length > 0 ||
        filesToRemove.length > 0;
    
    if (!hasChanges) {
        showToast('No changes detected', 'info');
        closeModal();
        return;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('deadline', deadline);
    formData.append('teacher_notes', teacherNotes);
    
    // Send boolean value directly (FormData will convert to string)
    formData.append('is_accepting_submissions', acceptingSubmissions);
    
    // Add files to remove
    if (filesToRemove.length > 0) {
        formData.append('removed_files', filesToRemove.join(','));
    }
    
    // Add new files to FormData
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        showLoading();
        const response = await fetch(`/api/activities/${currentEditActivityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update activity');
        }
        
        let successMessage = 'Activity updated successfully!';
        if (result.files_added > 0) {
            successMessage += ` (${result.files_added} file(s) added)`;
        }
        if (result.files_removed > 0) {
            successMessage += ` (${result.files_removed} file(s) removed)`;
        }
        
        showToast(successMessage, 'success');
        
        if (result.notifications_sent) {
            showToast('Students have been notified of the changes', 'info');
        }
        
        // Reset removal list
        filesToRemove = [];
        
        // Close modal and refresh
        closeModal();
        
        // Refresh activity details if viewing
        if (window.location.hash.includes('activity')) {
            const activityId = window.location.hash.split('/')[2];
            if (activityId) {
                showActivityDetails(activityId);
            }
        } else {
            // Refresh class activities list
            const classId = window.location.hash.split('/')[1];
            if (classId) {
                showClassDetails(classId);
            }
        }
        
    } catch (error) {
        console.error('Update activity error:', error);
        showToast(error.message || 'Failed to update activity', 'error');
    } finally {
        hideLoading();
    }
};


// Unsubmit activity work (revert to draft mode)
const unsubmitActivity = async (activityId) => {
    const confirmed = confirm('Are you sure you want to unsubmit this work? This will allow you to modify your submission, but the teacher will see it as "Not Submitted" until you turn it in again.');
    if (!confirmed) return;
    
    try {
        showLoading();
        const response = await fetch(`/api/activities/${activityId}/unsubmit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to unsubmit work');
        }
        
        showToast('Submission reverted to draft. You can now modify your work.', 'success');
        
        // Reload activity details to show submission form
        viewActivityDetails(activityId);
        
        // Refresh dashboard data to update submission counters
        if (typeof refreshDashboard === 'function') {
            refreshDashboard();
        }
        
        // Reload class activities to update the tab counts and status
        if (window.currentClassId) {
            loadClassActivities(window.currentClassId);
        }
        
    } catch (error) {
        console.error('Unsubmit activity error:', error);
        showToast(error.message || 'Failed to unsubmit work', 'error');
    } finally {
        hideLoading();
    }
};


// ============================================================================
// DEDICATED EDIT ACTIVITY PAGE
// ============================================================================

let editPageActivityId = null;
let editPageActivityData = null;
let editPageFilesToRemove = [];
let editPageReturnPath = null;

// Navigate to edit activity page
const navigateToEditActivity = async (activityId, returnPath = null) => {
    editPageActivityId = activityId;
    editPageFilesToRemove = [];
    editPageReturnPath = returnPath;
    
    try {
        showLoading();
        
        // Hide all other pages
        document.querySelectorAll('.page-content').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show edit page
        document.getElementById('edit-activity-page').style.display = 'block';
        
        // Fetch activity data
        const response = await fetch(`/api/activities/${activityId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to load activity');
        }
        
        editPageActivityData = data.activity;
        
        // Populate form
        populateEditActivityForm(data.activity);
        
        // Update status badge
        updateSubmissionStatusBadge(data.activity);
        
    } catch (error) {
        console.error('Load activity error:', error);
        showToast(error.message || 'Failed to load activity', 'error');
        cancelEditActivity();
    } finally {
        hideLoading();
    }
};

// Populate the edit form with activity data
const populateEditActivityForm = (activity) => {
    // Basic information
    document.getElementById('edit-page-title').value = activity.title || '';
    document.getElementById('edit-page-description').value = activity.description || '';
    document.getElementById('edit-page-teacher-notes').value = activity.teacher_notes || '';
    document.getElementById('edit-page-max-score').value = activity.max_score || 100;
    
    // Deadline
    if (activity.deadline) {
        const deadline = new Date(activity.deadline);
        document.getElementById('edit-page-deadline').value = deadline.toISOString().slice(0, 16);
    } else {
        document.getElementById('edit-page-deadline').value = '';
    }
    
    // Submission toggle - proper boolean conversion
    const isAccepting = activity.is_accepting_submissions === true || 
                       activity.is_accepting_submissions === 1;
    document.getElementById('edit-page-accepting-submissions').checked = isAccepting;
    
    // Render attachments
    renderEditPageAttachments(activity.attachments || []);
};

// Update submission status badge
const updateSubmissionStatusBadge = (activity) => {
    const statusCard = document.getElementById('submission-status-card');
    const statusIndicator = statusCard.querySelector('.status-indicator');
    const statusText = document.getElementById('status-text');
    const statusDescription = document.getElementById('status-description');
    
    const isAccepting = activity.is_accepting_submissions === true || 
                       activity.is_accepting_submissions === 1;
    const deadline = activity.deadline ? new Date(activity.deadline) : null;
    const isOverdue = deadline && new Date() > deadline;
    
    // Determine status
    let status, description, className;
    
    if (!isAccepting) {
        status = 'Submissions Closed';
        description = 'Students cannot submit or unsubmit work';
        className = 'status-closed';
    } else if (isOverdue) {
        status = 'Submissions Open (Past Deadline)';
        description = 'Students can still submit, but submissions will be marked as late';
        className = 'status-open';
    } else if (deadline) {
        status = 'Submissions Open';
        description = `Deadline: ${deadline.toLocaleString()}`;
        className = 'status-open';
    } else {
        status = 'Submissions Open';
        description = 'No deadline set';
        className = 'status-open';
    }
    
    statusIndicator.className = `status-indicator ${className}`;
    statusText.textContent = status;
    statusDescription.textContent = description;
};

// Render attachments with remove buttons
const renderEditPageAttachments = (attachments) => {
    const container = document.getElementById('edit-page-current-attachments');
    
    if (!attachments || attachments.length === 0) {
        container.innerHTML = `
            <div class="no-attachments">
                <i class="fas fa-folder-open"></i>
                <p>No attachments yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = attachments.map(file => {
        const isMarked = editPageFilesToRemove.includes(file.filename);
        const fileExtension = file.filename.split('.').pop().toLowerCase();
        const iconClass = getFileIcon(fileExtension);
        
        return `
            <div class="attachment-card ${isMarked ? 'marked-for-removal' : ''}" 
                 data-filename="${escapeHtml(file.filename)}">
                <div class="attachment-info">
                    <div class="attachment-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="attachment-details">
                        <div class="attachment-name">${escapeHtml(file.original_name)}</div>
                        <div class="attachment-meta">
                            ${isMarked ? '<i class="fas fa-exclamation-triangle"></i> Marked for removal' : 'Current attachment'}
                        </div>
                    </div>
                </div>
                <div class="attachment-actions">
                    <button type="button" class="btn-icon btn-view" 
                            onclick="viewActivityFile('${escapeHtml(file.filename)}', '${escapeHtml(file.original_name)}')"
                            ${isMarked ? 'disabled' : ''}>
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button type="button" class="btn-icon btn-download" 
                            onclick="downloadActivityFile('${escapeHtml(file.filename)}')"
                            ${isMarked ? 'disabled' : ''}>
                        <i class="fas fa-cloud-download-alt"></i> Download
                    </button>
                    <button type="button" class="btn-icon btn-remove" 
                            onclick="markFileForRemoval('${escapeHtml(file.filename)}')"
                            ${isMarked ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i> ${isMarked ? 'Marked' : 'Remove'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
};

// Get appropriate icon for file type
const getFileIcon = (extension) => {
    const icons = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'txt': 'fas fa-file-alt',
        'zip': 'fas fa-file-archive',
        'rar': 'fas fa-file-archive'
    };
    
    return icons[extension] || 'fas fa-file';
};

// Mark file for removal
const markFileForRemoval = (filename) => {
    if (!editPageFilesToRemove.includes(filename)) {
        editPageFilesToRemove.push(filename);
    }
    
    // Re-render attachments
    renderEditPageAttachments(editPageActivityData.attachments || []);
    
    showToast('File marked for removal. Click "Save Changes" to confirm.', 'info');
};

// View activity file
const viewActivityFile = (filename, originalName) => {
    const fileUrl = `/api/activities/${editPageActivityId}/download/${filename}`;
    viewFile(fileUrl, originalName);
};

// Download activity file
const downloadActivityFile = (filename) => {
    const fileUrl = `/api/activities/${editPageActivityId}/download/${filename}`;
    // Extract original name from editPageActivityData if available
    const file = editPageActivityData?.attachments?.find(f => f.filename === filename);
    const originalName = file ? file.original_name : filename;
    downloadFileAuthenticated(fileUrl, originalName);
};

// Handle edit activity form submission
const handleEditActivityPage = async (event) => {
    event.preventDefault();
    
    if (!editPageActivityId) {
        showToast('No activity selected', 'error');
        return;
    }
    
    const title = document.getElementById('edit-page-title').value.trim();
    const description = document.getElementById('edit-page-description').value.trim();
    const deadline = document.getElementById('edit-page-deadline').value;
    const maxScore = document.getElementById('edit-page-max-score').value;
    const teacherNotes = document.getElementById('edit-page-teacher-notes').value.trim();
    const acceptingSubmissions = document.getElementById('edit-page-accepting-submissions').checked;
    const files = document.getElementById('edit-page-files').files;
    
    if (!title) {
        showToast('Activity title is required', 'error');
        return;
    }
    
    if (!maxScore || maxScore <= 0) {
        showToast('Max score must be greater than 0', 'error');
        return;
    }
    
    // Check if anything changed
    const currentAccepting = editPageActivityData.is_accepting_submissions === true || 
                            editPageActivityData.is_accepting_submissions === 1;
    const hasChanges = 
        title !== editPageActivityData.title ||
        description !== (editPageActivityData.description || '') ||
        teacherNotes !== (editPageActivityData.teacher_notes || '') ||
        maxScore != (editPageActivityData.max_score || 100) ||
        deadline !== (editPageActivityData.deadline ? new Date(editPageActivityData.deadline).toISOString().slice(0, 16) : '') ||
        acceptingSubmissions !== currentAccepting ||
        files.length > 0 ||
        editPageFilesToRemove.length > 0;
    
    if (!hasChanges) {
        showToast('No changes detected', 'info');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('deadline', deadline);
    formData.append('max_score', maxScore);
    formData.append('teacher_notes', teacherNotes);
    formData.append('is_accepting_submissions', acceptingSubmissions);
    
    // Add files to remove
    if (editPageFilesToRemove.length > 0) {
        formData.append('removed_files', editPageFilesToRemove.join(','));
    }
    
    // Add new files
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    
    try {
        showLoading();
        const response = await fetch(`/api/activities/${editPageActivityId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update activity');
        }
        
        let successMessage = 'Activity updated successfully!';
        if (result.files_added > 0) {
            successMessage += ` (${result.files_added} file(s) added)`;
        }
        if (result.files_removed > 0) {
            successMessage += ` (${result.files_removed} file(s) removed)`;
        }
        
        showToast(successMessage, 'success');
        
        if (result.notifications_sent) {
            showToast('Students have been notified of the changes', 'info');
        }
        
        // Reset and navigate back
        editPageFilesToRemove = [];
        
        // Navigate back to where we came from
        if (editPageReturnPath) {
            window.location.hash = editPageReturnPath;
        } else {
            // Default: go back to activity details
            showActivityDetails(editPageActivityId);
        }
        
    } catch (error) {
        console.error('Update activity error:', error);
        showToast(error.message || 'Failed to update activity', 'error');
    } finally {
        hideLoading();
    }
};

// Cancel editing and return
const cancelEditActivity = (event) => {
    // Prevent any default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (editPageReturnPath) {
        window.location.hash = editPageReturnPath;
    } else if (editPageActivityId) {
        showActivityDetails(editPageActivityId);
    } else {
        showClasses();
    }
    
    // Reset state
    editPageActivityId = null;
    editPageActivityData = null;
    editPageFilesToRemove = [];
    editPageReturnPath = null;
};

// Delete activity confirmation
const deleteActivityConfirm = (event) => {
    // Prevent any default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (!editPageActivityId) {
        showToast('No activity selected', 'error');
        return;
    }
    
    // Show confirmation modal
    const modal = document.getElementById('delete-activity-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }
};

// Close delete confirmation modal
const closeDeleteActivityModal = () => {
    const modal = document.getElementById('delete-activity-modal');
    const overlay = document.getElementById('modal-overlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
};

// Confirm and execute activity deletion
const confirmDeleteActivity = async () => {
    if (!editPageActivityId) {
        showToast('No activity selected', 'error');
        closeDeleteActivityModal();
        return;
    }
    
    try {
        showLoading();
        closeDeleteActivityModal();
        
        // Use activityAPI helper (consistent with rest of classes.js)
        const data = await handleAPICall(
            () => activityAPI.delete(editPageActivityId),
            'Failed to delete activity'
        );
        
        if (data) {
            showToast('Activity deleted successfully', 'success');
            
            // Navigate back to class details
            if (editPageActivityData && editPageActivityData.class_id) {
                showClassDetails(editPageActivityData.class_id);
            } else if (editPageReturnPath) {
                window.location.hash = editPageReturnPath;
            } else {
                showClasses();
            }
            
            // Reset state
            editPageActivityId = null;
            editPageActivityData = null;
            editPageFilesToRemove = [];
            editPageReturnPath = null;
        }
        
    } catch (error) {
        console.error('Delete activity error:', error);
        showToast(error.message || 'Failed to delete activity', 'error');
    } finally {
        hideLoading();
    }
};

// Update the existing showEditActivityModal to redirect to the new page
const showEditActivityPage = (activityId) => {
    // Get current location for return path
    const returnPath = window.location.hash;
    navigateToEditActivity(activityId, returnPath);
};


// ============================================================================
// ENHANCED CREATE ACTIVITY WITH FILE MANAGEMENT
// ============================================================================

let selectedFiles = []; // Array to store selected files with metadata

// Initialize file input listener
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('activity-files');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
});

// Handle file selection
const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
        // Check if file already exists
        const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            selectedFiles.push(file);
        }
    });
    
    // Clear the input so the same file can be selected again if removed
    event.target.value = '';
    
    // Render the file queue
    renderFileQueue();
};

// Render file queue
const renderFileQueue = () => {
    const fileQueue = document.getElementById('file-queue');
    
    if (selectedFiles.length === 0) {
        fileQueue.innerHTML = `
            <div class="file-queue-empty">
                <i class="fas fa-folder-open" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px;"></i>
                <p>No files selected yet</p>
            </div>
        `;
        return;
    }
    
    fileQueue.innerHTML = selectedFiles.map((file, index) => {
        const fileSize = formatFileSize(file.size);
        const fileIcon = getFileIconClass(file.name);
        
        return `
            <div class="file-item" data-index="${index}">
                <div class="file-item-info">
                    <div class="file-item-icon">
                        <i class="${fileIcon}"></i>
                    </div>
                    <div class="file-item-details">
                        <div class="file-item-name" title="${escapeHtml(file.name)}">
                            ${escapeHtml(file.name)}
                        </div>
                        <div class="file-item-size">${fileSize}</div>
                    </div>
                </div>
                <button type="button" class="file-item-remove" onclick="removeFileFromQueue(${index})" title="Remove file">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
};

// Remove file from queue
const removeFileFromQueue = (index) => {
    selectedFiles.splice(index, 1);
    renderFileQueue();
    showToast('File removed from queue', 'info');
};

// Format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Get file icon class
const getFileIconClass = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'xls': 'fas fa-file-excel',
        'xlsx': 'fas fa-file-excel',
        'jpg': 'fas fa-file-image',
        'jpeg': 'fas fa-file-image',
        'png': 'fas fa-file-image',
        'gif': 'fas fa-file-image',
        'txt': 'fas fa-file-alt',
        'zip': 'fas fa-file-archive',
        'rar': 'fas fa-file-archive',
        'mp4': 'fas fa-file-video',
        'mov': 'fas fa-file-video',
        'avi': 'fas fa-file-video'
    };
    return iconMap[extension] || 'fas fa-file';
};

// Enhanced create activity handler
const handleCreateActivityEnhanced = async (event) => {
    event.preventDefault();
    
    const title = document.getElementById('activity-title').value.trim();
    const description = document.getElementById('activity-description').value.trim();
    const deadline = document.getElementById('activity-deadline').value;
    const maxScore = document.getElementById('activity-max-score').value;
    const acceptingSubmissions = document.getElementById('activity-accepting-submissions').checked;
    const teacherNotes = document.getElementById('teacher-notes').value.trim();
    
    if (!title) {
        showToast('Activity title is required', 'error');
        return;
    }
    
    if (!maxScore || maxScore <= 0) {
        showToast('Max score must be greater than 0', 'error');
        return;
    }
    
    // Validate file sizes
    const maxSize = 20 * 1024 * 1024; // 20MB
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
        showToast(`Some files exceed 20MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`, 'error');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('deadline', deadline);
    formData.append('max_score', maxScore);
    formData.append('is_accepting_submissions', acceptingSubmissions);
    formData.append('teacher_notes', teacherNotes);
    
    // Add all selected files
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });
    
    try {
        showLoading();
        const response = await fetch(`/api/activities/class/${currentClassId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to create activity');
        }
        
        let successMessage = 'Activity created successfully!';
        if (result.activity.files_uploaded > 0) {
            successMessage += ` (${result.activity.files_uploaded} file(s) attached)`;
        }
        
        showToast(successMessage, 'success');
        
        // Reset form and file queue
        document.getElementById('create-activity-form').reset();
        selectedFiles = [];
        renderFileQueue();
        
        // Close modal and refresh
        closeModal();
        showClassDetails(currentClassId);
        
    } catch (error) {
        console.error('Create activity error:', error);
        showToast(error.message || 'Failed to create activity', 'error');
    } finally {
        hideLoading();
    }
};

// Reset file queue when modal closes
const originalCloseModal = window.closeModal;
window.closeModal = function() {
    selectedFiles = [];
    const fileQueue = document.getElementById('file-queue');
    if (fileQueue) {
        fileQueue.innerHTML = '';
    }
    const fileInput = document.getElementById('activity-files');
    if (fileInput) {
        fileInput.value = '';
    }
    if (originalCloseModal) {
        originalCloseModal();
    }
};


// ============================================================================
// GRADING FUNCTIONS
// ============================================================================

// Open grade submission modal with submission details
const gradeSubmissionModal = async (submissionId, studentName, activityId) => {
    try {
        showLoading();
        
        // Fetch submission details
        const submissionResponse = await fetch(`/api/activities/submissions/${submissionId}/details`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!submissionResponse.ok) {
            // Fallback: Try to get activity details only
            const activityResponse = await fetch(`/api/activities/${activityId}`, {
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });
            
            const activityData = await activityResponse.json();
            const maxScore = activityData.activity?.max_score || 100;
            
            // Set basic form values
            document.getElementById('grade-submission-id').value = submissionId;
            document.getElementById('grade-student-name').textContent = studentName;
            document.getElementById('grade-max-score').value = maxScore;
            document.getElementById('grade-score').value = '';
            document.getElementById('grade-score').max = maxScore;
            document.getElementById('max-score-display').textContent = maxScore;
            document.getElementById('grade-feedback').value = '';
            
            // Clear submission preview
            document.getElementById('submission-preview').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <p>No submission details available</p>
                </div>
            `;
            
            hideLoading();
            document.getElementById('modal-overlay').style.display = 'block';
            document.getElementById('grade-submission-modal').style.display = 'block';
            return;
        }
        
        const submissionData = await submissionResponse.json();
        const submission = submissionData.submission;
        const maxScore = submissionData.max_score || 100;
        
        // Set form values
        document.getElementById('grade-submission-id').value = submissionId;
        document.getElementById('grade-student-name').textContent = studentName;
        document.getElementById('grade-max-score').value = maxScore;
        document.getElementById('grade-score').value = submission.score || '';
        document.getElementById('grade-score').max = maxScore;
        document.getElementById('max-score-display').textContent = maxScore;
        document.getElementById('grade-feedback').value = submission.feedback || '';
        
        // Render submission preview
        renderSubmissionPreview(submission);
        
        hideLoading();
        
        // Show modal
        document.getElementById('modal-overlay').style.display = 'block';
        document.getElementById('grade-submission-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading grading modal:', error);
        showToast('Failed to load grading form', 'error');
        hideLoading();
    }
};

// Render submission preview in grading modal
const renderSubmissionPreview = (submission) => {
    const container = document.getElementById('submission-preview');
    
    if (!container) return;
    
    let html = '';
    
    // Show text content if exists
    if (submission.content && submission.content.trim()) {
        html += `
            <div class="submission-content-preview">
                <h4><i class="fas fa-file-alt"></i> Text Submission</h4>
                <div class="content-box">
                    ${escapeHtml(submission.content).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }
    
    // Show file attachment if exists
    if (submission.file_path) {
        const filename = submission.file_path;
        const originalName = filename.split('-').slice(2).join('-') || filename;
        const fileExtension = originalName.split('.').pop().toLowerCase();
        const iconClass = getFileIcon(fileExtension);
        const downloadUrl = `/api/activities/submissions/${submission.submission_id}/download`;
        
        // Check if file is viewable (PDF, images)
        const isViewable = ['pdf', 'jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);
        
        html += `
            <div class="submission-file-preview">
                <h4><i class="fas fa-paperclip"></i> Attached File</h4>
                <div class="file-preview-card">
                    <div class="file-preview-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="file-preview-details">
                        <div class="file-preview-name">${escapeHtml(originalName)}</div>
                        <div class="file-preview-meta">${fileExtension.toUpperCase()}</div>
                    </div>
                    <div class="file-preview-actions">
                        ${isViewable ? `
                            <button type="button" class="btn btn-sm btn-primary" onclick="viewFile('${downloadUrl}', '${escapeHtml(originalName)}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        ` : ''}
                        <a href="${downloadUrl}" class="btn btn-sm btn-secondary" download>
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    // If no content and no file
    if (!submission.content && !submission.file_path) {
        html = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No digital attachments provided</p>
                <small style="color: var(--text-secondary);">Student may have submitted work offline or marked as done</small>
            </div>
        `;
    }
    
    container.innerHTML = html;
};

// ============================================================================
// UNIVERSAL FILE VIEWER WITH AUTHENTICATED FETCH
// ============================================================================

// View file in modal with authenticated fetch
const viewFile = async (fileUrl, fileName) => {
    const modal = document.getElementById('file-viewer-modal');
    const body = document.getElementById('file-viewer-body');
    const filenameDisplay = document.getElementById('file-viewer-filename');
    const downloadBtn = document.getElementById('file-viewer-download-btn');
    
    // Show modal
    modal.style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    
    // Show loading state
    body.innerHTML = `
        <div class="file-viewer-loading">
            <div class="spinner"></div>
            <p>Loading file...</p>
        </div>
    `;
    
    // Set filename
    filenameDisplay.textContent = fileName;
    
    // Set download button
    downloadBtn.onclick = () => downloadFileAuthenticated(fileUrl, fileName);
    
    try {
        // Fetch file with authentication
        const response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.statusText}`);
        }
        
        // Get file as blob
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Determine file type and render accordingly
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
            // Render image
            renderImage(body, blobUrl, fileName);
        } else if (fileExtension === 'pdf') {
            // Render PDF
            renderPDF(body, blobUrl, fileName);
        } else if (['doc', 'docx'].includes(fileExtension)) {
            // Render Word document
            await renderWordDocument(body, blob, fileName);
        } else {
            // Unsupported file type
            renderUnsupported(body, fileName, fileExtension, blobUrl);
        }
        
    } catch (error) {
        console.error('File viewer error:', error);
        body.innerHTML = `
            <div class="file-viewer-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to Load File</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="closeFileViewer()">Close</button>
            </div>
        `;
    }
};

// Render image in viewer
const renderImage = (container, blobUrl, fileName) => {
    container.innerHTML = `
        <img src="${blobUrl}" alt="${escapeHtml(fileName)}" class="file-viewer-image">
    `;
};

// Render PDF in viewer
const renderPDF = (container, blobUrl, fileName) => {
    container.innerHTML = `
        <iframe src="${blobUrl}" class="file-viewer-pdf" title="${escapeHtml(fileName)}"></iframe>
    `;
};

// Render Word document in viewer
const renderWordDocument = async (container, blob, fileName) => {
    try {
        // Check if mammoth.js is loaded
        if (typeof mammoth === 'undefined') {
            // Fallback: Show download option
            container.innerHTML = `
                <div class="file-viewer-unsupported">
                    <i class="fas fa-file-word"></i>
                    <h3>Word Document Preview Not Available</h3>
                    <p>Word document preview requires additional library.</p>
                    <p><strong>${escapeHtml(fileName)}</strong></p>
                    <button class="btn btn-primary" onclick="document.getElementById('file-viewer-download-btn').click()">
                        <i class="fas fa-download"></i> Download to View
                    </button>
                </div>
            `;
            return;
        }
        
        // Convert blob to array buffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Use mammoth.js to convert to HTML
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        
        // Render the HTML
        container.innerHTML = `
            <div class="file-viewer-docx">
                <div class="file-viewer-docx-content">
                    ${result.value}
                </div>
            </div>
        `;
        
        // Log any messages/warnings
        if (result.messages.length > 0) {
            console.warn('Mammoth conversion messages:', result.messages);
        }
        
    } catch (error) {
        console.error('Word document rendering error:', error);
        container.innerHTML = `
            <div class="file-viewer-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to Render Word Document</h3>
                <p>${error.message}</p>
                <button class="btn btn-primary" onclick="document.getElementById('file-viewer-download-btn').click()">
                    <i class="fas fa-download"></i> Download to View
                </button>
            </div>
        `;
    }
};

// Render unsupported file type
const renderUnsupported = (container, fileName, fileExtension, blobUrl) => {
    container.innerHTML = `
        <div class="file-viewer-unsupported">
            <i class="fas fa-file"></i>
            <h3>Preview Not Available</h3>
            <p>This file type (.${escapeHtml(fileExtension)}) cannot be previewed in the browser.</p>
            <p><strong>${escapeHtml(fileName)}</strong></p>
            <button class="btn btn-primary" onclick="document.getElementById('file-viewer-download-btn').click()">
                <i class="fas fa-download"></i> Download to View
            </button>
        </div>
    `;
};

// Download file with authentication
const downloadFileAuthenticated = async (fileUrl, fileName) => {
    try {
        showLoading();
        
        const response = await fetch(fileUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to download file');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        showToast('File downloaded successfully', 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download file', 'error');
    } finally {
        hideLoading();
    }
};

// Close file viewer modal
const closeFileViewer = () => {
    const modal = document.getElementById('file-viewer-modal');
    const body = document.getElementById('file-viewer-body');
    
    // Hide modal
    modal.style.display = 'none';
    
    // Check if no other modals are open before hiding overlay
    const otherModals = document.querySelectorAll('.modal:not(#file-viewer-modal)');
    const anyModalOpen = Array.from(otherModals).some(m => m.style.display === 'block');
    
    if (!anyModalOpen) {
        document.getElementById('modal-overlay').style.display = 'none';
    }
    
    // Clean up body content and revoke blob URLs
    const images = body.querySelectorAll('img');
    const iframes = body.querySelectorAll('iframe');
    
    images.forEach(img => {
        if (img.src.startsWith('blob:')) {
            URL.revokeObjectURL(img.src);
        }
    });
    
    iframes.forEach(iframe => {
        if (iframe.src.startsWith('blob:')) {
            URL.revokeObjectURL(iframe.src);
        }
    });
    
    // Clear content
    body.innerHTML = '';
};

// Add ESC key listener for file viewer
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const modal = document.getElementById('file-viewer-modal');
        if (modal && modal.style.display === 'block') {
            closeFileViewer();
        }
    }
});

// Toggle submission accordion (expand/collapse)
const toggleSubmissionAccordion = (submissionId, studentId) => {
    const submissionItem = document.querySelector(`.submission-item[data-submission-id="${submissionId}"][data-student-id="${studentId}"]`);
    if (!submissionItem) return;
    
    const accordionBody = submissionItem.querySelector('.accordion-body');
    const toggleBtn = submissionItem.querySelector('.accordion-toggle-btn i');
    
    // Toggle expanded class
    submissionItem.classList.toggle('expanded');
    
    // Rotate chevron icon
    if (submissionItem.classList.contains('expanded')) {
        toggleBtn.style.transform = 'rotate(180deg)';
    } else {
        toggleBtn.style.transform = 'rotate(0deg)';
    }
};

// Save inline grade (new function for inline grading)
const saveInlineGrade = async (submissionId, activityId) => {
    const scoreInput = document.getElementById(`score-${submissionId}`);
    const feedbackInput = document.getElementById(`feedback-${submissionId}`);
    
    const score = parseFloat(scoreInput.value);
    const feedback = feedbackInput.value.trim();
    const maxScore = parseFloat(scoreInput.max);
    
    // Validate score
    if (isNaN(score) || score < 0 || score > maxScore) {
        showToast(`Score must be between 0 and ${maxScore}`, 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/activities/submissions/${submissionId}/grade`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                score, 
                feedback,
                max_score: maxScore 
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save grade');
        }
        
        showToast('Grade saved successfully!', 'success');
        
        // Visual feedback - briefly highlight the save button
        const saveBtn = event.target.closest('.btn-save-grade') || 
                       document.querySelector(`#score-${submissionId}`).parentElement.querySelector('.btn-save-grade');
        if (saveBtn) {
            saveBtn.classList.add('saved');
            setTimeout(() => saveBtn.classList.remove('saved'), 1000);
        }
        
        // Update grading status badge
        const submissionItem = scoreInput.closest('.submission-item');
        if (submissionItem) {
            // Update data attribute
            submissionItem.setAttribute('data-grading-status', 'graded');
            
            // Update status badge in header
            const statusBadgesGroup = submissionItem.querySelector('.status-badges-group');
            if (statusBadgesGroup) {
                // Find and update the ungraded/graded badge
                const ungradedBadge = statusBadgesGroup.querySelector('.status-ungraded');
                if (ungradedBadge) {
                    ungradedBadge.className = 'status-badge status-graded';
                    ungradedBadge.innerHTML = '<i class="fas fa-star"></i> Graded';
                }
            }
            
            // Update filter counts
            updateFilterCounts();
            
            // Auto-collapse the accordion after saving
            setTimeout(() => {
                if (submissionItem.classList.contains('expanded')) {
                    const toggleBtn = submissionItem.querySelector('.accordion-toggle-btn i');
                    submissionItem.classList.remove('expanded');
                    if (toggleBtn) {
                        toggleBtn.style.transform = 'rotate(0deg)';
                    }
                }
            }, 800); // Delay to show the success feedback first
        }
        
    } catch (error) {
        console.error('Save grade error:', error);
        showToast(error.message || 'Failed to save grade', 'error');
    } finally {
        hideLoading();
    }
};

// Update filter tab counts after grading
const updateFilterCounts = () => {
    const submissionItems = document.querySelectorAll('.submission-item');
    const allCount = submissionItems.length;
    const ungradedCount = Array.from(submissionItems).filter(item => 
        item.getAttribute('data-grading-status') === 'ungraded'
    ).length;
    const gradedCount = Array.from(submissionItems).filter(item => 
        item.getAttribute('data-grading-status') === 'graded'
    ).length;
    
    // Update tab counts
    const allTab = document.querySelector('.grading-filter-tab[data-filter="all"] .filter-count');
    const ungradedTab = document.querySelector('.grading-filter-tab[data-filter="ungraded"] .filter-count');
    const gradedTab = document.querySelector('.grading-filter-tab[data-filter="graded"] .filter-count');
    
    if (allTab) allTab.textContent = allCount;
    if (ungradedTab) ungradedTab.textContent = ungradedCount;
    if (gradedTab) gradedTab.textContent = gradedCount;
};

// Filter student submissions based on search input
const filterStudentSubmissions = () => {
    const searchInput = document.getElementById('student-search-input');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const submissionItems = document.querySelectorAll('.submission-item');
    const noResultsDiv = document.getElementById('no-search-results');
    const submissionsList = document.getElementById('submissions-list');
    const clearBtn = document.getElementById('clear-search-btn');
    const resultsCount = document.getElementById('search-results-count');
    
    // Get current grading filter
    const activeFilterTab = document.querySelector('.grading-filter-tab.active');
    const currentFilter = activeFilterTab ? activeFilterTab.getAttribute('data-filter') : 'all';
    
    let visibleCount = 0;
    
    // Show/hide clear button
    if (searchTerm) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    // Filter submissions by both search term and grading status
    submissionItems.forEach(item => {
        const studentName = item.getAttribute('data-student-name');
        const gradingStatus = item.getAttribute('data-grading-status');
        
        // Check search match
        const matchesSearch = !searchTerm || studentName.includes(searchTerm);
        
        // Check grading status match
        let matchesFilter = true;
        if (currentFilter === 'graded') {
            matchesFilter = gradingStatus === 'graded';
        } else if (currentFilter === 'ungraded') {
            matchesFilter = gradingStatus === 'ungraded';
        }
        
        // Show item only if it matches both criteria
        if (matchesSearch && matchesFilter) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide no results message
    if (visibleCount === 0 && searchTerm) {
        submissionsList.style.display = 'none';
        noResultsDiv.style.display = 'block';
        document.getElementById('search-term-display').textContent = searchInput.value;
        resultsCount.textContent = '';
    } else {
        submissionsList.style.display = 'block';
        noResultsDiv.style.display = 'none';
        
        // Update results count
        if (searchTerm || currentFilter !== 'all') {
            const totalItems = submissionItems.length;
            resultsCount.textContent = `Showing ${visibleCount} of ${totalItems} students`;
        } else {
            resultsCount.textContent = '';
        }
    }
};

// Filter submissions by grading status (All/Ungraded/Graded)
const filterByGradingStatus = (status) => {
    // Update active tab
    document.querySelectorAll('.grading-filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`.grading-filter-tab[data-filter="${status}"]`).classList.add('active');
    
    const submissionItems = document.querySelectorAll('.submission-item');
    const submissionsList = document.getElementById('submissions-list');
    const noFilterResults = document.getElementById('no-filter-results');
    const noSearchResults = document.getElementById('no-search-results');
    const filterMessage = document.getElementById('filter-message');
    const searchInput = document.getElementById('student-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    let visibleCount = 0;
    
    // Filter submissions
    submissionItems.forEach(item => {
        const gradingStatus = item.getAttribute('data-grading-status');
        const studentName = item.getAttribute('data-student-name');
        
        // Check grading status match
        let matchesFilter = true;
        if (status === 'graded') {
            matchesFilter = gradingStatus === 'graded';
        } else if (status === 'ungraded') {
            matchesFilter = gradingStatus === 'ungraded';
        }
        
        // Check search match
        const matchesSearch = !searchTerm || studentName.includes(searchTerm);
        
        // Show item only if it matches both criteria
        if (matchesFilter && matchesSearch) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide empty states
    if (visibleCount === 0) {
        submissionsList.style.display = 'none';
        noSearchResults.style.display = 'none';
        noFilterResults.style.display = 'block';
        
        // Set appropriate message
        if (status === 'graded') {
            filterMessage.textContent = 'No graded submissions yet. Grade some students to see them here.';
        } else if (status === 'ungraded') {
            filterMessage.textContent = 'All submitted work has been graded! Great job!';
        } else {
            filterMessage.textContent = 'No submissions match your current filters.';
        }
    } else {
        submissionsList.style.display = 'block';
        noFilterResults.style.display = 'none';
        noSearchResults.style.display = 'none';
    }
    
    // Update results count
    const resultsCount = document.getElementById('search-results-count');
    if (resultsCount) {
        if (status !== 'all' || searchTerm) {
            resultsCount.textContent = `Showing ${visibleCount} of ${submissionItems.length} students`;
        } else {
            resultsCount.textContent = '';
        }
    }
};

// Clear student search
const clearStudentSearch = () => {
    const searchInput = document.getElementById('student-search-input');
    if (searchInput) {
        searchInput.value = '';
        filterStudentSubmissions();
        searchInput.focus();
    }
};

// Update score validation when max score changes
const updateScoreValidation = () => {
    const maxScoreInput = document.getElementById('grade-max-score');
    const scoreInput = document.getElementById('grade-score');
    const maxScoreDisplay = document.getElementById('max-score-display');
    
    const maxScore = parseFloat(maxScoreInput.value) || 0;
    
    if (maxScore > 0) {
        scoreInput.max = maxScore;
        maxScoreDisplay.textContent = maxScore;
        
        // Validate current score value
        const currentScore = parseFloat(scoreInput.value);
        if (currentScore > maxScore) {
            scoreInput.value = maxScore;
            showToast(`Score adjusted to maximum: ${maxScore}`, 'info');
        }
    } else {
        maxScoreDisplay.textContent = '--';
    }
};

// Handle grade submission
const handleGradeSubmission = async (event) => {
    event.preventDefault();
    
    const submissionId = document.getElementById('grade-submission-id').value;
    const maxScore = parseFloat(document.getElementById('grade-max-score').value);
    const score = parseFloat(document.getElementById('grade-score').value);
    const feedback = document.getElementById('grade-feedback').value.trim();
    
    // Validate score is within range
    if (score < 0 || score > maxScore) {
        showToast(`Score must be between 0 and ${maxScore}`, 'error');
        return;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/activities/submissions/${submissionId}/grade`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                score, 
                feedback,
                max_score: maxScore 
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to grade submission');
        }
        
        showToast('Submission graded successfully!', 'success');
        closeModal();
        
        // Reload activity details to show updated grade
        if (window.currentActivityId) {
            viewActivityDetails(window.currentActivityId);
        }
        
    } catch (error) {
        console.error('Grade submission error:', error);
        showToast(error.message || 'Failed to grade submission', 'error');
    } finally {
        hideLoading();
    }
};
