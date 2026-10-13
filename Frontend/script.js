/* ═══════════════════════════════════════════════
   SkillSwap — script.js
   Exchange Skills with College Peers
   Connected to the SkillSwap backend API
   ═══════════════════════════════════════════════ */

// ─── API CONFIG ─────────────────────────────────────────────────────────────
const API_URL = "http://localhost:5000/api";

// ─── STATE ───────────────────────────────────────────────────────────────────
let currentFilter = "All";
let currentUser = null;        // set after login / on page load if a token exists
let skills = [];                // skills loaded from the backend
let selectedSkillForSwap = null;    // skill object chosen for a swap request
let selectedSwapForBooking = null;  // swapRequest id chosen for a booking
let selectedBookingForReview = null; // booking id chosen for a review
let currentSwapSubTab = "received";
let selectedRating = 0;

// Colour palette reused for auto-generated avatars (matches the original design)
const AVATAR_COLORS = [
  "linear-gradient(135deg,#6c63ff,#a89cff)",
  "linear-gradient(135deg,#ff6584,#ff9a9e)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#ffd166,#ef476f)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#5ee7df,#b490ca)",
  "linear-gradient(135deg,#96fbc4,#f9f586)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
  "linear-gradient(135deg,#89f7fe,#66a6ff)",
  "linear-gradient(135deg,#ffecd2,#fcb69f)"
];

function avatarFor(firstName, lastName) {
  const initials = ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase();
  const seed = (firstName + lastName).split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const color = AVATAR_COLORS[seed % AVATAR_COLORS.length];
  return { initials, color };
}

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("skillswap_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// ─── AUTH: SIGNUP / LOGIN / LOGOUT ─────────────────────────────────────────
async function handleSignup() {
  const firstName = document.getElementById("signupFirstName").value.trim();
  const lastName = document.getElementById("signupLastName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const college = document.getElementById("signupCollege").value.trim();
  const year = document.getElementById("signupYear").value;
  const password = document.getElementById("signupPassword").value;

  if (!firstName || !lastName || !email || !college || !password) {
    showToast("⚠️ Please fill in all fields");
    return;
  }

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, email, college, year, password })
    });
    onAuthSuccess(data.token, data.user);
    closeModal();
    showToast("✅ Welcome to SkillSwap! Your profile is ready.");
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    showToast("⚠️ Please enter your email and password");
    return;
  }

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    onAuthSuccess(data.token, data.user);
    closeModal();
    showToast(`✅ Welcome back, ${data.user.firstName}!`);
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

function onAuthSuccess(token, user) {
  localStorage.setItem("skillswap_token", token);
  currentUser = user;
  updateNavForAuth();
  refreshNotificationBadge();
}

function logout() {
  localStorage.removeItem("skillswap_token");
  currentUser = null;
  updateNavForAuth();
  showToast("👋 Logged out successfully");
}

async function tryRestoreSession() {
  const token = getToken();
  if (!token) return;

  try {
    const data = await apiRequest("/auth/me");
    currentUser = data.user;
    updateNavForAuth();
    refreshNotificationBadge();
  } catch (err) {
    // token expired/invalid — clear it silently
    localStorage.removeItem("skillswap_token");
  }
}

function updateNavForAuth() {
  const loggedIn = !!currentUser;
  document.getElementById("navGuest").style.display = loggedIn ? "none" : "flex";
  document.getElementById("navUser").style.display = loggedIn ? "flex" : "none";
  document.getElementById("navGuestMobile").style.display = loggedIn ? "none" : "flex";
  document.getElementById("navUserMobile").style.display = loggedIn ? "flex" : "none";
  if (loggedIn) {
    document.getElementById("navUserName").textContent = currentUser.firstName;
  }
}

// ─── LOAD & RENDER SKILL CARDS ───────────────────────────────────────────────
async function loadSkills() {
  try {
    const params = new URLSearchParams();
    const q = document.getElementById("searchInput").value.trim();
    if (q) params.set("search", q);
    if (currentFilter !== "All") params.set("category", currentFilter);

    const data = await apiRequest(`/skills?${params.toString()}`);
    skills = data.skills;
    renderCards(skills);
  } catch (err) {
    showToast(`❌ Could not load skills: ${err.message}`);
  }
}

