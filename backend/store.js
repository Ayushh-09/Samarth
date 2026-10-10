/**
 * In-Memory Data Store
 * Replaces MongoDB — all data lives in memory and resets on server restart.
 * Pre-seeded with sample users and requests for demo purposes.
 */

// ── Helper: Generate unique IDs ──────────────────────
let idCounter = 1000;
function generateId() {
  return 'id_' + (++idCounter) + '_' + Date.now().toString(36);
}

// ── Pre-seed Users ───────────────────────────────────
const users = [
  // Volunteers
  {
    id: 'vol_1',
    name: 'Aarav Sharma',
    email: 'aarav@volunteer.com',
    role: 'volunteer',
    location: 'Mumbai',
    skills: ['food', 'shelter', 'disaster-relief'],
    availability: true,
    rating: 4.5,
    totalRatings: 9,
    ratingCount: 2,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'vol_2',
    name: 'Priya Patel',
    email: 'priya@volunteer.com',
    role: 'volunteer',
    location: 'Delhi',
    skills: ['medical', 'mental-health', 'education'],
    availability: true,
    rating: 4.8,
    totalRatings: 24,
    ratingCount: 5,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'vol_3',
    name: 'Rahul Verma',
    email: 'rahul@volunteer.com',
    role: 'volunteer',
    location: 'Bangalore',
    skills: ['education', 'clothing', 'food'],
    availability: true,
    rating: 4.2,
    totalRatings: 21,
    ratingCount: 5,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  // Clients
  {
    id: 'cli_1',
    name: 'Sita Devi',
    email: 'sita@client.com',
    role: 'client',
    location: 'Mumbai',
    skills: [],
    availability: false,
    rating: 0,
    totalRatings: 0,
    ratingCount: 0,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cli_2',
    name: 'Kiran NGO',
    email: 'kiran@client.com',
    role: 'client',
    location: 'Delhi',
    skills: [],
    availability: false,
    rating: 0,
    totalRatings: 0,
    ratingCount: 0,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// ── Pre-seed Requests ────────────────────────────────
const requests = [
  {
    _id: 'req_1',
    clientId: 'cli_1',
    needType: 'food',
    description: 'Need emergency food supplies for 50 families affected by recent flooding in low-lying areas.',
    location: 'Mumbai',
    urgency: 'high',
    peopleAffected: 200,
    status: 'pending',
    volunteerId: null,
    priorityScore: 600,
    timeline: [{ status: 'pending', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), note: 'Request created' }],
    rating: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'req_2',
    clientId: 'cli_2',
    needType: 'medical',
    description: 'Medical camp needed for underprivileged community. Basic health checkups and medicines required.',
    location: 'Delhi',
    urgency: 'high',
    peopleAffected: 150,
    status: 'pending',
    volunteerId: null,
    priorityScore: 450,
    timeline: [{ status: 'pending', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), note: 'Request created' }],
    rating: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'req_3',
    clientId: 'cli_1',
    needType: 'education',
    description: 'Need tutors for after-school program supporting children from underserved areas.',
    location: 'Mumbai',
    urgency: 'medium',
    peopleAffected: 30,
    status: 'pending',
    volunteerId: null,
    priorityScore: 60,
    timeline: [{ status: 'pending', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), note: 'Request created' }],
    rating: null,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'req_4',
    clientId: 'cli_2',
    needType: 'shelter',
    description: 'Temporary shelter materials needed for 10 displaced families.',
    location: 'Delhi',
    urgency: 'high',
    peopleAffected: 40,
    status: 'assigned',
    volunteerId: 'vol_1',
    priorityScore: 120,
    timeline: [
      { status: 'pending', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), note: 'Request created' },
      { status: 'assigned', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), note: 'Assigned to Aarav Sharma' }
    ],
    rating: null,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  },
  {
    _id: 'req_5',
    clientId: 'cli_1',
    needType: 'clothing',
    description: 'Winter clothing drive for homeless community in the area.',
    location: 'Bangalore',
    urgency: 'low',
    peopleAffected: 25,
    status: 'completed',
    volunteerId: 'vol_3',
    priorityScore: 25,
    rating: 5,
    timeline: [
      { status: 'pending', timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(), note: 'Request created' },
      { status: 'assigned', timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), note: 'Assigned to Rahul Verma' },
      { status: 'in-progress', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), note: 'Work started' },
      { status: 'completed', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), note: 'Completed successfully' }
    ],
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString()
  }
];

// ── Lookup Helpers ───────────────────────────────────
function findUserById(id) {
  return users.find(u => u.id === id) || null;
}

function findRequestById(id) {
  return requests.find(r => r._id === id) || null;
}

function getAllUsers() {
  return users;
}

function getAllRequests() {
  return requests;
}

function addRequest(requestData) {
  const newReq = {
    _id: generateId(),
    ...requestData,
    createdAt: new Date().toISOString()
  };
  requests.push(newReq);
  return newReq;
}

function addUser(userData) {
  const newUser = {
    id: userData.id || generateId(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  return newUser;
}

// ── Populate helpers (mimic Mongoose .populate()) ────
function populateRequest(req) {
  const populated = { ...req };
  if (req.clientId) {
    const client = findUserById(req.clientId);
    populated.clientId = client ? { id: client.id, name: client.name, email: client.email, location: client.location } : req.clientId;
  }
  if (req.volunteerId) {
    const vol = findUserById(req.volunteerId);
    populated.volunteerId = vol ? { id: vol.id, name: vol.name, email: vol.email, location: vol.location, skills: vol.skills, rating: vol.rating } : req.volunteerId;
  }
  return populated;
}

module.exports = {
  users,
  requests,
  generateId,
  findUserById,
  findRequestById,
  getAllUsers,
  getAllRequests,
  addRequest,
  addUser,
  populateRequest
};
