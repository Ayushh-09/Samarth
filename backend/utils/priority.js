/**
 * Priority Scoring System
 * 
 * Calculates priority using the formula:
 *   Priority = Urgency × PeopleAffected × (1 + TimeWaiting)
 * 
 * - Urgency: Low=1, Medium=2, High=3
 * - TimeWaiting: Hours since the request was created
 * - Higher score = higher priority = assigned first
 */

// Map urgency strings to numeric values
const URGENCY_WEIGHTS = {
  'low': 1,
  'medium': 2,
  'high': 3
};

/**
 * Calculate priority score for a single request
 * @param {Object} request - The request document
 * @returns {Number} - Calculated priority score
 */
function calculatePriority(request) {
  const urgencyWeight = URGENCY_WEIGHTS[request.urgency] || 1;
  const peopleAffected = request.peopleAffected || 1;

  // Calculate hours waiting since creation
  const now = new Date();
  const created = new Date(request.createdAt);
  const hoursWaiting = Math.max(0, (now - created) / (1000 * 60 * 60));

  // Priority Formula
  const priority = urgencyWeight * peopleAffected * (1 + hoursWaiting);

  return Math.round(priority * 100) / 100; // Round to 2 decimal places
}

/**
 * Sort requests by priority score (highest first)
 * @param {Array} requests - Array of request documents
 * @returns {Array} - Sorted requests
 */
function sortByPriority(requests) {
  return requests
    .map(req => {
      req.priorityScore = calculatePriority(req);
      return req;
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

module.exports = { calculatePriority, sortByPriority, URGENCY_WEIGHTS };
