/**
 * User Routes
 * POST /api/login     - Authenticate user by email
 * POST /api/signup    - Register a new user
 * GET  /api/users     - Get all users (optionally filtered by role)
 * GET  /api/users/:id - Get a single user by ID
 */
const express = require('express');
const { getAllUsers, findUserById, addUser } = require('../store');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateLoginInput, validateSignupInput, sanitizeString } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/login
 * Log in by email & password (rate-limited)
 */
router.post('/login', authLimiter, (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    const validation = validateLoginInput({ email, role });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const allUsers = getAllUsers();
    let user = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      // Auto-create for seamless experience if not found
      const targetRole = role || 'client';
      user = addUser({
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        role: targetRole,
        location: 'Mumbai',
        skills: targetRole === 'volunteer' ? ['food', 'medical'] : [],
        availability: true,
        rating: targetRole === 'volunteer' ? 4.5 : 0,
        totalRatings: targetRole === 'volunteer' ? 9 : 0,
        ratingCount: targetRole === 'volunteer' ? 2 : 0
      });
      return res.json({ message: 'Account created & logged in!', user });
    }

    if (role && user.role !== role) {
      return res.status(400).json({
        message: `This account is registered as a ${user.role}. Please log in via the ${user.role} portal.`
      });
    }

    res.json({ message: 'Login successful!', user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

/**
 * POST /api/signup
 * Register a new user (rate-limited)
 */
router.post('/signup', authLimiter, (req, res) => {
  try {
    const { name, email, password, role, location, skills, availability } = req.body;

    // Validate input
    const validation = validateSignupInput({ name, email, role, location });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const allUsers = getAllUsers();
    let existingUser = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (existingUser) {
      return res.status(200).json({ message: 'User already exists. Logged in successfully!', user: existingUser });
    }

    const user = addUser({
      name: name || email.split('@')[0],
      email: email.trim().toLowerCase(),
      role: role || 'client',
      location: location || 'Mumbai',
      skills: skills || [],
      availability: availability !== undefined ? availability : true,
      rating: role === 'volunteer' ? 4.5 : 0,
      totalRatings: role === 'volunteer' ? 9 : 0,
      ratingCount: role === 'volunteer' ? 2 : 0
    });

    res.status(201).json({ message: 'Account created successfully!', user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

/**
 * POST /api/users
 * Register a new user (legacy/direct)
 */
router.post('/users', (req, res) => {
  const { id, name, email, role, location, skills, availability, rating } = req.body;
  const user = addUser({
    id: id || undefined,
    name: name || 'Guest',
    email: email || '',
    role: role || 'client',
    location: location || '',
    skills: skills || [],
    availability: availability !== undefined ? availability : true,
    rating: rating || 0,
    totalRatings: 0,
    ratingCount: 0
  });
  res.status(201).json({ message: 'User registered!', user });
});

/**
 * GET /api/users
 * Returns all users, optionally filtered by role
 * Query: ?role=client|volunteer
 */
router.get('/users', (req, res) => {
  let result = getAllUsers();
  if (req.query.role) {
    result = result.filter(u => u.role === req.query.role);
  }
  // Don't expose internal fields
  const safeUsers = result.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    location: u.location,
    skills: u.skills,
    availability: u.availability,
    rating: u.rating
  }));
  res.json({ users: safeUsers });
});

/**
 * GET /api/users/:id
 * Returns a single user by ID
 */
router.get('/users/:id', (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      skills: user.skills,
      availability: user.availability,
      rating: user.rating
    }
  });
});

module.exports = router;
