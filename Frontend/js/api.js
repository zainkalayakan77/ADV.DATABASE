// API Configuration and Helper Functions
const API_BASE_URL = '/api';

// Get authentication token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Set authentication token
const setAuthToken = (token) => {
    localStorage.setItem('authToken', token);
};

// Remove authentication token
const removeAuthToken = () => {
    localStorage.removeItem('authToken');
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Add authorization header if token exists
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        
        // Handle authentication errors and access revocation
        if (error.message.includes('Invalid or expired token') || 
            error.message.includes('Access token required')) {
            removeAuthToken();
            showAuthPage();
            showToast('Session expired. Please login again.', 'error');
            return null;
        }
        
        // Handle access revocation (kicked from class)
        if (error.message.includes('access has been revoked') || 
            error.message.includes('Access denied')) {
            // Don't redirect to login, just show the error
            throw error;
        }
        
        throw error;
    }
};

// Authentication API calls
const authAPI = {
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    
    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    
    getProfile: () => apiRequest('/auth/profile'),
    
    logout: () => apiRequest('/auth/logout', { method: 'POST' })
};

// Classes API calls
const classAPI = {
    create: (classData) => apiRequest('/classes', {
        method: 'POST',
        body: JSON.stringify(classData)
    }),
    
    join: (classCode) => apiRequest('/classes/join', {
        method: 'POST',
        body: JSON.stringify({ class_code: classCode })
    }),
    
    getUserClasses: () => apiRequest('/classes'),
    
    getDetails: (classId) => apiRequest(`/classes/${classId}`),
    
    updateMemberRole: (classId, userId, role) => apiRequest(`/classes/${classId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ userId, role })
    }),
    
    archive: (classId) => apiRequest(`/classes/${classId}/archive`, {
        method: 'PUT'
    }),
    
    unarchive: (classId) => apiRequest(`/classes/${classId}/unarchive`, {
        method: 'PUT'
    }),
    
    delete: (classId) => apiRequest(`/classes/${classId}`, {
        method: 'DELETE'
    }),
    
    getArchived: () => apiRequest('/classes/archived'),
    
    // Student-specific actions
    archivePersonal: (classId) => apiRequest(`/classes/${classId}/archive-personal`, {
        method: 'PUT'
    }),
    
    unarchivePersonal: (classId) => apiRequest(`/classes/${classId}/unarchive-personal`, {
        method: 'PUT'
    }),
    
    leave: (classId) => apiRequest(`/classes/${classId}/leave`, {
        method: 'DELETE'
    })
};

// Activities API calls
const activityAPI = {
    create: (classId, activityData) => apiRequest(`/activities/class/${classId}`, {
        method: 'POST',
        body: JSON.stringify(activityData)
    }),
    
    getClassActivities: (classId) => apiRequest(`/activities/class/${classId}`),
    
    getDetails: (activityId) => apiRequest(`/activities/${activityId}`),
    
    update: (activityId, activityData) => apiRequest(`/activities/${activityId}`, {
        method: 'PUT',
        body: JSON.stringify(activityData)
    }),
    
    delete: (activityId) => apiRequest(`/activities/${activityId}`, {
        method: 'DELETE'
    }),
    
    submitWork: (activityId, content) => apiRequest(`/activities/${activityId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ content })
    }),
    
    gradeSubmission: (submissionId, score, feedback) => apiRequest(`/activities/submissions/${submissionId}/grade`, {
        method: 'PUT',
        body: JSON.stringify({ score, feedback })
    })
};

// Dashboard API calls
const dashboardAPI = {
    getStats: () => apiRequest('/dashboard/stats'),
    getPerformanceAnalytics: (classId = null) => {
        const params = classId ? `?classId=${classId}` : '';
        return apiRequest(`/dashboard/performance${params}`);
    },
    getTeacherAnalytics: () => apiRequest('/dashboard/teacher-analytics')
};

// Reports API calls
const reportsAPI = {
    getStudentPerformance: (classId = null) => {
        const params = classId ? `?classId=${classId}` : '';
        return apiRequest(`/reports/student-performance${params}`);
    },
    
    getActivityAnalysis: (classId = null) => {
        const params = classId ? `?classId=${classId}` : '';
        return apiRequest(`/reports/activity-analysis${params}`);
    },
    
    getClassOverview: () => apiRequest('/reports/class-overview'),
    
    getSubmissionTrends: (days = 30) => apiRequest(`/reports/submission-trends?days=${days}`)
};

// Utility functions
const showLoading = () => {
    document.getElementById('loading').style.display = 'flex';
};

// Announcements API calls
const announcementAPI = {
    create: (classId, content) => apiRequest(`/announcements/class/${classId}`, {
        method: 'POST',
        body: JSON.stringify({ content })
    }),
    
    getClassAnnouncements: (classId) => apiRequest(`/announcements/class/${classId}`),
    
    delete: (announcementId) => apiRequest(`/announcements/${announcementId}`, {
        method: 'DELETE'
    })
};

const hideLoading = () => {
    document.getElementById('loading').style.display = 'none';
};

const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
};

const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatScore = (score) => {
    if (score === null || score === undefined) return 'Not graded';
    return `${parseFloat(score).toFixed(1)}%`;
};

// Error handling wrapper
const handleAPICall = async (apiCall, errorMessage = 'An error occurred') => {
    try {
        showLoading();
        const result = await apiCall();
        return result;
    } catch (error) {
        console.error('API Call Error:', error);
        showToast(error.message || errorMessage, 'error');
        return null;
    } finally {
        hideLoading();
    }
};