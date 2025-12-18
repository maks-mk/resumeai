document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chat-toggle');
  const widget = document.getElementById('chat-widget');
  const closeBtn = document.getElementById('chat-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const msgs = document.getElementById('chat-messages');

  if (!toggleBtn || !widget || !closeBtn || !sendBtn || !input || !msgs) return;

  function setWidgetOpen(isOpen) {
    widget.style.display = isOpen ? 'flex' : 'none';
    widget.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', isOpen ? 'Закрыть чат' : 'Открыть чат');
    if (isOpen) input.focus();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Показать/скрыть виджет
  toggleBtn.addEventListener('click', () => {
    const isOpen = widget.style.display === 'flex';
    setWidgetOpen(!isOpen);
  });
  
  // Закрыть виджет
  closeBtn.addEventListener('click', () => {
    setWidgetOpen(false);
  });

  // Отправить сообщение
  sendBtn.addEventListener('click', sendMessage);
  
  // Отправка сообщения по Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Закрытие по Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.style.display === 'flex') {
      setWidgetOpen(false);
    }
  });

  // Инициализация ARIA-состояний
  if (!toggleBtn.hasAttribute('aria-expanded')) toggleBtn.setAttribute('aria-expanded', 'false');
  if (!widget.hasAttribute('aria-hidden')) widget.setAttribute('aria-hidden', 'true');

  // Функция отправки сообщения
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // Добавляем сообщение пользователя в чат
    appendMessage('Вы', text, { isHtml: false });
    input.value = '';

    sendBtn.disabled = true;
    input.disabled = true;
    
    // Добавляем индикатор загрузки
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-message';
    const loadingWho = document.createElement('b');
    loadingWho.textContent = 'Ассистент:';
    const loadingText = document.createElement('span');
    loadingText.textContent = ' ...';
    loadingEl.appendChild(loadingWho);
    loadingEl.appendChild(loadingText);
    msgs.appendChild(loadingEl);
    msgs.scrollTop = msgs.scrollHeight;
    
    try {
      // Отправляем запрос на сервер
      const res = await fetch('https://maksresume.onrender.com/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: text})
      });
      
      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Удаляем индикатор загрузки
      if (loadingEl.parentNode === msgs) msgs.removeChild(loadingEl);
      
      // Добавляем ответ в чат
      appendMessage('Ассистент', formatResponse(data.response), { isHtml: true });
    } catch (error) {
      // Удаляем индикатор загрузки
      if (loadingEl.parentNode === msgs) msgs.removeChild(loadingEl);
      
      // Показываем ошибку
      appendMessage('Система', `Произошла ошибка: ${error.message}`, { isHtml: false });
      console.error(error);
    } finally {
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    }
    
    // Прокручиваем чат вниз
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Добавление сообщения в чат
  function appendMessage(who, text, options) {
    const { isHtml } = options || { isHtml: false };
    const el = document.createElement('div');
    el.className = 'chat-message';

    const whoEl = document.createElement('b');
    whoEl.textContent = `${who}:`;
    const contentEl = document.createElement('span');
    contentEl.className = 'chat-message-content';

    if (isHtml) {
      contentEl.innerHTML = text;
    } else {
      contentEl.textContent = ` ${text}`;
    }

    el.appendChild(whoEl);
    el.appendChild(contentEl);
    msgs.appendChild(el);
  }
  
  // Форматирование ответа (обработка переносов строк, списков)
  function formatResponse(text) {
    const safe = escapeHtml(text ?? '');
    return safe
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
});
