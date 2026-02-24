document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chat-toggle');
  const widget = document.getElementById('chat-widget');
  const closeBtn = document.getElementById('chat-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const msgs = document.getElementById('chat-messages');

  // Открытие виджета
  toggleBtn.addEventListener('click', () => {
    // Переключаем видимость
    widget.classList.toggle('active');
    if (widget.classList.contains('active')) {
        input.focus();
    }
  });
  
  // Закрытие виджета
  closeBtn.addEventListener('click', () => {
    widget.classList.remove('active');
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
    appendMessage('user', text);
    input.value = '';
    
    // 2. Показываем начальный индикатор загрузки
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-message bot-msg terminal-loading';
    loadingEl.innerHTML = '<span class="prompt bot-prompt">[AI_CORE] //></span> <span class="blink">█</span>';
    msgs.appendChild(loadingEl);
    scrollToBottom();
    
    try {
      const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/chat'
        : 'https://maksresume.onrender.com/chat';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: text })
      });
      
      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
      
      // Удаляем "мигающий" начальный блок загрузки
      msgs.removeChild(loadingEl);
      
      // 3. Создаем пустой элемент для ответа бота, который будем пополнять
      const botMsgEl = document.createElement('div');
      botMsgEl.className = 'chat-message bot-msg';
      msgs.appendChild(botMsgEl);
      
      // Настраиваем чтение потока
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";
      const promptHtml = '<span class="prompt bot-prompt">[AI_CORE] //></span> ';

      // 4. Читаем данные по мере их поступления
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // Поток завершен
        
        // Декодируем байты в текст ({stream: true} важно для корректной обработки кириллицы)
        fullResponse += decoder.decode(value, { stream: true });
        
        // Обновляем HTML на лету (и добавляем каретку в конец для красоты)
        botMsgEl.innerHTML = promptHtml + formatResponse(fullResponse) + '<span class="blink">█</span>';
        scrollToBottom();
      }
      
      // 5. Когда поток завершен, убираем мигающую каретку в конце
      botMsgEl.innerHTML = promptHtml + formatResponse(fullResponse);
      
    } catch (error) {
      if (msgs.contains(loadingEl)) msgs.removeChild(loadingEl);
      
      appendMessage('system', '<span style="color: #ff2a6d; text-shadow: 0 0 8px #ff2a6d;">[SYS_ERROR] Connection refused. Server offline.</span>');
      console.error(error);
    }
    
    scrollToBottom();
  }

  function appendMessage(role, text) {
    const el = document.createElement('div');
    el.className = `chat-message ${role}-msg`;
    
    let prompt = '';
    if (role === 'user') {
        prompt = '<span class="prompt user-prompt">[USER_AUTH] //></span> ';
        el.innerHTML = `${prompt}${text}`;
    } else if (role === 'bot') {
        prompt = '<span class="prompt bot-prompt">[AI_CORE] //></span> ';
        el.innerHTML = `${prompt}${text}`;
    } else {
        el.innerHTML = text; // Для системных ошибок
    }
    
    msgs.appendChild(el);
  }
  
  function scrollToBottom() {
      msgs.scrollTop = msgs.scrollHeight;
  }
  
  function formatResponse(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="neon-text">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<span class="list-bullet">>></span> $1')
      .replace(/\n/g, '<br>');
  }
});