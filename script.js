/* ═══════════════════════════════════════════════
   SkillSwap — script.js
   Exchange Skills with College Peers
   ═══════════════════════════════════════════════ */

// ─── SKILLS DATA ─────
const skills = [
  {
    name: "Ananya Iyer", college: "IIT Madras", year: "3rd Year",
    skill: "React & Next.js",
    desc: "Full-stack React dev, can teach component architecture, hooks, Next.js routing and deployment.",
    category: "Tech", tags: ["React", "Next.js"],
    rating: 4.9, swaps: 24,
    color: "linear-gradient(135deg,#6c63ff,#a89cff)", initials: "AI"
  },
  {
    name: "Dev Patel", college: "NIT Surat", year: "2nd Year",
    skill: "UI/UX Design",
    desc: "Figma pro. Can teach design systems, wireframing, prototyping and user research basics.",
    category: "Design", tags: ["Figma", "Design"],
    rating: 4.7, swaps: 11,
    color: "linear-gradient(135deg,#ff6584,#ff9a9e)", initials: "DP"
  },
  {
    name: "Kavya Reddy", college: "BITS Hyderabad", year: "Final Year",
    skill: "Classical Guitar",
    desc: "7 years of guitar. Teach chords, scales, fingerstyle and music theory for beginners.",
    category: "Music", tags: ["Guitar", "Music Theory"],
    rating: 5.0, swaps: 18,
    color: "linear-gradient(135deg,#43e97b,#38f9d7)", initials: "KR"
  },
  {
    name: "Rohan Gupta", college: "DTU Delhi", year: "3rd Year",
    skill: "Machine Learning",
    desc: "Can teach scikit-learn, regression, classification and intro to deep learning with PyTorch.",
    category: "Tech", tags: ["Python", "ML", "AI"],
    rating: 4.8, swaps: 31,
    color: "linear-gradient(135deg,#ffd166,#ef476f)", initials: "RG"
  },
  {
    name: "Meera Nair", college: "Symbiosis Pune", year: "2nd Year",
    skill: "French Language",
    desc: "B2 level French. Conversational practice, grammar, reading and written French lessons.",
    category: "Language", tags: ["French", "B2 Level"],
    rating: 4.6, swaps: 9,
    color: "linear-gradient(135deg,#4facfe,#00f2fe)", initials: "MN"
  },
  {
    name: "Aakash Joshi", college: "VIT Pune", year: "Final Year",
    skill: "Photography",
    desc: "DSLR and mirrorless. Teach composition, lighting, editing in Lightroom and Photoshop.",
    category: "Design", tags: ["Photography", "Lightroom"],
    rating: 4.9, swaps: 15,
    color: "linear-gradient(135deg,#f093fb,#f5576c)", initials: "AJ"
  },
  {
    name: "Shreya Mishra", college: "IIT Kanpur", year: "3rd Year",
    skill: "Data Structures & Algo",
    desc: "Competitive coder. Teach DSA for placements — arrays, trees, graphs, DP.",
    category: "Academics", tags: ["DSA", "C++", "Placements"],
    rating: 4.8, swaps: 42,
    color: "linear-gradient(135deg,#5ee7df,#b490ca)", initials: "SM"
  },
  {
    name: "Farhan Khan", college: "NMIMS Mumbai", year: "2nd Year",
    skill: "Football Coaching",
    desc: "District-level player. Coaching fundamentals, drills, positioning and team strategy.",
    category: "Sports", tags: ["Football", "Fitness"],
    rating: 4.5, swaps: 7,
    color: "linear-gradient(135deg,#96fbc4,#f9f586)", initials: "FK"
  },
  {
    name: "Nisha Sharma", college: "IIIT Hyderabad", year: "3rd Year",
    skill: "Video Editing",
    desc: "Premier Pro and DaVinci Resolve expert. Teach cuts, colour grading and motion titles.",
    category: "Design", tags: ["Premiere Pro", "DaVinci"],
    rating: 4.7, swaps: 20,
    color: "linear-gradient(135deg,#a18cd1,#fbc2eb)", initials: "NS"
  },
  {
    name: "Atul Verma", college: "NIT Nagpur", year: "Final Year",
    skill: "Spanish Language",
    desc: "Conversational Spanish (B1). Listening, speaking practice and grammar for beginners.",
    category: "Language", tags: ["Spanish", "Conversational"],
    rating: 4.4, swaps: 6,
    color: "linear-gradient(135deg,#fccb90,#d57eeb)", initials: "AV"
  },
  {
    name: "Tanya Singh", college: "IIM Ahmedabad", year: "1st Year MBA",
    skill: "Financial Modeling",
    desc: "Excel, DCF, LBO models. Teach investment banking fundamentals and valuation.",
    category: "Academics", tags: ["Finance", "Excel", "Valuation"],
    rating: 5.0, swaps: 13,
    color: "linear-gradient(135deg,#89f7fe,#66a6ff)", initials: "TS"
  },
  {
    name: "Jay Malhotra", college: "Manipal University", year: "2nd Year",
    skill: "Tabla & Percussion",
    desc: "Classical tabla player. Teach basic taals, practice exercises and rhythm theory.",
    category: "Music", tags: ["Tabla", "Percussion"],
    rating: 4.6, swaps: 8,
    color: "linear-gradient(135deg,#ffecd2,#fcb69f)", initials: "JM"
  },
];

// ─── STATE ─────────
let currentFilter = "All";

// ─── RENDER SKILL CARDS ───────────
function renderCards(data) {
  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = '';

  if (data.length === 0) {
    grid.innerHTML = `<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:3rem 0">
      No skills found. Try a different search or filter.
    </p>`;
    return;
  }

  data.forEach(s => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <div class="skill-card-top">
        <div class="avatar" style="background:${s.color}">${s.initials}</div>
        <div class="card-meta">
          <div class="name">${s.name}</div>
          <div class="college">${s.college} · ${s.year}</div>
        </div>
        <div class="rating">⭐ ${s.rating}</div>
      </div>
      <h4>${s.skill}</h4>
      <p>${s.desc}</p>
      <div class="skill-card-bottom">
        <div class="fcard-tags">
          ${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <button class="swap-btn" onclick="requestSwap('${s.name}')">Request Swap →</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ─── FILTER ────────────────────────────────────────────────────────────────────
function setFilter(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterCards();
}

function filterCards() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  let filtered = skills;

  if (currentFilter !== 'All') {
    filtered = filtered.filter(s => s.category === currentFilter);
  }
  if (q) {
    filtered = filtered.filter(s =>
      s.skill.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  renderCards(filtered);
}

// ─── AUTH MODAL ────────────────────────────────────────────────────────────────
function openModal(tab) {
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
}

function closeModal() {
  document.getElementById('authModal').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('authModal')) closeModal();
}

function switchTab(tab) {
  document.getElementById('formLogin').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('formSignup').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',  tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

function fakeLogin() {
  closeModal();
  showToast('✅ Welcome to SkillSwap! Your profile is ready.');
}

// ─── SWAP REQUEST ──────────────────────────────────────────────────────────────
function requestSwap(name) {
  showToast(`🤝 Swap request sent to ${name}!`);
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
  if (e.key === 'Escape') closeModal();
});

// ─── INIT ──────────────────────────────────────────────────────────────────────
renderCards(skills);