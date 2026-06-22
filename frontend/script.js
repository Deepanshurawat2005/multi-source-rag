/* ============================================
   MULTI-SOURCE RAG ASSISTANT — script.js
   ============================================ */

// ============ STATE ============
const state = {
  currentPage: "landing",
  previousPage: "landing",
  pdfs: [],
  chats: [],
  currentChatId: null,
  isLoading: false,
  deleteTarget: null,
};

// ============ PAGE NAVIGATION ============
function showPage(pageId) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(pageId + "-page").classList.add("active");
  state.previousPage = state.currentPage;
  state.currentPage = pageId;
  window.scrollTo(0, 0);
}
function showLanding() {
  showPage("landing");
}
function showChat() {
  showPage("chat");
  if (!state.currentChatId) initNewChat();
  renderSidebarPdfs();
  renderChatHistory();
  setTimeout(() => document.getElementById("chatInput").focus(), 100);
}
function showPdfManager() {
  state.previousPage = state.currentPage;
  showPage("pdf");
  renderPdfsGrid();
  updatePdfCount();
}
function goBack() {
  if (state.previousPage === "chat") showChat();
  else showLanding();
}

// ============ MOBILE MENU ============
function toggleMobileMenu() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

// ============ SIDEBAR ============
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
}

// ============ CHAT LOGIC ============
function initNewChat() {
  const id = "chat_" + Date.now();
  const chat = { id, title: "New Chat", messages: [], createdAt: new Date() };
  state.chats.unshift(chat);
  state.currentChatId = id;
  return chat;
}

function getCurrentChat() {
  return state.chats.find((c) => c.id === state.currentChatId);
}

function newChat() {
  const chat = initNewChat();
  clearChatUI();
  document.getElementById("chatTopbarTitle").textContent = "New Chat";
  renderChatHistory();
  document.getElementById("chatInput").focus();
  if (window.innerWidth < 768) toggleSidebar();
}

function clearChatUI() {
  const msgs = document.getElementById("chatMessages");
  msgs.innerHTML = `
    <div class="chat-welcome" id="chatWelcome">
      <div class="welcome-logo">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="url(#wg2)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <defs><linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB"/><stop offset="100%" stop-color="#7C3AED"/>
          </linearGradient></defs>
        </svg>
      </div>
      <h2>Multi-Source RAG Assistant</h2>
      <p>Ask any question. I'll search your PDFs first, then intelligently route to Wikipedia, Arxiv, or the Web.</p>
      <div class="welcome-suggestions">
        <button class="suggestion-chip" onclick="sendSuggestion('What is the attention mechanism in transformers?')">What is the attention mechanism?</button>
        <button class="suggestion-chip" onclick="sendSuggestion('Who was Maharana Pratap?')">Who was Maharana Pratap?</button>
        <button class="suggestion-chip" onclick="sendSuggestion('Explain retrieval augmented generation')">Explain RAG</button>
        <button class="suggestion-chip" onclick="sendSuggestion('What are the latest LLM benchmarks?')">Latest LLM benchmarks</button>
      </div>
    </div>`;
}

function sendSuggestion(text) {
  document.getElementById("chatInput").value = text;
  sendMessage();
}

