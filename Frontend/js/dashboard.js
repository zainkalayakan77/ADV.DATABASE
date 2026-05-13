// Dashboard Functions

let currentDashboardData = null;

// Show dashboard page
const showDashboard = async () => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show dashboard page
    document.getElementById('dashboard-page').style.display = 'block';
    
    // Load dashboard data
    await loadDashboardData();
};

// Load dashboard statistics and data
const loadDashboardData = async () => {
    const data = await handleAPICall(
        () => dashboardAPI.getStats(),
        'Failed to load dashboard data'
    );
    
    if (data) {
        currentDashboardData = data;
        renderDashboardStats(data.stats);
        renderRecentActivities(data.recent_activities);
        renderDashboardClasses(data.classes_overview);
    }
};

// Render dashboard statistics cards
const renderDashboardStats = (stats) => {
    const statsGrid = document.getElementById('stats-grid');
    
    const statsCards = [
        {
            icon: 'fas fa-chalkboard-teacher',
            title: 'Teaching Classes',
            value: stats.classes_teaching || 0,
            color: '#1976d2'
        },
        {
            icon: 'fas fa-user-graduate',
            title: 'Enrolled Classes',
            value: stats.classes_enrolled || 0,
            color: '#4caf50'
        },
        {
            icon: 'fas fa-tasks',
            title: 'Activities Created',
            value: stats.activities_created || 0,
            color: '#ff9800'
        }
    ];
    
    statsGrid.innerHTML = statsCards.map(card => `
        <div class="stat-card">
            <i class="${card.icon}" style="color: ${card.color}"></i>
            <h3>${card.value}</h3>
            <p>${card.title}</p>
        </div>
    `).join('');
};

// Render recent activities
const renderRecentActivities = (activities) => {
    const container = document.getElementById('recent-activities');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-inbox"></i><br>
                    No recent activities found
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const statusClass = getActivityStatusClass(activity.status);
        const deadlineText = activity.deadline ? formatDate(activity.deadline) : 'No deadline';
        
        return `
            <div class="activity-item" onclick="viewActivity(${activity.activity_id})">
                <div class="activity-info">
                    <h4>${escapeHtml(activity.title)}</h4>
                    <p><strong>${escapeHtml(activity.class_name)}</strong> • Due: ${deadlineText}</p>
                    ${activity.score !== null ? `<p>Score: ${formatScore(activity.score)}</p>` : ''}
                </div>
                <div class="activity-status ${statusClass}">
                    ${activity.status}
                </div>
            </div>
        `;
    }).join('');
};

// Render dashboard classes overview
const renderDashboardClasses = (classes) => {
    const container = document.getElementById('dashboard-classes');
    
    if (!classes || classes.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-chalkboard"></i><br>
                    No classes found. Create or join a class to get started!
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="showClasses()">
                        <i class="fas fa-plus"></i> Get Started
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = classes.map(classItem => `
        <div class="class-card" onclick="viewClass(${classItem.class_id})">
            <h3>${escapeHtml(classItem.class_name)}</h3>
            <div class="role-badge role-${classItem.role.toLowerCase()}">
                ${classItem.role}
            </div>
            <div class="class-meta">
                <span><i class="fas fa-tasks"></i> ${classItem.total_activities} activities</span>
                <span><i class="fas fa-users"></i> ${classItem.total_members} members</span>
            </div>
            ${classItem.role === 'Student' && classItem.completed_submissions !== undefined ? `
                <div class="class-meta">
                    <span><i class="fas fa-check-circle"></i> ${classItem.completed_submissions} completed</span>
                </div>
            ` : ''}
        </div>
    `).join('');
};

// Get activity status CSS class
const getActivityStatusClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'submitted':
            return 'status-submitted';
        case 'overdue':
            return 'status-overdue';
        case 'pending':
        default:
            return 'status-pending';
    }
};

// View specific activity (navigate to activity details)
const viewActivity = (activityId) => {
    viewActivityDetails(activityId);
};

// View specific class
const viewClass = (classId) => {
    showClassDetails(classId);
};

// Utility function to escape HTML
const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Refresh dashboard data
const refreshDashboard = async () => {
    if (document.getElementById('dashboard-page').style.display === 'block') {
        await loadDashboardData();
        showToast('Dashboard refreshed', 'success');
    }
};