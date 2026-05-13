// Authentication Functions

// Check if user is authenticated
const isAuthenticated = () => {
    return !!getAuthToken();
};

// Show login form
const showLogin = () => {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
};

// Show register form
const showRegister = () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
};

// Show authentication page
const showAuthPage = () => {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show auth page and hide navbar
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('navbar').style.display = 'none';
    
    // Clear forms
    document.querySelectorAll('form').forEach(form => form.reset());
};

// Show main application
const showMainApp = () => {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('navbar').style.display = 'block';
    showDashboard(); // Show dashboard by default
};

// Handle user registration
const handleRegister = async (event) => {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    // Client-side validation
    if (!name || !email || !password) {
        showToast('All fields are required', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    const result = await handleAPICall(
        () => authAPI.register({ name, email, password }),
        'Registration failed'
    );
    
    if (result) {
        setAuthToken(result.token);
        setCurrentUser(result.user);
        showToast('Registration successful! Welcome!', 'success');
        await initNotifications(); // Initialize notifications after registration
        showMainApp();
    }
};

// Handle user login
const handleLogin = async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showToast('Email and password are required', 'error');
        return;
    }
    
    const result = await handleAPICall(
        () => authAPI.login({ email, password }),
        'Login failed'
    );
    
    if (result) {
        setAuthToken(result.token);
        setCurrentUser(result.user);
        showToast(`Welcome back, ${result.user.name}!`, 'success');
        await initNotifications(); // Initialize notifications after login
        showMainApp();
    }
};

// Handle user logout
const logout = async () => {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    
    try {
        await authAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    // Clear local storage and show auth page
    removeAuthToken();
    removeCurrentUser();
    showToast('Logged out successfully', 'success');
    showAuthPage();
};

// Set current user data
const setCurrentUser = (user) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUserDisplay(user);
};

// Get current user data
const getCurrentUser = () => {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
};

// Remove current user data
const removeCurrentUser = () => {
    localStorage.removeItem('currentUser');
};

// Update user display in navbar
const updateUserDisplay = (user) => {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user) {
        userNameElement.textContent = user.name;
    }
};

// Initialize authentication state
const initAuth = async () => {
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (token && user) {
        // Verify token is still valid by fetching profile
        try {
            const profile = await authAPI.getProfile();
            if (profile) {
                setCurrentUser(profile.user);
                await initNotifications(); // Initialize notifications
                showMainApp();
                return;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
        }
    }
    
    // If no valid token or user, show auth page
    removeAuthToken();
    removeCurrentUser();
    showAuthPage();
};

// Check authentication status periodically
const startAuthCheck = () => {
    // Check every 30 minutes
    setInterval(async () => {
        if (isAuthenticated()) {
            try {
                await authAPI.getProfile();
            } catch (error) {
                console.error('Auth check failed:', error);
                logout();
            }
        }
    }, 30 * 60 * 1000);
};