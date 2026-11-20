const chatContainer = document.getElementById('chat-container');
const messagesList = document.getElementById('messages-list');
const welcomeScreen = document.getElementById('welcome-screen');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const historyListEl = document.getElementById('history-list');
const currentChatTitle = document.getElementById('current-chat-title');
const toastEl = document.getElementById('toast');

// Mobile Sidebar Controls
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

// State Management dengan LocalStorage
let sessions = JSON.parse(localStorage.getItem('garpitx_sessions') || '[]');
let activeSessionId = null;
let isGenerating = false;

// Konfigurasi Marked.js
if (window.marked) {
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
      if (window.hljs && lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return code;
    }
  });
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function saveSessions() {
  localStorage.setItem('garpitx_sessions', JSON.stringify(sessions));
  renderSidebarHistory();
}

function getActiveSession() {
  return sessions.find((s) => s.id === activeSessionId);
}

function createNewSession() {
  activeSessionId = null;
  messagesList.innerHTML = '';
  welcomeScreen.style.display = 'block';
  currentChatTitle.textContent = 'Percakapan Baru';
  renderSidebarHistory();
  closeMobileSidebar();
}

function loadSession(id) {
  const session = sessions.find((s) => s.id === id);
  if (!session) return;

  activeSessionId = id;
  welcomeScreen.style.display = 'none';
  messagesList.innerHTML = '';
  currentChatTitle.textContent = session.title;

  session.messages.forEach((m) => {
    renderMessageBubble(m.role, m.content, false);
  });

  renderSidebarHistory();
  scrollToBottom();
  closeMobileSidebar();
}

function renderSidebarHistory() {
  historyListEl.innerHTML = '';
  if (sessions.length === 0) {
    historyListEl.innerHTML = '<div style="font-size:12px;color:#64748b;padding:8px;">Belum ada riwayat obrolan.</div>';
    return;
  }

  sessions.forEach((session) => {
    const item = document.createElement('div');
    item.className = `history-item ${session.id === activeSessionId ? 'active' : ''}`;
    item.innerHTML = `<span>💬</span><span>${escapeHtml(session.title)}</span>`;
    item.onclick = () => loadSession(session.id);
    historyListEl.appendChild(item);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth'
  });
}

function renderMessageBubble(role, content, animateTypewriter = false) {
  welcomeScreen.style.display = 'none';

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'user' ? 'Anda' : 'GX';

  const contentWrap = document.createElement('div');
  contentWrap.className = 'msg-content-wrap';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (role === 'user') {
    bubble.textContent = content;
  } else {
    bubble.innerHTML = window.marked ? marked.parse(content) : escapeHtml(content);
  }

  contentWrap.appendChild(bubble);

  if (role === 'assistant' && content) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-msg-btn';
    copyBtn.innerHTML = '📋 Salin respons';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(content);
      showToast('Respons berhasil disalin!');
    };
    actions.appendChild(copyBtn);
    contentWrap.appendChild(actions);
  }

  row.appendChild(avatar);
  row.appendChild(contentWrap);
  messagesList.appendChild(row);
  scrollToBottom();
  return { row, bubble, contentWrap };
}

function renderTypingIndicator() {
  welcomeScreen.style.display = 'none';
  const row = document.createElement('div');
  row.className = 'message-row assistant';
  row.id = 'typing-row';

  row.innerHTML = `
    <div class="msg-avatar">GX</div>
    <div class="msg-content-wrap">
      <div class="msg-bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  messagesList.appendChild(row);
  scrollToBottom();
  return row;
}

// Efek mengetik halus (Smooth Typewriter Reveal)
async function smoothRevealText(bubbleEl, fullText) {
  const words = fullText.split(' ');
  let current = '';
  for (let i = 0; i < words.length; i++) {
    current += (i === 0 ? '' : ' ') + words[i];
    bubbleEl.innerHTML = window.marked ? marked.parse(current) : escapeHtml(current);
    if (i % 4 === 0) scrollToBottom();
    await new Promise((r) => setTimeout(r, 18));
  }
  bubbleEl.innerHTML = window.marked ? marked.parse(fullText) : escapeHtml(fullText);
  scrollToBottom();
}

async function handleSendMessage(promptText) {
  if (!promptText.trim() || isGenerating) return;
  isGenerating = true;
  sendBtn.disabled = true;

  // Buat sesi baru jika belum ada
  if (!activeSessionId) {
    const newId = 'session_' + Date.now();
    const shortTitle = promptText.length > 34 ? promptText.slice(0, 34) + '...' : promptText;
    sessions.unshift({
      id: newId,
      title: shortTitle,
      messages: []
    });
    activeSessionId = newId;
    currentChatTitle.textContent = shortTitle;
  }

  const session = getActiveSession();
  session.messages.push({ role: 'user', content: promptText });
  saveSessions();

  renderMessageBubble('user', promptText);
  userInput.value = '';
  autoResizeTextarea();

  const typingRow = renderTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: session.messages }),
    });

    const data = await res.json();
    typingRow.remove();

    if (!res.ok) {
      const errMsg = `⚠️ **Gagal memproses permintaan:** ${data.error || 'Terjadi kesalahan pada endpoint CrowLLM.'}`;
      renderMessageBubble('assistant', errMsg);
    } else {
      const reply = data.reply;
      session.messages.push({ role: 'assistant', content: reply });
      saveSessions();

      const { bubble, contentWrap } = renderMessageBubble('assistant', '');
      await smoothRevealText(bubble, reply);

      // Tambahkan tombol salin setelah animasi selesai
      const actions = document.createElement('div');
      actions.className = 'msg-actions';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-msg-btn';
      copyBtn.innerHTML = '📋 Salin respons';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(reply);
        showToast('Respons berhasil disalin!');
      };
      actions.appendChild(copyBtn);
      contentWrap.appendChild(actions);
    }
  } catch (err) {
    typingRow.remove();
    renderMessageBubble('assistant', `⚠️ **Kesalahan Jaringan:** ${err.message}`);
  } finally {
    isGenerating = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// Auto-resize textarea
function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 150) + 'px';
}

userInput.addEventListener('input', autoResizeTextarea);

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSendMessage(userInput.value.trim());
});

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event('submit'));
  }
});

// Prompt Cards Quick Click
document.querySelectorAll('.prompt-card').forEach((card) => {
  card.addEventListener('click', () => {
    const prompt = card.getAttribute('data-prompt');
    handleSendMessage(prompt);
  });
});

newChatBtn.addEventListener('click', createNewSession);

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Hapus semua riwayat percakapan GARPITX AI?')) {
    sessions = [];
    saveSessions();
    createNewSession();
    showToast('Semua riwayat berhasil dihapus');
  }
});

// Mobile Sidebar Events
function openMobileSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('show');
}
function closeMobileSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}

openSidebarBtn.addEventListener('click', openMobileSidebar);
closeSidebarBtn.addEventListener('click', closeMobileSidebar);
sidebarOverlay.addEventListener('click', closeMobileSidebar);

// Init
renderSidebarHistory();
