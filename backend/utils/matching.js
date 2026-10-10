/**
 * Smart Matching System (In-Memory)
 *
 * Matches volunteers to requests using rule-based logic:
 *   1. Filter by availability (must be available)
 *   2. Filter by skill match (volunteer's skills must include the need type)
 *   3. Prefer location match (same city/area)
 *   4. Among matches, pick the highest-rated volunteer
 */
const { users } = require('../store');

/**
 * Find the best volunteer for a given request
 * @param {Object} request - The request to match
 * @returns {Object|null} - Best matching volunteer or null
 */
function findBestVolunteer(request) {
  // Step 1: Get all available volunteers
  const volunteers = users.filter(u => u.role === 'volunteer' && u.availability);

  if (volunteers.length === 0) {
    return null; // No available volunteers
  }

  // Step 2: Score each volunteer
  const scoredVolunteers = volunteers.map(volunteer => {
    let score = 0;

    // Skill match: +10 points if volunteer has the required skill
    if (volunteer.skills.includes(request.needType)) {
      score += 10;
    }

    // Location match: +5 points if same location
    const volunteerLocation = volunteer.location.toLowerCase().trim();
    const requestLocation = request.location.toLowerCase().trim();
    if (volunteerLocation === requestLocation) {
      score += 5;
    } else if (volunteerLocation.includes(requestLocation) || requestLocation.includes(volunteerLocation)) {
      // Partial location match (e.g., "Mumbai" matches "Mumbai, India")
      score += 3;
    }

    // Rating bonus: add rating as a tiebreaker (0-5 points)
    score += (volunteer.rating || 0);

    return {
      volunteer,
      score
    };
  });

  // Step 3: Sort by score (highest first)
  scoredVolunteers.sort((a, b) => b.score - a.score);

  // Step 4: Return best match (must have at least a skill match)
  const bestMatch = scoredVolunteers[0];
  if (bestMatch && bestMatch.score >= 10) {
    // Only return if there's at least a skill match
    return bestMatch.volunteer;
  }

  // If no skill match, return the highest-scored available volunteer anyway
  // (fallback — better to assign someone than no one)
  if (scoredVolunteers.length > 0) {
    return scoredVolunteers[0].volunteer;
  }

  return null;
}

module.exports = { findBestVolunteer };
