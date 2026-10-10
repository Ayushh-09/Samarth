/**
 * Dashboard Routes (In-Memory)
 * GET /api/dashboard - Get impact dashboard statistics
 */
const express = require('express');
const { requests, users } = require('../store');

const router = express.Router();

/**
 * GET /api/dashboard
 * Returns aggregated stats for the impact dashboard
 */
router.get('/dashboard', (req, res) => {
  try {
    // Total counts
    const totalRequests = requests.length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const assignedRequests = requests.filter(r => r.status === 'assigned').length;
    const inProgressRequests = requests.filter(r => r.status === 'in-progress').length;

    // Volunteer stats
    const totalVolunteers = users.filter(u => u.role === 'volunteer').length;
    const activeVolunteers = users.filter(u => u.role === 'volunteer' && u.availability).length;

    // Client stats
    const totalClients = users.filter(u => u.role === 'client').length;

    // Average response time (time from creation to assignment)
    const assignedAndCompleted = requests.filter(r =>
      ['assigned', 'in-progress', 'completed'].includes(r.status)
    );

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    assignedAndCompleted.forEach(r => {
      const createdEntry = r.timeline.find(t => t.status === 'pending');
      const assignedEntry = r.timeline.find(t => t.status === 'assigned');
      if (createdEntry && assignedEntry) {
        const diff = new Date(assignedEntry.timestamp) - new Date(createdEntry.timestamp);
        totalResponseTime += diff;
        responseTimeCount++;
      }
    });

    const avgResponseTimeMs = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    const avgResponseTimeHours = Math.round((avgResponseTimeMs / (1000 * 60 * 60)) * 10) / 10;

    // Priority distribution
    const highUrgency = requests.filter(r => r.urgency === 'high').length;
    const mediumUrgency = requests.filter(r => r.urgency === 'medium').length;
    const lowUrgency = requests.filter(r => r.urgency === 'low').length;

    // Need type distribution
    const needTypeMap = {};
    requests.forEach(r => {
      needTypeMap[r.needType] = (needTypeMap[r.needType] || 0) + 1;
    });
    const needTypes = Object.entries(needTypeMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Completion rate
    const completionRate = totalRequests > 0
      ? Math.round((completedRequests / totalRequests) * 100)
      : 0;

    // Total people helped
    const totalPeopleHelped = requests
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.peopleAffected || 0), 0);

    res.json({
      stats: {
        totalRequests,
        completedRequests,
        pendingRequests,
        assignedRequests,
        inProgressRequests,
        totalVolunteers,
        activeVolunteers,
        totalClients,
        avgResponseTimeHours,
        completionRate,
        totalPeopleHelped
      },
      priorityDistribution: {
        high: highUrgency,
        medium: mediumUrgency,
        low: lowUrgency
      },
      needTypeDistribution: needTypes
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data.' });
  }
});

module.exports = router;
