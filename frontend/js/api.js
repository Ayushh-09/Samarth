/**
 * API Helper — Centralized API calls, session management, offline support
 */
const API_BASE = '/api';

// ── Session Management ───────────────────────────────
function getUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function saveUser(user) { localStorage.setItem('user', JSON.stringify(user)); }
function clearUser() { localStorage.removeItem('user'); }
function isLoggedIn() { return !!getUser(); }
function logout() { clearUser(); window.location.href = '/index.html'; }

// ── Navbar Builder ───────────────────────────────────
function buildNavbar(role) {
  const user = getUser();
  const home = role === 'volunteer' ? '/volunteer.html' : '/client.html';
  const pg = location.pathname;
  return `
    <div class="navbar-brand"><div class="logo-icon">🤝</div> Samarth</div>
    <div class="navbar-links">
      <a href="/index.html" class="${pg==='/index.html'||pg==='/'?'active':''}">🏠 Home</a>
      ${role==='client'?`<a href="/client.html" class="${pg==='/client.html'?'active':''}">📋 Submit Request</a>`:''}
      ${role==='volunteer'?`<a href="/volunteer.html" class="${pg==='/volunteer.html'?'active':''}">💪 Volunteer</a>`:''}
      <a href="/dashboard.html" class="${pg==='/dashboard.html'?'active':''}">📊 Impact</a>
      <div class="user-badge"><div class="avatar">${user?.name?.charAt(0)||'?'}</div>${user?.name||'Guest'}</div>
      <button onclick="logout()">🚪 Logout</button>
    </div>`;
}

// ── Fetch Wrapper with Offline Support ───────────────
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Something went wrong');
    // Cache GET responses
    if (method === 'GET') localStorage.setItem('cache_' + endpoint, JSON.stringify(data));
    hideOfflineBanner();
    return data;
  } catch (err) {
    if (!navigator.onLine || err.message === 'Failed to fetch') {
      showOfflineBanner();
      if (method === 'GET') {
        const cached = localStorage.getItem('cache_' + endpoint);
        if (cached) return JSON.parse(cached);
      }
    }
    throw err;
  }
}

// ── Offline Banner ───────────────────────────────────
function showOfflineBanner() {
  const b = document.getElementById('offline-banner');
  if (b) b.classList.add('show');
}
function hideOfflineBanner() {
  const b = document.getElementById('offline-banner');
  if (b) b.classList.remove('show');
}
window.addEventListener('offline', showOfflineBanner);
window.addEventListener('online', hideOfflineBanner);

// ── User / Auth API ──────────────────────────────────
async function login(email, password, role) { return apiCall('/login', 'POST', { email, password, role }); }
async function signup(userData) { return apiCall('/signup', 'POST', userData); }
async function getUsers(role) { return apiCall(`/users${role ? '?role=' + role : ''}`); }

// ── Request API ──────────────────────────────────────
async function createRequest(data) {
  const user = getUser();
  return apiCall('/request', 'POST', {
    ...data,
    userId: user ? user.id : null,
    userName: user ? user.name : null,
    userEmail: user ? user.email : null
  });
}
async function getRequests(all = false) {
  const user = getUser();
  return apiCall(`/requests?all=${all}&userId=${user.id}&role=${user.role}`);
}
async function assignRequest(requestId) { return apiCall('/assign', 'POST', { requestId }); }
async function autoAssign() { return apiCall('/auto-assign', 'POST'); }

// ── Progress API ─────────────────────────────────────
async function updateStatus(requestId, status, note) {
  const user = getUser();
  return apiCall('/update-status', 'POST', { requestId, status, note, userId: user.id });
}
async function rejectTask(requestId) {
  const user = getUser();
  return apiCall('/reject-task', 'POST', { requestId, userId: user.id });
}

// ── Rating API ───────────────────────────────────────
async function rateVolunteer(requestId, rating) {
  const user = getUser();
  return apiCall('/rate-volunteer', 'POST', { requestId, rating, userId: user.id });
}

// ── Dashboard API ────────────────────────────────────
async function getDashboard() { return apiCall('/dashboard'); }

// ── Toast Notifications ──────────────────────────────
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Utility Functions ────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function getUrgencyClass(u) { return { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[u] || ''; }
function getStatusClass(s) { return { pending: 'badge-pending', assigned: 'badge-assigned', 'in-progress': 'badge-in-progress', completed: 'badge-completed' }[s] || ''; }
function getStatusProgress(s) { return { pending: 25, assigned: 50, 'in-progress': 75, completed: 100 }[s] || 0; }
function getNeedIcon(t) { return { food: '🍲', medical: '🏥', education: '📚', shelter: '🏠', clothing: '👕', 'disaster-relief': '🆘', 'mental-health': '🧠', other: '📋' }[t] || '📋'; }

// ── Auth Guard ───────────────────────────────────────
function requireAuth(role) {
  if (!isLoggedIn()) { window.location.href = '/index.html'; return false; }
  const user = getUser();
  if (role && user.role !== role) { window.location.href = user.role === 'volunteer' ? '/volunteer.html' : '/client.html'; return false; }
  return true;
}
