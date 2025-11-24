const API_BASE = "http://127.0.0.1:8000";

// Tabs
const chatTabBtn = document.getElementById("chatTabBtn");
const adminTabBtn = document.getElementById("adminTabBtn");
const chatSection = document.getElementById("chatSection");
const adminSection = document.getElementById("adminSection");

// Chat elements
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const clearChatBtn = document.getElementById("clearChatBtn");
const typingIndicator = document.getElementById("typingIndicator");
const suggestionButtons = document.querySelectorAll(".suggestion-btn");
const micBtn = document.getElementById("micBtn");
const dynamicSuggestionsBox = document.getElementById("dynamicSuggestions");

// Theme toggle
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Admin login elements
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsernameInput = document.getElementById("adminUsernameInput");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const logoutBtn = document.getElementById("logoutBtn");
const adminLoginStatus = document.getElementById("adminLoginStatus");

// Admin FAQ elements
const faqForm = document.getElementById("faqForm");
const faqQuestion = document.getElementById("faqQuestion");
const faqAnswer = document.getElementById("faqAnswer");
const faqLanguage = document.getElementById("faqLanguage");
const faqTags = document.getElementById("faqTags");
const faqTableBody = document.querySelector("#faqTable tbody");
const faqSearchInput = document.getElementById("faqSearchInput");

// Admin stats
const statTotalFaqs = document.getElementById("statTotalFaqs");
const statEn = document.getElementById("statEn");
const statHi = document.getElementById("statHi");
const statMr = document.getElementById("statMr");

// Complaints
const complaintForm = document.getElementById("complaintForm");
const complaintName = document.getElementById("complaintName");
const complaintEmail = document.getElementById("complaintEmail");
const complaintMessage = document.getElementById("complaintMessage");
const complaintList = document.getElementById("complaintList");

// Toast + status pill
const toastEl = document.getElementById("toast");
const statusPill = document.getElementById("statusPill");

// State
let adminToken = localStorage.getItem("campus_admin_jwt") || "";
let faqsCache = [];
let complaints = [];
let chatHistory = [];

let recognition = null;
let recognizing = false;

const SUGGESTION_BANK = [
  "What is the last date to submit exam form?",
  "What are the library timings?",
  "How to apply for scholarship?",
  "When are semester exams?",
  "How to pay fees?",
  "What is the scholarship last date?",
  "What is the hostel timing?",
  "What is the bus timing?",
];

// ---- Utility: Toast ----
function showToast(message, type = "success", duration = 2200) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.remove("hidden", "error");
  toastEl.classList.add("show");
  if (type === "error") {
    toastEl.classList.add("error");
  }
  setTimeout(() => {
    toastEl.classList.remove("show");
  }, duration);
}

// ---- Status pill ----
function setStatus(ok) {
  if (!statusPill) return;
  const textEl = statusPill.querySelector("span:nth-child(2)");
  if (!textEl) return;

  if (ok) {
    statusPill.classList.remove("error");
    textEl.textContent = "Backend: connected";
  } else {
    statusPill.classList.add("error");
    textEl.textContent = "Backend: error";
  }
}

// ---- Admin UI state ----
function updateAdminUI() {
  if (adminToken) {
    adminLoginStatus.textContent = "Logged in as ashishp";
    logoutBtn.classList.remove("hidden");
  } else {
    adminLoginStatus.textContent = "Not logged in";
    logoutBtn.classList.add("hidden");
  }
}

// ---- Theme handling ----
let currentTheme = localStorage.getItem("campus_theme") || "dark";

function applyTheme(theme) {
  currentTheme = theme;
  if (theme === "light") {
    document.body.classList.add("theme-light");
  } else {
    document.body.classList.remove("theme-light");
  }
  localStorage.setItem("campus_theme", theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === "light" ? "🌞" : "🌙";
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}
applyTheme(currentTheme);

// ---- Tab switching ----
chatTabBtn.addEventListener("click", () => {
  chatTabBtn.classList.add("active");
  adminTabBtn.classList.remove("active");
  chatSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
});

adminTabBtn.addEventListener("click", () => {
  adminTabBtn.classList.add("active");
  chatTabBtn.classList.remove("active");
  adminSection.classList.remove("hidden");
  chatSection.classList.add("hidden");
  loadFAQs();
});

// ---- Chat history helpers ----
function saveChatHistory() {
  try {
    localStorage.setItem("campus_chat_history", JSON.stringify(chatHistory));
  } catch (e) {
    console.warn("Failed to save chat history:", e);
  }
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem("campus_chat_history");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    chatHistory = data;
    chatHistory.forEach((msg) => {
      appendMessage(msg.text, msg.from, msg.meta, false, false);
    });
  } catch (e) {
    console.warn("Failed to load chat history:", e);
  }
}

