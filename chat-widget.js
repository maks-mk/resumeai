'use strict';
(() => {
  const launcher = document.getElementById('chat-toggle');
  const widget = document.getElementById('chat-widget');
  const close = document.getElementById('chat-close');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');
  const form = document.getElementById('chat-input-area');
  const messages = document.getElementById('chat-messages');
  const status = document.getElementById('chat-status');
  let waiting = false;
  let started = false;
  let activeController;
  const API_URL = window.MK_CHAT_API_URL || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000/chat' : 'https://maksresume.onrender.com/chat');
  launcher.addEventListener('click', () => { window.ResumeUI.openDialog(widget); launcher.setAttribute('aria-expanded', 'true'); if (!waiting) input.focus(); });
  close.addEventListener('click', () => window.ResumeUI.closeDialog(widget));
  widget.addEventListener('close', () => { launcher.setAttribute('aria-expanded', 'false'); if (!document.querySelector('dialog[open]')) launcher.focus(); });
  function scrollBottom() { messages.scrollTop = messages.scrollHeight; }
  function setWaiting(state) { waiting = state; send.disabled = state; input.disabled = state; messages.setAttribute('aria-busy', String(state)); status.textContent = state ? 'Готовлю ответ…' : 'Об опыте, навыках и проектах'; send.setAttribute('aria-label', state ? 'Ожидание ответа' : 'Отправить сообщение'); }
  function safeFormat(text) { return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }
  function append(role, text, error = false) {
    const item = document.createElement('div'); item.className = `chat-message ${role}${error ? ' error' : ''}`;
    const author = document.createElement('span'); author.className = 'chat-message-author'; author.textContent = role === 'user' ? 'Вы' : (error ? 'Нет подключения' : 'AI-ассистент');
    const bubble = document.createElement('div'); bubble.className = 'chat-bubble';
    if (role === 'user') bubble.textContent = text; else bubble.innerHTML = safeFormat(text);
    item.append(author, bubble); messages.appendChild(item); scrollBottom(); return { item, bubble };
  }
  document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.question; sendMessage(); }));
  form.addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
  async function sendMessage() {
    if (waiting) return;
    const text = input.value.trim(); if (!text) return;
    if (!started) { messages.replaceChildren(); started = true; }
    append('user', text); input.value = ''; setWaiting(true);
    const loading = document.createElement('div'); loading.className = 'chat-loading'; loading.textContent = 'Ассистент готовит ответ…'; messages.appendChild(loading); scrollBottom();
    const controller = new AbortController(); activeController = controller;
    const timeout = setTimeout(() => controller.abort(), 45000);
    let responseBlock;
    let full = '';
    try {
      const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }), signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      loading.remove();
      responseBlock = append('bot', '');
      const type = response.headers.get('content-type') || '';
      if (type.includes('application/json')) {
        const result = await response.json(); full = typeof result === 'string' ? result : (result.response || result.answer || result.message || '');
        if (typeof full !== 'string') full = '';
        responseBlock.bubble.innerHTML = safeFormat(full);
      } else if (response.body) {
        const reader = response.body.getReader(); const decoder = new TextDecoder('utf-8');
        while (true) { const { value, done } = await reader.read(); if (done) break; full += decoder.decode(value, { stream: true }); responseBlock.bubble.innerHTML = safeFormat(full); scrollBottom(); }
        full += decoder.decode(); responseBlock.bubble.innerHTML = safeFormat(full);
      } else { full = await response.text(); responseBlock.bubble.innerHTML = safeFormat(full); }
      if (!full.trim()) throw new Error('Empty response');
    } catch (_) {
      loading.remove();
      if (responseBlock && !full.trim()) responseBlock.item.remove();
      append('bot', full.trim() ? 'Соединение прервалось. Ответ может быть неполным. Попробуйте задать вопрос ещё раз.' : 'Сейчас AI-сервис недоступен. Попробуйте позже или свяжитесь с Максимом напрямую: @Maxinik в Telegram, maks_k77@mail.ru.', true);
    } finally { clearTimeout(timeout); activeController = null; setWaiting(false); scrollBottom(); if (widget.open) input.focus(); }
  }
  addEventListener('pagehide', () => { if (activeController) activeController.abort(); });
})();
