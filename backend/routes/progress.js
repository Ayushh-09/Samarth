/**
 * Progress Routes (In-Memory)
 * POST /api/update-status - Update the status of a request
 * POST /api/reject-task   - Volunteer rejects an assigned task
 *
 * Status flow: pending → assigned → in-progress → completed
 */
const express = require('express');
const { findRequestById, findUserById, populateRequest } = require('../store');
const { validateStatusInput } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/update-status
 * Update request status
 * Body: { requestId, status, userId, note? }
 */
router.post('/update-status', (req, res) => {
  try {
    const { requestId, status, userId, note } = req.body;

    // Validate input
    const validation = validateStatusInput({ requestId, status });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Find the request
    const request = findRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Check if the user is the assigned volunteer
    const user = findUserById(userId);
    if (user && user.role === 'volunteer' && request.volunteerId !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this request.' });
    }

    // Validate status transition
    const statusOrder = ['pending', 'assigned', 'in-progress', 'completed'];
    const currentIndex = statusOrder.indexOf(request.status);
    const newIndex = statusOrder.indexOf(status);

    if (newIndex <= currentIndex) {
      return res.status(400).json({ message: `Cannot move from "${request.status}" to "${status}".` });
    }

    // Update status
    request.status = status;
    request.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`
    });

    // If completed, mark volunteer as available again
    if (status === 'completed' && request.volunteerId) {
      const volunteer = findUserById(request.volunteerId);
      if (volunteer) {
        volunteer.availability = true;
      }
    }

    res.json({
      message: `Status updated to "${status}" successfully!`,
      request: populateRequest(request)
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating status.' });
  }
});

/**
 * POST /api/reject-task
 * Volunteer rejects an assigned task (sets back to pending, removes volunteer)
 * Body: { requestId, userId }
 */
router.post('/reject-task', (req, res) => {
  try {
    const { requestId, userId } = req.body;

    const request = findRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    if (request.volunteerId !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this request.' });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({ message: 'Can only reject tasks that are in "assigned" status.' });
    }

    // Reset to pending
    request.status = 'pending';
    request.volunteerId = null;
    request.timeline.push({
      status: 'rejected',
      timestamp: new Date().toISOString(),
      note: 'Volunteer rejected the task'
    });

    res.json({
      message: 'Task rejected. Request is back to pending.',
      request
    });
  } catch (error) {
    console.error('Reject task error:', error);
    res.status(500).json({ message: 'Server error rejecting task.' });
  }
});

module.exports = router;
