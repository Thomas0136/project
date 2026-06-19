function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `eastcso-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const defaults = [
  {
    id: createId(),
    title: "EASTCSO General Assembly",
    category: "Event",
    date: "2026-07-05",
    priority: "High",
    description: "Student leaders meet with representatives to discuss activities, welfare, and upcoming plans."
  },
  {
    id: createId(),
    title: "Club Registration Window",
    category: "Announcement",
    date: "2026-07-10",
    priority: "Medium",
    description: "Students can register for academic, sports, innovation, and cultural clubs through class representatives."
  },
  {
    id: createId(),
    title: "Academic Support Desk",
    category: "Service",
    date: "2026-07-12",
    priority: "Medium",
    description: "The student council will collect academic support requests and forward them to relevant offices."
  },
  {
    id: createId(),
    title: "Community Outreach Day",
    category: "Activity",
    date: "2026-07-20",
    priority: "Low",
    description: "Volunteers join an outreach activity coordinated by EASTCSO and campus clubs."
  }
];

const storeKey = "eastcso-records";
const themeKey = "eastcso-theme";
const state = {
  records: loadRecords(),
  editingId: null
};

const form = document.querySelector("#recordForm");
const recordId = document.querySelector("#recordId");
const title = document.querySelector("#title");
const category = document.querySelector("#category");
const date = document.querySelector("#date");
const priority = document.querySelector("#priority");
const description = document.querySelector("#description");
const submitBtn = document.querySelector("#submitBtn");
const resetBtn = document.querySelector("#resetBtn");
const recordsEl = document.querySelector("#records");
const eventTable = document.querySelector("#eventTable");
const announcementList = document.querySelector("#announcementList");
const recordCount = document.querySelector("#recordCount");
const searchInput = document.querySelector("#searchInput");
const filterCategory = document.querySelector("#filterCategory");
const toast = document.querySelector("#toast");
const navToggle = document.querySelector("#navToggle");
const navLinks = document.querySelector("#navLinks");
const loader = document.querySelector("#loader");
const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");

document.body.classList.add("loading");
applyTheme(loadTheme());

window.addEventListener("load", () => {
  setTimeout(() => {
    loader.classList.add("hidden");
    document.body.classList.remove("loading");
  }, 900);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const payload = {
    id: state.editingId || createId(),
    title: title.value.trim(),
    category: category.value,
    date: date.value,
    priority: priority.value,
    description: description.value.trim()
  };

  if (state.editingId) {
    state.records = state.records.map((item) => item.id === state.editingId ? payload : item);
    showToast("Record updated successfully");
  } else {
    state.records = [payload, ...state.records];
    showToast("Record created successfully");
  }

  saveRecords();
  resetForm();
  render();
});

resetBtn.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderRecords);
filterCategory.addEventListener("change", renderRecords);

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(themeKey, nextTheme);
  showToast(`${capitalize(nextTheme)} theme enabled`);
});

document.querySelector("#contactForm").addEventListener("submit", (event) => {
  const contactForm = event.currentTarget;
  showToast("Sending message to kisanga203@gmail.com");
  setTimeout(() => {
    contactForm.reset();
    showToast("Message sent. Check your email inbox");
  }, 1400);
});

recordsEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const item = state.records.find((record) => record.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.action === "edit") {
    startEdit(item);
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(`Delete "${item.title}"?`);
    if (!confirmed) return;
    state.records = state.records.filter((record) => record.id !== item.id);
    saveRecords();
    resetForm();
    render();
    showToast("Record deleted");
  }
});

function loadRecords() {
  const saved = localStorage.getItem(storeKey);
  if (!saved) return defaults;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaults;
  } catch {
    return defaults;
  }
}

function saveRecords() {
  localStorage.setItem(storeKey, JSON.stringify(state.records));
}

function loadTheme() {
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  themeLabel.textContent = nextTheme === "dark" ? "Dark" : "Light";
  themeToggle.querySelector(".theme-icon").textContent = nextTheme === "dark" ? "Dark" : "Light";
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
}

function render() {
  renderRecords();
  renderEvents();
  renderAnnouncements();
  recordCount.textContent = String(state.records.length);
}

function renderRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = filterCategory.value;
  const filtered = state.records.filter((item) => {
    const matchesQuery = `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  if (!filtered.length) {
    recordsEl.innerHTML = `<p class="empty">No matching records found.</p>`;
    return;
  }

  recordsEl.innerHTML = filtered.map((item) => `
    <article>
      <div>
        <div class="record-meta">
          <span class="badge">${escapeHtml(item.category)}</span>
          <span class="badge">${escapeHtml(item.priority)}</span>
          <span class="badge">${formatDate(item.date)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <div class="record-actions">
        <button class="icon-btn" type="button" data-action="edit" data-id="${item.id}" title="Edit record">Edit</button>
        <button class="icon-btn danger" type="button" data-action="delete" data-id="${item.id}" title="Delete record">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderEvents() {
  const events = state.records
    .filter((item) => item.category === "Event" || item.category === "Activity")
    .slice(0, 6);

  eventTable.innerHTML = events.map((item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${formatDate(item.date)}</td>
      <td>EASTC Campus</td>
      <td>${escapeHtml(item.priority)} priority</td>
    </tr>
  `).join("");
}

function renderAnnouncements() {
  const notices = state.records
    .filter((item) => item.category === "Announcement" || item.priority === "High")
    .slice(0, 5);

  announcementList.innerHTML = notices.map((item) => `
    <li>
      <strong>${escapeHtml(item.title)}</strong>
      <span>${formatDate(item.date)} - ${escapeHtml(item.description)}</span>
    </li>
  `).join("");
}

function startEdit(item) {
  state.editingId = item.id;
  recordId.value = item.id;
  title.value = item.title;
  category.value = item.category;
  date.value = item.date;
  priority.value = item.priority;
  description.value = item.description;
  submitBtn.textContent = "Update Record";
  title.focus();
  showToast("Editing mode enabled");
}

function resetForm() {
  state.editingId = null;
  form.reset();
  recordId.value = "";
  submitBtn.textContent = "Create Record";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

render();
