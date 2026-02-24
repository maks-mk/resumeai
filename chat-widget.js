document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chat-toggle');
    const widget = document.getElementById('chat-widget');
    const closeBtn = document.getElementById('chat-close');
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');
    const msgs = document.getElementById('chat-messages');
  
    // Открытие/закрытие
    toggleBtn.addEventListener('click', () => {
        widget.classList.add('active');
        input.focus();
    });
    closeBtn.addEventListener('click', () => widget.classList.remove('active'));
  
    // Отправка
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
  
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
      
        appendMessage('user', text);
        input.value = '';
      
        // Индикатор набора текста
        const loadingEl = document.createElement('div');
        loadingEl.className = 'msg-wrapper bot';
        loadingEl.innerHTML = `<div class="chat-bubble bot-bubble typing-indicator"><span></span><span></span><span></span></div>`;
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
            
            msgs.removeChild(loadingEl);
            
            // Создаем блок для стриминга ответа
            const wrapperEl = document.createElement('div');
            wrapperEl.className = 'msg-wrapper bot';
            const bubbleEl = document.createElement('div');
            bubbleEl.className = 'chat-bubble bot-bubble';
            wrapperEl.appendChild(bubbleEl);
            msgs.appendChild(wrapperEl);
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let fullResponse = "";
  
            while (true) {
                const { done, value } = await reader.read();
                if (done) break; 
                fullResponse += decoder.decode(value, { stream: true });
                bubbleEl.innerHTML = formatResponse(fullResponse);
                scrollToBottom();
            }
        } catch (error) {
            if (msgs.contains(loadingEl)) msgs.removeChild(loadingEl);
            appendMessage('bot', '<span style="color: #ef4444;">Ошибка подключения. AI сервер временно недоступен.</span>');
            console.error(error);
        }
        scrollToBottom();
    }
  
    function appendMessage(role, text) {
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}-bubble`;
        bubble.innerHTML = formatResponse(text);
        
        wrapper.appendChild(bubble);
        msgs.appendChild(wrapper);
    }
    
    function scrollToBottom() {
        msgs.scrollTop = msgs.scrollHeight;
    }
    
    function formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gim, '• $1')
            .replace(/\n/g, '<br>');
    }
});