// ---- Chat rendering with typing animation ----
function appendMessage(text, from = "bot", meta = "", animate = false, save = true) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${from}`;

  const avatar = document.createElement("div");
  avatar.className = `avatar ${from === "bot" ? "bot-avatar" : "user-avatar"}`;
  avatar.textContent = from === "bot" ? "🤖" : "🧑";
  msgDiv.appendChild(avatar);

  const contentWrapper = document.createElement("div");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  contentWrapper.appendChild(bubble);

  msgDiv.appendChild(contentWrapper);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  const entry = { text, from, meta };
  if (save) {
    chatHistory.push(entry);
    saveChatHistory();
  }

  if (animate && from === "bot") {
    let idx = 0;
    const interval = setInterval(() => {
      bubble.innerText = text.slice(0, idx++);
      chatBox.scrollTop = chatBox.scrollHeight;
      if (idx > text.length) {
        clearInterval(interval);
        if (meta) {
          const metaDiv = document.createElement("div");
          metaDiv.className = "meta-line";
          metaDiv.innerText = meta;
          contentWrapper.appendChild(metaDiv);
        }
      }
    }, 15);
  } else {
    bubble.innerText = text;
    if (meta) {
      const metaDiv = document.createElement("div");
      metaDiv.className = "meta-line";
      metaDiv.innerText = meta;
      contentWrapper.appendChild(metaDiv);
    }
  }
}

function showTyping() {
  if (typingIndicator) {
    typingIndicator.classList.remove("hidden");
  }
}

function hideTyping() {
  if (typingIndicator) {
    typingIndicator.classList.add("hidden");
  }
}

// ---- Chat submit ----
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage(text, "user", "", false, true);
  chatInput.value = "";
  dynamicSuggestionsBox.classList.add("hidden");
  dynamicSuggestionsBox.innerHTML = "";
  showTyping();

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!res.ok) {
      appendMessage("Server error. Please try again later.", "bot", "", true, true);
      setStatus(false);
      hideTyping();
      return;
    }

    const data = await res.json();
    const meta = `Lang: ${data.language} | Intent: ${data.intent} | From FAQ: ${
      data.from_faq ? "yes" : "no"
    }`;
    appendMessage(data.reply, "bot", meta, true, true);
    setStatus(true);
  } catch (err) {
    console.error(err);
    appendMessage("Network error. Is backend running?", "bot", "", true, true);
    setStatus(false);
  } finally {
    hideTyping();
  }
});

// ---- Clear chat ----
clearChatBtn.addEventListener("click", () => {
  chatBox.innerHTML = "";
  chatHistory = [];
  saveChatHistory();
  appendMessage(
    "👋 Namaste / Hello! Ask me about fees, exam forms, library timing, scholarship, exam dates, etc.",
    "bot",
    "",
    false,
    false
  );
});

// ---- Quick suggestions ----
suggestionButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.getAttribute("data-text");
    if (!text) return;
    chatInput.value = text;
    chatForm.dispatchEvent(new Event("submit"));
  });
});

// ---- Dynamic suggestions while typing ----
chatInput.addEventListener("input", () => {
  const val = chatInput.value.trim().toLowerCase();
  if (!dynamicSuggestionsBox) return;

  if (val.length < 2) {
    dynamicSuggestionsBox.classList.add("hidden");
    dynamicSuggestionsBox.innerHTML = "";
    return;
  }

  const matches = SUGGESTION_BANK.filter((q) =>
    q.toLowerCase().includes(val)
  ).slice(0, 5);

  if (matches.length === 0) {
    dynamicSuggestionsBox.classList.add("hidden");
    dynamicSuggestionsBox.innerHTML = "";
    return;
  }

  dynamicSuggestionsBox.innerHTML = "";
  matches.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dynamic-suggestion-btn";
    btn.textContent = m;
    btn.addEventListener("click", () => {
      chatInput.value = m;
      chatInput.focus();
      dynamicSuggestionsBox.classList.add("hidden");
      dynamicSuggestionsBox.innerHTML = "";
    });
    dynamicSuggestionsBox.appendChild(btn);
  });

  dynamicSuggestionsBox.classList.remove("hidden");
});

// ---- Speech to Text (only) ----
if (micBtn) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  if (!SR) {
    micBtn.addEventListener("click", () => {
      showToast("Speech recognition not supported in this browser.", "error");
    });
  } else {
    recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
      recognizing = true;
      micBtn.classList.add("active");
    };

    recognition.onend = () => {
      recognizing = false;
      micBtn.classList.remove("active");
    };

    recognition.onerror = (e) => {
      console.warn("Speech error:", e.error);
      recognizing = false;
      micBtn.classList.remove("active");
      showToast("Voice input error.", "error");
    };

    recognition.onresult = (e) => {
      if (!e.results || !e.results[0] || !e.results[0][0]) return;
      const transcript = e.results[0][0].transcript;
      chatInput.value = transcript;
      chatInput.focus();
    };

    micBtn.addEventListener("click", () => {
      if (recognizing) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (err) {
          console.error("Speech start error:", err);
        }
      }
    });
  }
}

// ---- Render FAQ table + stats ----
function renderFaqs(faqs) {
  faqTableBody.innerHTML = "";
  faqs.forEach((faq) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${faq.id}</td>
      <td>${faq.question}</td>
      <td>${faq.language}</td>
      <td>${faq.tags || ""}</td>
    `;
    faqTableBody.appendChild(tr);
  });

  const total = faqs.length;
  const enCount = faqs.filter((f) => f.language === "en").length;
  const hiCount = faqs.filter((f) => f.language === "hi").length;
  const mrCount = faqs.filter((f) => f.language === "mr").length;

  statTotalFaqs.textContent = total;
  statEn.textContent = enCount;
  statHi.textContent = hiCount;
  statMr.textContent = mrCount;
}