function renderCards(data) {
  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = '';

  if (data.length === 0) {
    grid.innerHTML = `<p class="empty-state" style="grid-column:1/-1">
      No skills found. Try a different search or filter.
    </p>`;
    return;
  }

  data.forEach(s => {
    const owner = s.userId || {};
    const { initials, color } = avatarFor(owner.firstName, owner.lastName);
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <div class="skill-card-top">
        <div class="avatar" style="background:${color}">${initials}</div>
        <div class="card-meta">
          <div class="name">${owner.firstName || ""} ${owner.lastName || ""}</div>
          <div class="college">${owner.college || s.college} · ${owner.year || s.year}</div>
        </div>
        <div class="rating">⭐ ${s.rating ? s.rating.toFixed(1) : "New"}</div>
      </div>
      <h4>${s.skill}</h4>
      <p>${s.description}</p>
      <div class="skill-card-bottom">
        <div class="fcard-tags">
          ${(s.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <button class="swap-btn" onclick='requestSwap(${JSON.stringify(s._id)}, ${JSON.stringify(s.skill)})'>Request Swap →</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ─── FILTER ──────────────────────────────────────────────────────────────────
function setFilter(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterCards();
}

function filterCards() {
  loadSkills();
}

// ─── GENERIC MODAL HELPERS ───────────────────────────────────────────────────
function openModal(tab) {
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
}

function closeModal(id) {
  document.getElementById(id || 'authModal').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('authModal')) closeModal();
}

function closeModalById(id, e) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

function openModalById(id) {
  document.getElementById(id).classList.add('open');
}

function switchTab(tab) {
  document.getElementById('formLogin').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('formSignup').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',  tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

// ─── SWAP REQUEST FLOW ────────────────────────────────────────────────────────
function requestSwap(skillId, skillName) {
  if (!currentUser) {
    showToast("⚠️ Please log in to request a swap");
    openModal('login');
    return;
  }
  selectedSkillForSwap = skillId;
  document.getElementById('swapModalTitle').textContent = `Request: ${skillName}`;
  document.getElementById('swapRequestedSkill').value = skillName;
  document.getElementById('swapOfferedSkill').value = '';
  document.getElementById('swapMessage').value = '';
  openModalById('swapRequestModal');
}

async function submitSwapRequest() {
  const offeredSkill = document.getElementById('swapOfferedSkill').value.trim();
  const requestedSkill = document.getElementById('swapRequestedSkill').value.trim();
  const message = document.getElementById('swapMessage').value.trim();

  if (!offeredSkill || !requestedSkill) {
    showToast("⚠️ Please fill in both skills");
    return;
  }

  try {
    await apiRequest('/swaps', {
      method: 'POST',
      body: JSON.stringify({ skillId: selectedSkillForSwap, offeredSkill, requestedSkill, message })
    });
    closeModal('swapRequestModal');
    showToast('🤝 Swap request sent!');
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function openDashboard(tab) {
  if (!currentUser) {
    showToast("⚠️ Please log in first");
    openModal('login');
    return;
  }
  openModalById('dashboardModal');
  switchDashboardTab(tab || 'profile');
}

function closeDashboard() {
  closeModal('dashboardModal');
}

function closeDashboardOutside(e) {
  if (e.target === document.getElementById('dashboardModal')) closeDashboard();
}

function switchDashboardTab(tab) {
  const tabs = { profile: 'dpaneProfile', myskills: 'dpaneMySkills', swaps: 'dpaneSwaps', bookings: 'dpaneBookings', notifications: 'dpaneNotifications' };
  const btnIds = { profile: 'dtabProfile', myskills: 'dtabMySkills', swaps: 'dtabSwaps', bookings: 'dtabBookings', notifications: 'dtabNotifications' };

  Object.values(tabs).forEach(id => document.getElementById(id).style.display = 'none');
  Object.values(btnIds).forEach(id => document.getElementById(id).classList.remove('active'));

  document.getElementById(tabs[tab]).style.display = 'block';
  document.getElementById(btnIds[tab]).classList.add('active');

  if (tab === 'profile') loadProfileTab();
  if (tab === 'myskills') loadMySkillsTab();
  if (tab === 'swaps') loadSwapsTab();
  if (tab === 'bookings') loadBookingsTab();
  if (tab === 'notifications') loadNotificationsTab();
}

// ─── PROFILE TAB ────────────────────────────────────────────────────────────
function loadProfileTab() {
  document.getElementById('profileFirstName').value = currentUser.firstName || '';
  document.getElementById('profileLastName').value = currentUser.lastName || '';
  document.getElementById('profileCollege').value = currentUser.college || '';
  document.getElementById('profileYear').value = currentUser.year || '1st Year';
  document.getElementById('profileBio').value = currentUser.bio || '';
}

async function saveProfile() {
  try {
    const data = await apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        firstName: document.getElementById('profileFirstName').value.trim(),
        lastName: document.getElementById('profileLastName').value.trim(),
        college: document.getElementById('profileCollege').value.trim(),
        year: document.getElementById('profileYear').value,
        bio: document.getElementById('profileBio').value.trim()
      })
    });
    currentUser = data.user;
    updateNavForAuth();
    showToast('✅ Profile updated');
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ─── MY SKILLS TAB ───────────────────────────────────────────────────────────
async function loadMySkillsTab() {
  const list = document.getElementById('mySkillsList');
  list.innerHTML = `<p class="empty-state">Loading...</p>`;
  try {
    const data = await apiRequest('/skills');
    const mine = data.skills.filter(s => s.userId && s.userId._id === currentUser._id);
    if (mine.length === 0) {
      list.innerHTML = `<p class="empty-state">You haven't posted any skills yet.</p>`;
      return;
    }
    list.innerHTML = mine.map(s => `
      <div class="dash-item">
        <div class="dash-item-top">
          <div>
            <div class="dash-item-title">${s.skill}</div>
            <div class="dash-item-sub">${s.category} · ⭐ ${s.rating ? s.rating.toFixed(1) : 'New'} · ${s.totalSwaps || 0} swaps</div>
          </div>
        </div>
        <div class="dash-item-actions">
          <button class="cancel-btn" onclick="deleteMySkill('${s._id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load your skills.</p>`;
  }
}

function openPostSkillModal() {
  document.getElementById('postSkillName').value = '';
  document.getElementById('postSkillDescription').value = '';
  document.getElementById('postSkillTags').value = '';
  document.getElementById('postSkillCategory').value = 'Tech';
  openModalById('postSkillModal');
}

async function submitPostSkill() {
  const skill = document.getElementById('postSkillName').value.trim();
  const description = document.getElementById('postSkillDescription').value.trim();
  const category = document.getElementById('postSkillCategory').value;
  const tags = document.getElementById('postSkillTags').value.split(',').map(t => t.trim()).filter(Boolean);

  if (!skill || !description) {
    showToast('⚠️ Please fill in the skill name and description');
    return;
  }

  try {
    await apiRequest('/skills', {
      method: 'POST',
      body: JSON.stringify({ skill, description, category, tags })
    });
    closeModal('postSkillModal');
    showToast('✅ Skill posted successfully');
    loadMySkillsTab();
    loadSkills();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

async function deleteMySkill(id) {
  try {
    await apiRequest(`/skills/${id}`, { method: 'DELETE' });
    showToast('🗑️ Skill deleted');
    loadMySkillsTab();
    loadSkills();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ─── SWAPS TAB ────────────────────────────────────────────────────────────────
function switchSwapSubTab(sub) {
  currentSwapSubTab = sub;
  document.getElementById('swapSubReceived').classList.toggle('active', sub === 'received');
  document.getElementById('swapSubSent').classList.toggle('active', sub === 'sent');
  loadSwapsTab();
}

async function loadSwapsTab() {
  const list = document.getElementById('swapsList');
  list.innerHTML = `<p class="empty-state">Loading...</p>`;
  try {
    const endpoint = currentSwapSubTab === 'received' ? '/swaps/received' : '/swaps/my';
    const data = await apiRequest(endpoint);
    const swaps = data.swaps;

    if (swaps.length === 0) {
      list.innerHTML = `<p class="empty-state">No swap requests here yet.</p>`;
      return;
    }

    list.innerHTML = swaps.map(s => {
      const otherUser = currentSwapSubTab === 'received' ? s.senderId : s.receiverId;
      const name = otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown';
      let actions = '';

      if (currentSwapSubTab === 'received' && s.status === 'pending') {
        actions = `
          <button class="accept-btn" onclick="respondToSwap('${s._id}', 'accept')">Accept</button>
          <button class="reject-btn" onclick="respondToSwap('${s._id}', 'reject')">Reject</button>
        `;
      }
      if (currentSwapSubTab === 'sent' && s.status === 'pending') {
        actions = `<button class="cancel-btn" onclick="respondToSwap('${s._id}', 'cancel')">Cancel</button>`;
      }
      if (s.status === 'accepted') {
        actions = `<button class="primary-btn" onclick="openBookingModal('${s._id}')">Schedule Session</button>`;
      }

      return `
        <div class="dash-item">
          <div class="dash-item-top">
            <div>
              <div class="dash-item-title">${name} — ${s.skillId ? s.skillId.skill : ''}</div>
              <div class="dash-item-sub">Offering "${s.offeredSkill}" for "${s.requestedSkill}"</div>
              ${s.message ? `<div class="dash-item-sub">"${s.message}"</div>` : ''}
            </div>
            <span class="status-pill status-${s.status}">${s.status}</span>
          </div>
          ${actions ? `<div class="dash-item-actions">${actions}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load swap requests.</p>`;
  }
}

async function respondToSwap(id, action) {
  try {
    await apiRequest(`/swaps/${id}/${action}`, { method: 'PUT' });
    showToast(`✅ Swap request ${action}ed`);
    loadSwapsTab();
    refreshNotificationBadge();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ─── BOOKINGS TAB ─────────────────────────────────────────────────────────────
function openBookingModal(swapRequestId) {
  selectedSwapForBooking = swapRequestId;
  document.getElementById('bookingDate').value = '';
  document.getElementById('bookingStartTime').value = '';
  document.getElementById('bookingEndTime').value = '';
  document.getElementById('bookingMode').value = 'online';
  document.getElementById('bookingNotes').value = '';
  openModalById('bookingModal');
}

async function submitBooking() {
  const date = document.getElementById('bookingDate').value;
  const startTime = document.getElementById('bookingStartTime').value;
  const endTime = document.getElementById('bookingEndTime').value;
  const mode = document.getElementById('bookingMode').value;
  const notes = document.getElementById('bookingNotes').value.trim();

  if (!date || !startTime || !endTime) {
    showToast('⚠️ Please fill in date, start time and end time');
    return;
  }
  if (endTime <= startTime) {
    showToast('⚠️ End time must be after start time');
    return;
  }

  try {
    await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify({ swapRequestId: selectedSwapForBooking, date, startTime, endTime, mode, notes })
    });
    closeModal('bookingModal');
    showToast('📅 Session booked!');
    loadBookingsTab();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

async function loadBookingsTab() {
  const list = document.getElementById('bookingsList');
  list.innerHTML = `<p class="empty-state">Loading...</p>`;
  try {
    const data = await apiRequest('/bookings/my');
    const bookings = data.bookings;

    if (bookings.length === 0) {
      list.innerHTML = `<p class="empty-state">No sessions booked yet.</p>`;
      return;
    }

    list.innerHTML = bookings.map(b => {
      const isTeacher = b.teacherId._id === currentUser._id;
      const otherUser = isTeacher ? b.learnerId : b.teacherId;
      let actions = '';
      if (b.status === 'scheduled') {
        actions = `
          <button class="accept-btn" onclick="respondToBooking('${b._id}', 'complete')">Mark Completed</button>
          <button class="cancel-btn" onclick="respondToBooking('${b._id}', 'cancel')">Cancel</button>
        `;
      }
      if (b.status === 'completed') {
        actions = `<button class="primary-btn" onclick="openReviewModal('${b._id}')">Leave Review</button>`;
      }

      return `
        <div class="dash-item">
          <div class="dash-item-top">
            <div>
              <div class="dash-item-title">${b.skillId ? b.skillId.skill : 'Session'} with ${otherUser.firstName} ${otherUser.lastName}</div>
              <div class="dash-item-sub">${b.date} · ${b.startTime}–${b.endTime} · ${b.mode}</div>
            </div>
            <span class="status-pill status-${b.status}">${b.status}</span>
          </div>
          ${actions ? `<div class="dash-item-actions">${actions}</div>` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load bookings.</p>`;
  }
}

async function respondToBooking(id, action) {
  try {
    await apiRequest(`/bookings/${id}/${action}`, { method: 'PUT' });
    showToast(`✅ Booking ${action === 'complete' ? 'marked as completed' : 'cancelled'}`);
    loadBookingsTab();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
function openReviewModal(bookingId) {
  selectedBookingForReview = bookingId;
  selectedRating = 0;
  document.getElementById('reviewComment').value = '';
  updateStarDisplay();
  openModalById('reviewModal');
}

document.getElementById('starInput')?.addEventListener('click', (e) => {
  if (e.target.dataset.star) {
    selectedRating = parseInt(e.target.dataset.star);
    updateStarDisplay();
  }
});

function updateStarDisplay() {
  document.querySelectorAll('#starInput span').forEach(s => {
    s.classList.toggle('filled', parseInt(s.dataset.star) <= selectedRating);
  });
}

async function submitReview() {
  const comment = document.getElementById('reviewComment').value.trim();

  if (selectedRating === 0) {
    showToast('⚠️ Please select a star rating');
    return;
  }

  try {
    await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({ bookingId: selectedBookingForReview, rating: selectedRating, comment })
    });
    closeModal('reviewModal');
    showToast('⭐ Review submitted, thank you!');
    loadBookingsTab();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
async function loadNotificationsTab() {
  const list = document.getElementById('notificationsList');
  list.innerHTML = `<p class="empty-state">Loading...</p>`;
  try {
    const data = await apiRequest('/notifications');
    const notifications = data.notifications;

    if (notifications.length === 0) {
      list.innerHTML = `<p class="empty-state">You're all caught up — no notifications.</p>`;
      return;
    }

    list.innerHTML = notifications.map(n => `
      <div class="dash-item notif-item ${n.isRead ? '' : 'unread'}">
        <div class="dash-item-top">
          <div>
            <div class="dash-item-title">${n.title}</div>
            <div class="dash-item-sub">${n.message}</div>
          </div>
          ${!n.isRead ? `<button class="cancel-btn" style="border-color:var(--border);color:var(--muted)" onclick="markNotificationRead('${n._id}')">Mark read</button>` : ''}
        </div>
      </div>
    `).join('');

    refreshNotificationBadge();
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load notifications.</p>`;
  }
}

async function markNotificationRead(id) {
  try {
    await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
    loadNotificationsTab();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

async function markAllNotificationsRead() {
  try {
    await apiRequest('/notifications/read-all', { method: 'PUT' });
    loadNotificationsTab();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

async function refreshNotificationBadge() {
  if (!currentUser) return;
  try {
    const data = await apiRequest('/notifications');
    const unread = data.notifications.filter(n => !n.isRead).length;
    const badge = document.getElementById('bellBadge');
    if (unread > 0) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch (err) {
    // silent — the badge just won't update
  }
}

// ─── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── MOBILE MENU ───────────────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ─── SMOOTH SCROLL ─────────────────────────────────────────────────────────────
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// ─── SCROLL REVEAL ─────────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (i * 0.08) + 's';
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ─── ANIMATED COUNTERS ─────────────────────────────────────────────────────────
function animateCounter(el, target) {
  let cur = 0;
  const step = target / 60;
  const tick = () => {
    cur = Math.min(cur + step, target);
    const display = cur >= 1000
      ? (cur / 1000).toFixed(1) + 'k'
      : Math.round(cur).toString();
    el.textContent = display + (cur >= target ? '+' : '');
    if (cur < target) requestAnimationFrame(tick);
  };
  tick();
}

const statsObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    document.querySelectorAll('[data-target]').forEach(el => {
      animateCounter(el, parseInt(el.dataset.target));
    });
    statsObserver.disconnect();
  }
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero-stats');
if (statsEl) statsObserver.observe(statsEl);

// ─── KEYBOARD: CLOSE MODAL WITH ESC ───────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDashboard();
  }
});

// ─── INIT ──────────────────────────────────────────────────────────────────────
tryRestoreSession();
loadSkills();