function handleInputKeydown(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResizeTextarea(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 180) + "px";
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = !el.value.trim();
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const question = input.value.trim();
  if (!question || state.isLoading) return;

  // Hide welcome screen
  const welcome = document.getElementById("chatWelcome");
  if (welcome) welcome.remove();

  // Add user message to UI
  appendUserMessage(question);
  input.value = "";
  input.style.height = "auto";
  document.getElementById("sendBtn").disabled = true;

  // Update chat record
  let chat = getCurrentChat();
  if (!chat) {
    chat = initNewChat();
  }
  if (chat.title === "New Chat") {
    chat.title =
      question.length > 40 ? question.substring(0, 40) + "..." : question;
    document.getElementById("chatTopbarTitle").textContent = chat.title;
  }
  chat.messages.push({ role: "user", content: question });
  renderChatHistory();

  // Show typing indicator
  state.isLoading = true;
  const typingId = showTypingIndicator();

  try {
    const response = await callChatAPI(question);
    removeTypingIndicator(typingId);
    appendAssistantMessage({
      source: response.source,
      answer: response.answer,
      reason: response.reason,
      similarity: response.similarity,
      confidence: response.confidence,
    });
    chat.messages.push({ role: "assistant", ...response });
  } catch (err) {
    removeTypingIndicator(typingId);
    appendAssistantMessage({
      source: "Web",
      answer:
        "I encountered an error processing your request. Please ensure the backend server is running at the configured API endpoint.",
      reason: "Connection error",
    });
  }
  state.isLoading = false;
}

const API_BASE = "http://localhost:8000";

async function callChatAPI(question) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: question,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return await response.json();
}

function appendUserMessage(text) {
  const container = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "message-row msg-user";
  row.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  container.appendChild(row);
  scrollToBottom();
}

function appendAssistantMessage(data) {
  const container = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "message-row msg-assistant";
  const source = data.source || "Web";
  const badgeClass = getBadgeClass(source);
  const reasonHtml = data.reason
    ? `<div class="msg-reason">Routed to ${source}: ${escapeHtml(data.reason)}</div>`
    : "";
  row.innerHTML = `
    <div class="msg-avatar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div class="msg-body">
      <div class="msg-source-row">
        <span class="source-badge ${badgeClass}">${escapeHtml(source)}</span>
      </div>
      <div class="msg-text">
    ${formatAnswer(data.answer || "")}
</div>

${
  data.similarity
    ? `<div class="msg-reason">
Similarity Score: ${data.similarity}
</div>`
    : ""
}

${
  data.confidence
    ? `<div class="msg-reason">
Confidence: ${data.confidence}%
</div>`
    : ""
}
      ${reasonHtml}
    </div>`;
  container.appendChild(row);
  scrollToBottom();
}

function getBadgeClass(source) {
  const map = {
    PDF: "badge-pdf",
    Wikipedia: "badge-wiki",
    Arxiv: "badge-arxiv",
    Web: "badge-web",
  };
  return map[source] || "badge-web";
}

