/**
 * Input Validation Helpers
 *
 * Lightweight validation without external dependencies.
 * Returns { valid: boolean, message: string } objects.
 *
 * Usage in a route:
 *   const { validateLoginInput } = require('../middleware/validate');
 *   const result = validateLoginInput(req.body);
 *   if (!result.valid) return res.status(400).json({ message: result.message });
 */

const VALID_ROLES = ['client', 'volunteer'];
const VALID_NEED_TYPES = ['food', 'medical', 'education', 'shelter', 'clothing', 'disaster-relief', 'mental-health', 'other'];
const VALID_URGENCY = ['low', 'medium', 'high'];
const VALID_STATUSES = ['assigned', 'in-progress', 'completed'];

/**
 * Sanitize a string: trim whitespace, remove control characters.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate an email address (basic format check).
 */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate login body: { email, role? }
 */
function validateLoginInput({ email, role } = {}) {
  if (!email || !isValidEmail(email)) {
    return { valid: false, message: 'A valid email address is required.' };
  }
  if (role && !VALID_ROLES.includes(role)) {
    return { valid: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}.` };
  }
  return { valid: true };
}

/**
 * Validate signup body: { name, email, role, location, skills?, availability? }
 */
function validateSignupInput({ name, email, role, location } = {}) {
  if (!email || !isValidEmail(email)) {
    return { valid: false, message: 'A valid email address is required.' };
  }
  if (!role || !VALID_ROLES.includes(role)) {
    return { valid: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}.` };
  }
  if (name && sanitizeString(name).length > 100) {
    return { valid: false, message: 'Name must be 100 characters or fewer.' };
  }
  if (location && sanitizeString(location).length > 100) {
    return { valid: false, message: 'Location must be 100 characters or fewer.' };
  }
  return { valid: true };
}

/**
 * Validate new request body: { needType, description, location, urgency, peopleAffected }
 */
function validateRequestInput({ needType, description, location, urgency, peopleAffected } = {}) {
  if (!needType || !VALID_NEED_TYPES.includes(needType)) {
    return { valid: false, message: `Need type must be one of: ${VALID_NEED_TYPES.join(', ')}.` };
  }
  if (!description || sanitizeString(description).length < 5) {
    return { valid: false, message: 'Description must be at least 5 characters.' };
  }
  if (sanitizeString(description).length > 1000) {
    return { valid: false, message: 'Description must be 1000 characters or fewer.' };
  }
  if (!location || sanitizeString(location).length < 2) {
    return { valid: false, message: 'Location is required.' };
  }
  if (!urgency || !VALID_URGENCY.includes(urgency)) {
    return { valid: false, message: `Urgency must be one of: ${VALID_URGENCY.join(', ')}.` };
  }
  const people = parseInt(peopleAffected, 10);
  if (isNaN(people) || people < 1 || people > 100000) {
    return { valid: false, message: 'People affected must be a number between 1 and 100,000.' };
  }
  return { valid: true };
}

/**
 * Validate status update: { requestId, status }
 */
function validateStatusInput({ requestId, status } = {}) {
  if (!requestId || typeof requestId !== 'string') {
    return { valid: false, message: 'Request ID is required.' };
  }
  if (!status || !VALID_STATUSES.includes(status)) {
    return { valid: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` };
  }
  return { valid: true };
}

/**
 * Validate rating: { requestId, rating }
 */
function validateRatingInput({ requestId, rating } = {}) {
  if (!requestId || typeof requestId !== 'string') {
    return { valid: false, message: 'Request ID is required.' };
  }
  const r = Number(rating);
  if (isNaN(r) || r < 1 || r > 5 || !Number.isInteger(r)) {
    return { valid: false, message: 'Rating must be a whole number between 1 and 5.' };
  }
  return { valid: true };
}

module.exports = {
  sanitizeString,
  isValidEmail,
  validateLoginInput,
  validateSignupInput,
  validateRequestInput,
  validateStatusInput,
  validateRatingInput,
  VALID_ROLES,
  VALID_NEED_TYPES,
  VALID_URGENCY
};
