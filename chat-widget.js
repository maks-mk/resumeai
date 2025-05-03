document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('chat-toggle');
  const widget = document.getElementById('chat-widget');
  const closeBtn = document.getElementById('chat-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const msgs = document.getElementById('chat-messages');

  // Показать/скрыть виджет
  toggleBtn.addEventListener('click', () => {
    widget.style.display = widget.style.display === 'flex' ? 'none' : 'flex';
  });
  
  // Закрыть виджет
  closeBtn.addEventListener('click', () => {
    widget.style.display = 'none';
  });

  // Отправить сообщение
  sendBtn.addEventListener('click', sendMessage);
  
  // Отправка сообщения по Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Функция отправки сообщения
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // Добавляем сообщение пользователя в чат
    appendMessage('Вы', text);
    input.value = '';
    
    // Добавляем индикатор загрузки
    const loadingEl = document.createElement('div');
    loadingEl.className = 'loading-message';
    loadingEl.innerHTML = '<b>Ассистент:</b> ...';
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
      msgs.removeChild(loadingEl);
      
      // Добавляем ответ в чат
      appendMessage('Ассистент', formatResponse(data.response));
    } catch (error) {
      // Удаляем индикатор загрузки
      msgs.removeChild(loadingEl);
      
      // Показываем ошибку
      appendMessage('Система', `Произошла ошибка: ${error.message}`);
      console.error(error);
    }
    
    // Прокручиваем чат вниз
    msgs.scrollTop = msgs.scrollHeight;
  }

  // Добавление сообщения в чат
  function appendMessage(who, text) {
    const el = document.createElement('div');
    el.className = 'chat-message';
    el.innerHTML = `<b>${who}:</b> ${text}`;
    msgs.appendChild(el);
  }
  
  // Форматирование ответа (обработка переносов строк, списков)
  function formatResponse(text) {
    return text
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
});
