// Reports Functions

// Show reports page
const showReports = () => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show reports page
    document.getElementById('reports-page').style.display = 'block';
    
    // Clear previous results
    document.getElementById('report-results').innerHTML = '';
};

// Generate specific report
const generateReport = async (reportType) => {
    const resultsContainer = document.getElementById('report-results');
    
    let reportData = null;
    let reportTitle = '';
    
    switch (reportType) {
        case 'student-performance':
            reportTitle = 'Student Performance Report';
            reportData = await handleAPICall(
                () => reportsAPI.getStudentPerformance(),
                'Failed to generate student performance report'
            );
            break;
            
        case 'activity-analysis':
            reportTitle = 'Activity Analysis Report';
            reportData = await handleAPICall(
                () => reportsAPI.getActivityAnalysis(),
                'Failed to generate activity analysis report'
            );
            break;
            
        case 'class-overview':
            reportTitle = 'Class Overview Report';
            reportData = await handleAPICall(
                () => reportsAPI.getClassOverview(),
                'Failed to generate class overview report'
            );
            break;
            
        case 'submission-trends':
            reportTitle = 'Submission Trends Report';
            reportData = await handleAPICall(
                () => reportsAPI.getSubmissionTrends(),
                'Failed to generate submission trends report'
            );
            break;
            
        default:
            showToast('Unknown report type', 'error');
            return;
    }
    
    if (reportData) {
        renderReport(reportTitle, reportData, reportType);
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
};

// Render report based on type
const renderReport = (title, data, reportType) => {
    const container = document.getElementById('report-results');
    
    let reportHTML = `
        <div class="report-header">
            <h2><i class="fas fa-chart-bar"></i> ${title}</h2>
            <div class="report-meta">
                <p><strong>Generated:</strong> ${formatDate(data.generated_at)}</p>
                ${data.class_filter ? `<p><strong>Class Filter:</strong> ${data.class_filter}</p>` : ''}
                ${data.period_days ? `<p><strong>Period:</strong> Last ${data.period_days} days</p>` : ''}
            </div>
            <button class="btn btn-secondary" onclick="exportReport('${reportType}')">
                <i class="fas fa-download"></i> Export
            </button>
        </div>
    `;
    
    switch (reportType) {
        case 'student-performance':
            reportHTML += renderStudentPerformanceReport(data.data);
            break;
        case 'activity-analysis':
            reportHTML += renderActivityAnalysisReport(data.data);
            break;
        case 'class-overview':
            reportHTML += renderClassOverviewReport(data.data);
            break;
        case 'submission-trends':
            reportHTML += renderSubmissionTrendsReport(data);
            break;
    }
    
    container.innerHTML = reportHTML;
};

// Render student performance report
const renderStudentPerformanceReport = (data) => {
    if (!data || data.length === 0) {
        return '<p>No student performance data available.</p>';
    }
    
    // Group by class
    const classesByName = {};
    data.forEach(student => {
        if (!classesByName[student.class_name]) {
            classesByName[student.class_name] = [];
        }
        classesByName[student.class_name].push(student);
    });
    
    let html = '';
    
    Object.keys(classesByName).forEach(className => {
        const students = classesByName[className];
        
        html += `
            <div class="report-section">
                <h3>${escapeHtml(className)}</h3>
                <div class="table-responsive">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Email</th>
                                <th>Submissions</th>
                                <th>Average Score</th>
                                <th>Best Score</th>
                                <th>Performance</th>
                                <th>Class Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(student => `
                                <tr>
                                    <td>${escapeHtml(student.name)}</td>
                                    <td>${escapeHtml(student.email)}</td>
                                    <td>${student.total_submissions}</td>
                                    <td>${formatScore(student.average_score)}</td>
                                    <td>${formatScore(student.highest_score)}</td>
                                    <td>
                                        <span class="performance-badge ${getPerformanceBadgeClass(student.performance_category)}">
                                            ${student.performance_category || 'No Data'}
                                        </span>
                                    </td>
                                    <td>#${student.class_rank || 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    return html;
};

// Render activity analysis report
const renderActivityAnalysisReport = (data) => {
    if (!data || data.length === 0) {
        return '<p>No activity analysis data available.</p>';
    }
    
    return `
        <div class="report-section">
            <div class="table-responsive">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Class</th>
                            <th>Students</th>
                            <th>Submissions</th>
                            <th>Completion Rate</th>
                            <th>Average Score</th>
                            <th>Score Range</th>
                            <th>Engagement</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(activity => `
                            <tr>
                                <td>
                                    <strong>${escapeHtml(activity.title)}</strong>
                                    ${activity.deadline ? `<br><small>Due: ${formatDate(activity.deadline)}</small>` : ''}
                                </td>
                                <td>${escapeHtml(activity.class_name)}</td>
                                <td>${activity.total_students}</td>
                                <td>${activity.submissions_received}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${activity.completion_rate}%"></div>
                                        <span class="progress-text">${activity.completion_rate}%</span>
                                    </div>
                                </td>
                                <td>${formatScore(activity.average_score)}</td>
                                <td>
                                    ${formatScore(activity.lowest_score)} - ${formatScore(activity.highest_score)}
                                </td>
                                <td>
                                    <span class="engagement-badge ${getEngagementBadgeClass(activity.engagement_level)}">
                                        ${activity.engagement_level}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// Render class overview report
const renderClassOverviewReport = (data) => {
    if (!data || data.length === 0) {
        return '<p>No class overview data available.</p>';
    }
    
    return `
        <div class="report-section">
            <div class="table-responsive">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Class Name</th>
                            <th>Class Code</th>
                            <th>Created By</th>
                            <th>Members</th>
                            <th>Activities</th>
                            <th>Submissions</th>
                            <th>Class Average</th>
                            <th>Completion Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(classItem => `
                            <tr>
                                <td>
                                    <strong>${escapeHtml(classItem.class_name)}</strong>
                                    <br><small>Created: ${formatDate(classItem.created_at)}</small>
                                </td>
                                <td><code>${classItem.class_code}</code></td>
                                <td>${escapeHtml(classItem.created_by_name)}</td>
                                <td>
                                    <i class="fas fa-chalkboard-teacher"></i> ${classItem.teacher_count} teachers<br>
                                    <i class="fas fa-user-graduate"></i> ${classItem.student_count} students
                                </td>
                                <td>
                                    ${classItem.total_activities} total<br>
                                    <small>
                                        ${classItem.upcoming_activities || 0} upcoming, 
                                        ${classItem.overdue_activities || 0} overdue
                                    </small>
                                </td>
                                <td>${classItem.total_submissions}</td>
                                <td>${formatScore(classItem.class_average_score)}</td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${classItem.overall_completion_rate || 0}%"></div>
                                        <span class="progress-text">${classItem.overall_completion_rate || 0}%</span>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// Render submission trends report
const renderSubmissionTrendsReport = (data) => {
    const { daily_trends, peak_hours } = data;
    
    let html = '';
    
    if (daily_trends && daily_trends.length > 0) {
        html += `
            <div class="report-section">
                <h3>Daily Submission Trends</h3>
                <div class="table-responsive">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Submissions</th>
                                <th>Average Score</th>
                                <th>Unique Students</th>
                                <th>7-Day Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${daily_trends.map(day => `
                                <tr>
                                    <td>${formatDate(day.submission_date)}</td>
                                    <td>${day.daily_submissions}</td>
                                    <td>${formatScore(day.daily_average_score)}</td>
                                    <td>${day.unique_students}</td>
                                    <td>${parseFloat(day.rolling_7day_avg || 0).toFixed(1)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    if (peak_hours && peak_hours.length > 0) {
        html += `
            <div class="report-section">
                <h3>Peak Submission Hours</h3>
                <div class="table-responsive">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Hour of Day</th>
                                <th>Submissions</th>
                                <th>Average Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${peak_hours.map(hour => `
                                <tr>
                                    <td>${hour.hour_of_day}:00</td>
                                    <td>${hour.submission_count}</td>
                                    <td>${formatScore(hour.average_score_by_hour)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    return html || '<p>No submission trends data available.</p>';
};

// Helper functions for report styling
const getPerformanceBadgeClass = (category) => {
    switch (category?.toLowerCase()) {
        case 'excellent':
            return 'badge-success';
        case 'good':
            return 'badge-primary';
        case 'average':
            return 'badge-warning';
        case 'needs improvement':
            return 'badge-error';
        default:
            return 'badge-secondary';
    }
};

const getEngagementBadgeClass = (level) => {
    return level?.toLowerCase() === 'high engagement' ? 'badge-success' : 'badge-warning';
};

// Export report functionality (placeholder)
const exportReport = (reportType) => {
    showToast(`Exporting ${reportType} report...`, 'info');
    // TODO: Implement actual export functionality (CSV, PDF, etc.)
};

// Add CSS for report styling
const addReportStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--border-color);
        }
        
        .report-meta p {
            margin: 5px 0;
            color: var(--text-secondary);
        }
        
        .report-section {
            margin-bottom: 40px;
        }
        
        .report-section h3 {
            margin-bottom: 20px;
            color: var(--primary-color);
        }
        
        .table-responsive {
            overflow-x: auto;
        }
        
        .report-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--card-background);
            border-radius: 8px;
            overflow: hidden;
            box-shadow: var(--shadow);
        }
        
        .report-table th,
        .report-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }
        
        .report-table th {
            background: var(--secondary-color);
            font-weight: 600;
        }
        
        .report-table tr:hover {
            background: var(--secondary-color);
        }
        
        .performance-badge,
        .engagement-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .badge-success {
            background: var(--success-color);
            color: white;
        }
        
        .badge-primary {
            background: var(--primary-color);
            color: white;
        }
        
        .badge-warning {
            background: var(--warning-color);
            color: white;
        }
        
        .badge-error {
            background: var(--error-color);
            color: white;
        }
        
        .badge-secondary {
            background: var(--text-secondary);
            color: white;
        }
        
        .progress-bar {
            position: relative;
            background: var(--border-color);
            border-radius: 10px;
            height: 20px;
            min-width: 100px;
        }
        
        .progress-fill {
            background: var(--success-color);
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--text-primary);
        }
    `;
    document.head.appendChild(style);
};

// Initialize report styles when page loads
document.addEventListener('DOMContentLoaded', addReportStyles);