/**
 * Request Routes (In-Memory)
 * POST /api/request   - Submit a new help request
 * GET  /api/requests  - Get requests (filtered by role/user)
 * POST /api/assign    - Auto-assign volunteer to a specific request
 * POST /api/auto-assign - Assign volunteers to ALL pending requests
 */
const express = require('express');
const { requests, findUserById, findRequestById, addRequest, addUser, populateRequest } = require('../store');
const { calculatePriority, sortByPriority } = require('../utils/priority');
const { findBestVolunteer } = require('../utils/matching');
const { validateRequestInput } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/request
 * Submit a new help request
 * Body: { userId, needType, description, location, urgency, peopleAffected, userName?, userEmail? }
 */
router.post('/request', (req, res) => {
  try {
    const { userId, needType, description, location, urgency, peopleAffected } = req.body;

    // Validate input fields
    const validation = validateRequestInput({ needType, description, location, urgency, peopleAffected });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    let user = findUserById(userId);
    if (!user) {
      // Auto-register client user in memory if ID wasn't found (e.g., from browser storage or after server restart)
      user = addUser({
        id: userId || undefined,
        name: req.body.userName || 'Client',
        email: req.body.userEmail || (userId ? `${userId}@client.com` : 'client@example.com'),
        role: 'client',
        location: location || 'Mumbai',
        skills: [],
        availability: false,
        rating: 0,
        totalRatings: 0,
        ratingCount: 0
      });
    }
    if (user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can submit requests.' });
    }

    const nowIso = new Date().toISOString();
    const requestData = {
      clientId: user.id,
      needType,
      description,
      location,
      urgency,
      peopleAffected,
      status: 'pending',
      volunteerId: null,
      rating: null,
      createdAt: nowIso,
      timeline: [
        {
          status: 'pending',
          timestamp: nowIso,
          note: 'Request created'
        }
      ]
    };

    // Calculate initial priority score
    requestData.priorityScore = calculatePriority(requestData);

    const newRequest = addRequest(requestData);

    res.status(201).json({
      message: 'Request submitted successfully!',
      request: newRequest
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ message: 'Server error creating request.' });
  }
});

/**
 * GET /api/requests
 * Get requests filtered by userId and role
 * Query: ?userId=xxx&role=client|volunteer&all=true
 */
router.get('/requests', (req, res) => {
  try {
    const { userId, role, all } = req.query;
    let filtered = [...requests];

    if (all === 'true') {
      // Dashboard view — all requests
    } else if (role === 'client' && userId) {
      filtered = filtered.filter(r => r.clientId === userId);
    } else if (role === 'volunteer' && userId) {
      filtered = filtered.filter(r => r.volunteerId === userId);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Recalculate priority scores for pending requests
    filtered = filtered.map(r => {
      const copy = { ...r };
      if (copy.status === 'pending') {
        copy.priorityScore = calculatePriority(copy);
      }
      return copy;
    });

    // Sort pending requests by priority
    const pending = filtered.filter(r => r.status === 'pending');
    const others = filtered.filter(r => r.status !== 'pending');
    const sortedPending = sortByPriority(pending);

    // Populate user references
    const result = [...sortedPending, ...others].map(r => populateRequest(r));

    res.json({ requests: result });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Server error fetching requests.' });
  }
});

/**
 * POST /api/assign
 * Smart-assign the best volunteer to a specific request
 * Body: { requestId }
 */
router.post('/assign', (req, res) => {
  try {
    const { requestId } = req.body;

    const request = findRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request is already assigned or completed.' });
    }

    // Use smart matching to find the best volunteer
    const volunteer = findBestVolunteer(request);
    if (!volunteer) {
      return res.status(404).json({ message: 'No suitable volunteer available right now.' });
    }

    // Assign the volunteer
    request.volunteerId = volunteer.id;
    request.status = 'assigned';
    request.timeline.push({
      status: 'assigned',
      timestamp: new Date().toISOString(),
      note: `Assigned to volunteer: ${volunteer.name}`
    });

    res.json({
      message: `Request assigned to ${volunteer.name}!`,
      request: populateRequest(request)
    });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ message: 'Server error during assignment.' });
  }
});

/**
 * POST /api/auto-assign
 * Automatically assign volunteers to ALL pending requests (sorted by priority)
 */
router.post('/auto-assign', (req, res) => {
  try {
    let pendingRequests = requests.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) {
      return res.json({ message: 'No pending requests to assign.', assigned: 0 });
    }

    // Sort by priority (highest first)
    pendingRequests = sortByPriority(pendingRequests);

    let assignedCount = 0;
    const results = [];

    for (const request of pendingRequests) {
      const volunteer = findBestVolunteer(request);
      if (volunteer) {
        request.volunteerId = volunteer.id;
        request.status = 'assigned';
        request.timeline.push({
          status: 'assigned',
          timestamp: new Date().toISOString(),
          note: `Auto-assigned to volunteer: ${volunteer.name}`
        });
        assignedCount++;
        results.push({ requestId: request._id, volunteer: volunteer.name });
      }
    }

    res.json({
      message: `Auto-assigned ${assignedCount} of ${pendingRequests.length} pending requests.`,
      assigned: assignedCount,
      results
    });
  } catch (error) {
    console.error('Auto-assign error:', error);
    res.status(500).json({ message: 'Server error during auto-assignment.' });
  }
});

module.exports = router;