// ---- Load FAQs (JWT protected) ----
async function loadFAQs() {
  if (!adminToken) {
    faqsCache = [];
    renderFaqs([]);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/faqs`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    if (!res.ok) {
      console.warn("Failed to fetch FAQs, status:", res.status);
      if (res.status === 401) {
        showToast("Session expired. Please log in again.", "error");
        adminToken = "";
        localStorage.removeItem("campus_admin_jwt");
        updateAdminUI();
        faqsCache = [];
        renderFaqs([]);
      }
      return;
    }

    const faqs = await res.json();
    faqsCache = faqs;
    renderFaqs(faqs);
  } catch (err) {
    console.error("Error loading FAQs:", err);
    showToast("Error loading FAQs. Check backend.", "error");
  }
}

// ---- FAQ search ----
faqSearchInput.addEventListener("input", () => {
  const q = faqSearchInput.value.trim().toLowerCase();
  if (!q) {
    renderFaqs(faqsCache);
    return;
  }
  const filtered = faqsCache.filter((faq) => {
    const text = `${faq.question} ${faq.tags || ""}`.toLowerCase();
    return text.includes(q);
  });
  renderFaqs(filtered);
});

// ---- Add FAQ (JWT protected) ----
faqForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!adminToken) {
    showToast("Log in as admin first.", "error");
    return;
  }

  const question = faqQuestion.value.trim();
  const answer = faqAnswer.value.trim();
  const language = faqLanguage.value.trim();
  const tags = faqTags.value.trim();

  if (!question || !answer || !language) {
    showToast("Question, Answer and Language are required.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/faqs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ question, answer, language, tags }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Add FAQ error:", errText);
      showToast("Failed to add FAQ. Check token or server logs.", "error");
      return;
    }

    faqQuestion.value = "";
    faqAnswer.value = "";
    faqLanguage.value = "";
    faqTags.value = "";

    await loadFAQs();
    showToast("FAQ added successfully.");
  } catch (err) {
    console.error("Error adding FAQ:", err);
    showToast("Network error. Check backend.", "error");
  }
});

// ---- Admin Login ----
adminLoginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = adminUsernameInput.value.trim();
  const password = adminPasswordInput.value.trim();

  if (!username || !password) {
    showToast("Enter username and password.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      showToast("Invalid credentials.", "error");
      return;
    }

    const data = await res.json();
    adminToken = data.access_token;
    localStorage.setItem("campus_admin_jwt", adminToken);
    adminPasswordInput.value = "";

    showToast("Logged in successfully.");
    updateAdminUI();
    await loadFAQs();
  } catch (err) {
    console.error("Login error:", err);
    showToast("Login failed. Check backend.", "error");
  }
});

// ---- Logout ----
logoutBtn.addEventListener("click", () => {
  adminToken = "";
  localStorage.removeItem("campus_admin_jwt");
  faqsCache = [];
  renderFaqs([]);
  updateAdminUI();
  showToast("Logged out.");
});

// ---- Complaints (local only) ----
function saveComplaints() {
  try {
    localStorage.setItem("campus_complaints", JSON.stringify(complaints));
  } catch (e) {
    console.warn("Failed to save complaints:", e);
  }
}

function loadComplaints() {
  try {
    const raw = localStorage.getItem("campus_complaints");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    complaints = data;
  } catch (e) {
    console.warn("Failed to load complaints:", e);
  }
}

function renderComplaints() {
  if (!complaintList) return;
  complaintList.innerHTML = "";
  if (!complaints.length) {
    const li = document.createElement("li");
    li.textContent = "No complaints submitted yet.";
    complaintList.appendChild(li);
    return;
  }
  complaints.forEach((c) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.name || "Anonymous"}</strong> (${c.email || "no email"})<br>${
      c.message
    }<br><span class="complaint-time">${c.time}</span>`;
    complaintList.appendChild(li);
  });
}

if (complaintForm) {
  complaintForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = complaintName.value.trim();
    const email = complaintEmail.value.trim();
    const message = complaintMessage.value.trim();
    if (!message) {
      showToast("Complaint message is required.", "error");
      return;
    }
    const now = new Date();
    const timeStr = now.toLocaleString();
    complaints.push({ name, email, message, time: timeStr });
    saveComplaints();
    renderComplaints();
    complaintName.value = "";
    complaintEmail.value = "";
    complaintMessage.value = "";
    showToast("Complaint submitted (local).");
  });
}

// ---- Initial boot ----
function initChat() {
  loadChatHistory();
  if (chatHistory.length === 0) {
    appendMessage(
      "👋 Namaste / Hello! Ask me about fees, exam forms, library timing, scholarship, exam dates, etc.",
      "bot",
      "",
      false,
      false
    );
  }
}

loadComplaints();
renderComplaints();

initChat();
updateAdminUI();
