// Main Application JavaScript
// Handles initialization and global app functionality

// Global state
let currentPage = 'dashboard';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Student Activity Tracker - Initializing...');
    
    // Initialize authentication
    await initAuth();
    
    // Initialize notifications if authenticated
    if (isAuthenticated()) {
        await initNotifications();
    }
    
    // Start periodic auth check
    startAuthCheck();
    
    // Add global event listeners
    addGlobalEventListeners();
    
    console.log('✅ Application initialized successfully');
});

// Add global event listeners
const addGlobalEventListeners = () => {
    // Close modal when clicking outside
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });
    
    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Handle form submissions to prevent default behavior
    document.addEventListener('submit', (e) => {
        // Let specific handlers manage the form submission
        // This is just to ensure we don't get unwanted page reloads
    });
    
    // Auto-refresh dashboard data every 5 minutes if on dashboard
    setInterval(() => {
        if (currentPage === 'dashboard' && isAuthenticated()) {
            refreshDashboard();
        }
    }, 5 * 60 * 1000);
};

// Navigation functions
const navigateTo = (page) => {
    currentPage = page;
    
    switch (page) {
        case 'dashboard':
            showDashboard();
            break;
        case 'classes':
            showClasses();
            break;
        case 'reports':
            showReports();
            break;
        default:
            showDashboard();
    }
};

// Update active navigation link
const updateActiveNavLink = (activePage) => {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current page link
    const activeLink = document.querySelector(`[onclick="show${activePage.charAt(0).toUpperCase() + activePage.slice(1)}()"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
};

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('An error occurred while processing your request.', 'error');
});

// Utility functions for the entire app
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Search functionality (can be extended)
const searchData = (data, searchTerm, fields) => {
    if (!searchTerm) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => {
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
};

// Sort functionality
const sortData = (data, field, direction = 'asc') => {
    return [...data].sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle null/undefined values
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';
        
        // Convert to strings for comparison
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
        
        if (direction === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });
};

// Local storage helpers
const saveToLocalStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
};

const getFromLocalStorage = (key, defaultValue = null) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Failed to get from localStorage:', error);
        return defaultValue;
    }
};

// Network status handling
const handleOnlineStatus = () => {
    if (navigator.onLine) {
        showToast('Connection restored', 'success');
        // Refresh current page data
        if (currentPage === 'dashboard') {
            refreshDashboard();
        } else if (currentPage === 'classes') {
            loadUserClasses();
        }
    } else {
        showToast('Connection lost. Some features may not work.', 'warning');
    }
};

window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOnlineStatus);

// Performance monitoring
const measurePerformance = (name, fn) => {
    return async (...args) => {
        const start = performance.now();
        try {
            const result = await fn(...args);
            const end = performance.now();
            console.log(`⏱️ ${name} took ${(end - start).toFixed(2)}ms`);
            return result;
        } catch (error) {
            const end = performance.now();
            console.error(`❌ ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
            throw error;
        }
    };
};

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Only handle shortcuts when not in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Ctrl/Cmd + shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case '1':
                e.preventDefault();
                showDashboard();
                break;
            case '2':
                e.preventDefault();
                showClasses();
                break;
            case '3':
                e.preventDefault();
                showReports();
                break;
        }
    }
});

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(registrationError => {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}

// Export functions for use in other modules
window.app = {
    navigateTo,
    updateActiveNavLink,
    debounce,
    throttle,
    searchData,
    sortData,
    saveToLocalStorage,
    getFromLocalStorage,
    measurePerformance
};

console.log('📱 App.js loaded successfully');