function showTypingIndicator() {
  const id = "typing_" + Date.now();
  const container = document.getElementById("chatMessages");
  const row = document.createElement("div");
  row.className = "typing-row";
  row.id = id;
  row.innerHTML = `
    <div class="typing-indicator">
      <div class="msg-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;
  container.appendChild(row);
  scrollToBottom();
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  const container = document.getElementById("chatMessages");
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 50);
}

function formatAnswer(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ============ CHAT HISTORY SIDEBAR ============
function renderChatHistory() {
  const container = document.getElementById("chatHistory");
  if (!container) return;
  if (state.chats.length === 0) {
    container.innerHTML = '<div class="chat-history-empty">No chats yet</div>';
    return;
  }
  container.innerHTML = state.chats
    .map(
      (chat) => `
    <div class="chat-history-item ${chat.id === state.currentChatId ? "active" : ""}"
         onclick="loadChat('${chat.id}')">
      ${escapeHtml(chat.title)}
    </div>`,
    )
    .join("");
}

function loadChat(chatId) {
  const chat = state.chats.find((c) => c.id === chatId);
  if (!chat) return;
  state.currentChatId = chatId;
  document.getElementById("chatTopbarTitle").textContent = chat.title;
  const container = document.getElementById("chatMessages");
  container.innerHTML = "";
  if (chat.messages.length === 0) {
    clearChatUI();
  } else {
    chat.messages.forEach((msg) => {
      if (msg.role === "user") appendUserMessage(msg.content);
      else appendAssistantMessage(msg);
    });
  }
  renderChatHistory();
  if (window.innerWidth < 768) toggleSidebar();
}

// ============ PDF MANAGEMENT ============
function triggerFileInput() {
  document.getElementById("pdfFileInput").click();
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById("uploadZone").classList.add("drag-over");
}

function handleDragLeave(e) {
  document.getElementById("uploadZone").classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById("uploadZone").classList.remove("drag-over");
  const files = Array.from(e.dataTransfer.files).filter(
    (f) => f.type === "application/pdf",
  );
  if (files.length === 0) {
    showToast("Please drop PDF files only", "error");
    return;
  }
  uploadFiles(files);
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;
  uploadFiles(files);
  e.target.value = "";
}

async function uploadFiles(files) {
  for (const file of files) {
    await uploadSingleFile(file);
  }
}

async function uploadSingleFile(file) {
  const progressId =
    "prog_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
  addProgressItem(progressId, file.name);

  try {
    // Simulate upload to /api/upload
    const formData = new FormData();
    formData.append("file", file);

    // Animate progress bar
    animateProgress(progressId, 0, 60, 600);

    let filename = file.name;
    let uploadSuccess = false;

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        filename = data.filename || file.name;
        uploadSuccess = data.success !== false;
      }
    } catch (err) {
      // Backend not available — simulate success for demo
      uploadSuccess = true;
    }

    animateProgress(progressId, 60, 100, 400);
    await sleep(500);

    if (uploadSuccess) {
      updateProgressStatus(progressId, "success", "Uploaded");
      const pdf = {
        id: "pdf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        name: filename,
        size: formatFileSize(file.size),
        uploadedAt: new Date(),
        status: "ready",
      };
      state.pdfs.push(pdf);
      renderPdfsGrid();
      renderSidebarPdfs();
      updatePdfCount();
      showToast(`${filename} uploaded successfully`, "success");
    } else {
      updateProgressStatus(progressId, "error", "Failed");
    }
  } catch (err) {
    updateProgressStatus(progressId, "error", "Error");
    showToast("Upload failed: " + err.message, "error");
  }

  setTimeout(() => removeProgressItem(progressId), 3000);
}

function addProgressItem(id, filename) {
  const list = document.getElementById("uploadProgressList");
  const item = document.createElement("div");
  item.className = "upload-progress-item";
  item.id = id;
  item.innerHTML = `
    <div class="progress-info">
      <span class="progress-filename">${escapeHtml(filename)}</span>
      <span class="progress-status" id="${id}_status">Uploading...</span>
    </div>
    <div class="progress-bar-bg">
      <div class="progress-bar" id="${id}_bar" style="width:0%"></div>
    </div>`;
  list.appendChild(item);
}

function animateProgress(id, from, to, duration) {
  const bar = document.getElementById(id + "_bar");
  if (!bar) return;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value = from + (to - from) * easeOut(progress);
    bar.style.width = value + "%";
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function updateProgressStatus(id, type, text) {
  const statusEl = document.getElementById(id + "_status");
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.className = "progress-status " + type;
  }
  const bar = document.getElementById(id + "_bar");
  if (bar && type === "success")
    bar.style.background = "linear-gradient(90deg, #10B981, #34d399)";
  if (bar && type === "error") bar.style.background = "#EF4444";
}

function removeProgressItem(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }
}

function renderPdfsGrid() {
  const grid = document.getElementById("pdfsGrid");
  const empty = document.getElementById("pdfsEmpty");
  if (!grid) return;

  if (state.pdfs.length === 0) {
    grid.innerHTML = `
      <div class="pdfs-empty" id="pdfsEmpty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <h3>No PDFs uploaded yet</h3>
        <p>Upload PDF files to start asking questions about them.</p>
      </div>`;
    return;
  }

  grid.innerHTML = state.pdfs
    .map(
      (pdf) => `
    <div class="pdf-card" id="pdfcard_${pdf.id}">
      <div class="pdf-card-header">
        <div class="pdf-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div class="pdf-card-info">
          <div class="pdf-card-name" title="${escapeHtml(pdf.name)}">${escapeHtml(pdf.name)}</div>
          <div class="pdf-card-size">${pdf.size}</div>
        </div>
      </div>
      <div class="pdf-card-status ${pdf.status === "ready" ? "status-ready" : "status-processing"}">
        ${
          pdf.status === "ready"
            ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Ready for Q&A'
            : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg> Processing...'
        }
      </div>
      <div class="pdf-card-actions">
        <button class="btn-ask" onclick="askAboutPdf('${escapeHtml(pdf.name)}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Ask
        </button>
        <button class="btn-delete" onclick="requestDeletePdf('${pdf.id}', '${escapeHtml(pdf.name)}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          </svg>
          Delete
        </button>
      </div>
    </div>`,
    )
    .join("");
}

function renderSidebarPdfs() {
  const list = document.getElementById("sidebarPdfList");
  if (!list) return;
  if (state.pdfs.length === 0) {
    list.innerHTML = `
      <div class="pdf-list-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span>No PDFs uploaded</span>
      </div>`;
    return;
  }
  list.innerHTML = state.pdfs
    .map(
      (pdf) => `
    <div class="pdf-list-item">
      <div class="pdf-list-item-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <span class="pdf-list-item-name" title="${escapeHtml(pdf.name)}">${escapeHtml(pdf.name)}</span>
      <button class="pdf-list-item-remove" onclick="requestDeletePdf('${pdf.id}', '${escapeHtml(pdf.name)}')" title="Remove">×</button>
    </div>`,
    )
    .join("");
}

function updatePdfCount() {
  const badge = document.getElementById("pdfCountBadge");
  if (badge)
    badge.textContent =
      state.pdfs.length + (state.pdfs.length === 1 ? " file" : " files");
}

function askAboutPdf(pdfName) {
  showChat();
  const input = document.getElementById("chatInput");
  if (input) {
    input.value = `What is this document "${pdfName}" about?`;
    autoResizeTextarea(input);
    input.focus();
  }
}

// ============ DELETE MODAL ============
function requestDeletePdf(id, name) {
  state.deleteTarget = id;
  document.getElementById("deleteModalName").textContent =
    `Delete "${name}"? This will remove it from the knowledge base.`;
  document.getElementById("deleteModal").classList.add("active");
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("active");
  state.deleteTarget = null;
}

async function confirmDelete() {
  console.log("DELETE BUTTON CLICKED");
  if (!state.deleteTarget) return;

  const pdf = state.pdfs.find((p) => p.id === state.deleteTarget);

  try {
    if (pdf) {
      await fetch(`${API_BASE}/api/delete/${encodeURIComponent(pdf.name)}`, {
        method: "DELETE",
      });
    }
  } catch (err) {
    console.error("Delete failed:", err);
  }

  state.pdfs = state.pdfs.filter((p) => p.id !== state.deleteTarget);

  closeDeleteModal();

  renderPdfsGrid();
  renderSidebarPdfs();
  updatePdfCount();

  if (pdf) {
    showToast(`"${pdf.name}" deleted`, "success");
  }
}

// ============ TOAST ============
let toastTimer;
function showToast(message, type = "") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show" + (type ? " " + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

// ============ HELPERS ============
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============ SMOOTH SCROLL FOR LANDING NAV LINKS ============
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Enable send button on input
  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("input", function () {
      document.getElementById("sendBtn").disabled = !this.value.trim();
    });
  }

  // Initialize empty chat history display
  const chatHistoryEl = document.getElementById("chatHistory");
  if (chatHistoryEl) {
    chatHistoryEl.innerHTML =
      '<div class="chat-history-empty">No chats yet</div>';
  }

  // Navbar scroll effect
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener(
      "scroll",
      () => {
        navbar.style.boxShadow =
          window.scrollY > 20 ? "0 4px 24px rgba(0,0,0,0.3)" : "none";
      },
      { passive: true },
    );
  }
});
