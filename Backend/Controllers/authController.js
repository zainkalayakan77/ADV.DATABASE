// Authentication Controller - Handles user registration, login, logout
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// User Registration
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Input validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password length validation
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT email FROM Users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO Users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.insertId, email: email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token: token,
            user: {
                id: result.insertId,
                name: name,
                email: email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// User Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const [users] = await pool.execute(
            'SELECT user_id, name, email, password FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Get user details with enrollment statistics
        const [userDetails] = await pool.execute(`
            SELECT u.user_id, u.name, u.email, u.created_at,
                   COUNT(DISTINCT CASE WHEN e.role = 'Teacher' THEN e.class_id END) as classes_teaching,
                   COUNT(DISTINCT CASE WHEN e.role = 'Student' THEN e.class_id END) as classes_enrolled
            FROM Users u
            LEFT JOIN Enrollments e ON u.user_id = e.user_id
            WHERE u.user_id = ?
            GROUP BY u.user_id, u.name, u.email, u.created_at
        `, [userId]);

        if (userDetails.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: userDetails[0]
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

// Logout (client-side token removal, server-side session invalidation if using sessions)
const logout = async (req, res) => {
    try {
        // With JWT, logout is primarily handled client-side by removing the token
        // Here we can log the logout event or implement token blacklisting if needed
        
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    logout
};