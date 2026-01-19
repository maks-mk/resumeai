document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chat-toggle');
  const widget = document.getElementById('chat-widget');
  const closeBtn = document.getElementById('chat-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const msgs = document.getElementById('chat-messages');

  // Открытие виджета
  toggleBtn.addEventListener('click', () => {
    // Переключаем видимость (flex/none)
    widget.style.display = widget.style.display === 'flex' ? 'none' : 'flex';
    // Фокус в поле ввода при открытии
    if (widget.style.display === 'flex') {
        input.focus();
    }
  });
  
  // Закрытие виджета
  closeBtn.addEventListener('click', () => {
    widget.style.display = 'none';
  });

  // Обработчики отправки
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // 1. Показываем сообщение пользователя
    appendMessage('Вы', text);
    input.value = '';
    
    // 2. Показываем индикатор загрузки
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-message';
    loadingEl.innerHTML = '<em>Печатает...</em>';
    msgs.appendChild(loadingEl);
    scrollToBottom();
    
    try {
      // Автоматическое переключение между локальным и продакшн API
      const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/chat'
        : 'https://maksresume.onrender.com/chat'; // <-- Убедитесь, что этот адрес верный

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: text })
      });
      
      if (!res.ok) {
        throw new Error(`Ошибка сервера: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Удаляем "Печатает..."
      msgs.removeChild(loadingEl);
      
      // 3. Показываем ответ AI
      appendMessage('Ассистент', formatResponse(data.response));
      
    } catch (error) {
      if (msgs.contains(loadingEl)) msgs.removeChild(loadingEl);
      
      appendMessage(
        'Система',
        '<span style="color: red;">Сервер временно недоступен. Попробуйте позже.</span>'
      );
      console.error(error);
    }
    
    scrollToBottom();
  }

  function appendMessage(who, text) {
    const el = document.createElement('div');
    // Добавляем класс в зависимости от того, кто пишет (для стилизации CSS)
    el.className = who === 'Вы' ? 'chat-message user-msg' : 'chat-message bot-msg';
    
    // Простейшая защита от HTML-инъекций для "Вы", но разрешаем HTML для бота
    if (who === 'Вы') {
        el.textContent = text;
        // Можно добавить префикс жирным, если нужно
        el.innerHTML = `<b>Вы:</b> ${el.innerHTML}`;
    } else {
        el.innerHTML = `<b>Максим (AI):</b> ${text}`;
    }
    
    msgs.appendChild(el);
  }
  
  function scrollToBottom() {
      msgs.scrollTop = msgs.scrollHeight;
  }
  
  // Простой парсер Markdown для красоты ответов
  function formatResponse(text) {
    return text
      // Жирный шрифт (**текст**)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Курсив (*текст*)
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Списки (- пункт)
      .replace(/^- (.*$)/gim, '• $1')
      // Переносы строк
      .replace(/\n/g, '<br>');
  }
});