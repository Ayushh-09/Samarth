/**
 * Rating Routes (In-Memory)
 * POST /api/rate-volunteer - Client rates a volunteer after task completion
 */
const express = require('express');
const { findRequestById, findUserById } = require('../store');
const { validateRatingInput } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/rate-volunteer
 * Client rates the volunteer who completed their request
 * Body: { requestId, rating (1-5), userId }
 */
router.post('/rate-volunteer', (req, res) => {
  try {
    const { requestId, rating, userId } = req.body;

    // Validate input
    const validation = validateRatingInput({ requestId, rating });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    // Find the request
    const request = findRequestById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found.' });
    }

    // Only the client who created the request can rate
    if (request.clientId !== userId) {
      return res.status(403).json({ message: 'You can only rate volunteers for your own requests.' });
    }

    // Request must be completed
    if (request.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate after the request is completed.' });
    }

    // Check if already rated
    if (request.rating) {
      return res.status(400).json({ message: 'You have already rated this volunteer for this request.' });
    }

    // Save rating on the request
    request.rating = rating;

    // Update volunteer's average rating
    const volunteer = findUserById(request.volunteerId);
    let volunteerRating = null;
    if (volunteer) {
      volunteer.totalRatings += rating;
      volunteer.ratingCount += 1;
      volunteer.rating = Math.round((volunteer.totalRatings / volunteer.ratingCount) * 10) / 10;
      volunteerRating = volunteer.rating;
    }

    res.json({
      message: `Thank you! Volunteer rated ${rating}/5 successfully.`,
      volunteerRating
    });
  } catch (error) {
    console.error('Rate volunteer error:', error);
    res.status(500).json({ message: 'Server error rating volunteer.' });
  }
});

module.exports = router;
