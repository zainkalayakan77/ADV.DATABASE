// Notifications Management Functions

let currentNotifications = [];

// Show notifications page
const showNotifications = async () => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show notifications page
    document.getElementById('notifications-page').style.display = 'block';
    
    // Load notifications
    await loadNotifications();
};

// Load user notifications
const loadNotifications = async (type = 'all') => {
    const data = await handleAPICall(
        () => fetch(`/api/notifications?type=${type}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        }).then(res => res.json()),
        'Failed to load notifications'
    );
    
    if (data) {
        currentNotifications = data.notifications;
        renderNotifications(data.notifications);
    }
};

// Render notifications list
const renderNotifications = (notifications) => {
    const container = document.getElementById('notifications-list');
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-item empty">
                <div class="notification-content">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 10px;"></i>
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notification => `
        <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
             onclick="handleNotificationClick(${notification.notification_id}, '${notification.type}', ${notification.related_id})">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h4>${escapeHtml(notification.title)}</h4>
                <p>${escapeHtml(notification.message)}</p>
                <small>${formatDate(notification.created_at)}</small>
            </div>
            <div class="notification-actions">
                ${!notification.is_read ? `
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); markNotificationRead(${notification.notification_id})">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-error" onclick="event.stopPropagation(); deleteNotification(${notification.notification_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
};

// Get notification icon based on type
const getNotificationIcon = (type) => {
    switch (type) {
        case 'join_request':
            return 'fa-user-plus';
        case 'new_submission':
            return 'fa-file-alt';
        case 'system':
            return 'fa-info-circle';
        default:
            return 'fa-bell';
    }
};

// Handle notification click
const handleNotificationClick = async (notificationId, type, relatedId) => {
    // Mark as read if not already
    await markNotificationRead(notificationId);
    
    // Handle different notification types
    switch (type) {
        case 'join_request':
            if (relatedId) {
                await showJoinRequestDetails(relatedId);
            }
            break;
        case 'new_submission':
            showToast('Navigating to submission...', 'info');
            // TODO: Navigate to specific submission
            break;
        default:
            break;
    }
};

// Show join request details modal
const showJoinRequestDetails = async (requestId) => {
    try {
        const response = await fetch(`/api/members/join-requests/pending`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        const request = data.requests.find(r => r.request_id === requestId);
        
        if (!request) {
            showToast('Join request not found', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Join Request</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <p><strong>Student:</strong> ${escapeHtml(request.requester_name)}</p>
                    <p><strong>Email:</strong> ${escapeHtml(request.requester_email)}</p>
                    <p><strong>Class:</strong> ${escapeHtml(request.class_name)}</p>
                    <p><strong>Requested:</strong> ${formatDate(request.requested_at)}</p>
                    ${request.message ? `<p><strong>Message:</strong> ${escapeHtml(request.message)}</p>` : ''}
                    
                    <div class="modal-actions" style="margin-top: 20px;">
                        <button class="btn btn-error" onclick="handleJoinRequestAction(${requestId}, 'reject'); this.closest('.modal').remove();">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="btn btn-success" onclick="handleJoinRequestAction(${requestId}, 'approve'); this.closest('.modal').remove();">
                            <i class="fas fa-check"></i> Approve
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error showing join request:', error);
        showToast('Failed to load join request details', 'error');
    }
};

// Handle join request approval/rejection with UI feedback
const handleJoinRequestAction = async (requestId, action) => {
    try {
        showLoading();
        const response = await fetch(`/api/members/join-requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ action })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || `Failed to ${action} join request`);
        }
        
        // Show success message with details
        const actionText = action === 'approve' ? 'approved' : 'rejected';
        showToast(`Join request ${actionText} successfully! ${result.requester} ${actionText} for ${result.class_name}`, 'success');
        
        // Refresh notifications and update badge
        await loadNotifications();
        await updateNotificationBadge();
        
    } catch (error) {
        console.error(`Error ${action}ing join request:`, error);
        showToast(error.message || `Failed to ${action} join request`, 'error');
    } finally {
        hideLoading();
    }
};

// Mark notification as read
const markNotificationRead = async (notificationId) => {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        // Update UI
        const notificationElement = document.querySelector(`[onclick*="${notificationId}"]`);
        if (notificationElement) {
            notificationElement.classList.remove('unread');
            notificationElement.classList.add('read');
        }
        
        await updateNotificationBadge();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

// Mark all notifications as read
const markAllNotificationsRead = async () => {
    const result = await handleAPICall(
        () => fetch('/api/notifications/mark-all-read', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        }).then(res => res.json()),
        'Failed to mark all notifications as read'
    );
    
    if (result) {
        showToast('All notifications marked as read', 'success');
        await loadNotifications(); // Refresh notifications
        await updateNotificationBadge(); // Update badge count
    }
};

// Delete notification
const deleteNotification = async (notificationId) => {
    const confirmed = confirm('Are you sure you want to delete this notification?');
    if (!confirmed) return;
    
    const result = await handleAPICall(
        () => fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        }).then(res => res.json()),
        'Failed to delete notification'
    );
    
    if (result) {
        showToast('Notification deleted', 'success');
        await loadNotifications(); // Refresh notifications
        await updateNotificationBadge(); // Update badge count
    }
};

// Filter notifications
const filterNotifications = async (type) => {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load filtered notifications
    await loadNotifications(type);
};

// Update notification badge in navbar
const updateNotificationBadge = async () => {
    try {
        const response = await fetch('/api/notifications/unread-count', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        const badge = document.getElementById('notification-count');
        
        if (data.unread_count > 0) {
            badge.textContent = data.unread_count;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
};

// Initialize notifications (call this when app loads)
const initNotifications = async () => {
    if (isAuthenticated()) {
        await updateNotificationBadge();
        
        // Update badge every 30 seconds and check for kick notifications
        setInterval(async () => {
            await updateNotificationBadge();
            await checkForKickNotifications();
        }, 30000);
    }
};

// Check for kick notifications and refresh dashboard if needed
const checkForKickNotifications = async () => {
    try {
        const response = await fetch('/api/notifications?type=system&limit=10', {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        const recentNotifications = data.notifications.filter(n => 
            !n.is_read && (
                n.title.includes('removed from') || 
                n.title.includes('Request Approved') ||
                n.title.includes('Request Rejected')
            )
        );
        
        if (recentNotifications.length > 0) {
            let shouldRefreshDashboard = false;
            
            recentNotifications.forEach(notification => {
                if (notification.title.includes('removed from')) {
                    showToast(notification.message, 'warning');
                    shouldRefreshDashboard = true;
                } else if (notification.title.includes('Request Approved')) {
                    showToast(notification.message, 'success');
                    shouldRefreshDashboard = true;
                } else if (notification.title.includes('Request Rejected')) {
                    showToast(notification.message, 'error');
                }
                
                // Mark notification as read
                markNotificationRead(notification.notification_id);
            });
            
            // Refresh dashboard/classes if needed
            if (shouldRefreshDashboard) {
                if (document.getElementById('dashboard-page').style.display === 'block') {
                    await refreshDashboard();
                } else if (document.getElementById('classes-page').style.display === 'block') {
                    await loadUserClasses();
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking kick notifications:', error);
    }
};