// Thay URL này bằng ws://localhost:8080 khi bạn của bạn chạy Backend nhé
const SERVER_URL = 'wss://echo.websocket.events'; 
const socket = new WebSocket(SERVER_URL);

const messageBox = document.getElementById('message-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// 1. Lắng nghe sự kiện nhận tin nhắn từ Server
socket.onmessage = (event) => {
    // Với server echo, tin nhắn nhận về là chính tin nhắn mình gửi
    // Trong bài tập thật, bạn có thể cần JSON.parse(event.data)
    renderMessage(event.data, 'received');
};

socket.onopen = () => {
    console.log("Connected to WebSocket Server");
};

// 2. Hàm gửi tin nhắn
function sendMessage() {
    const text = chatInput.value.trim();
    if (text !== "" && socket.readyState === WebSocket.OPEN) {
        // Tạo một đối tượng dữ liệu đầy đủ
        const msgObj = {
            sender: "User_A",
            content: text,
            time: new Date().toLocaleTimeString(),
            type: "chat"
        };
        
        // Chuyển thành chuỗi JSON để gửi đi qua mạng
        socket.send(JSON.stringify(msgObj)); 
        
        renderMessage(text, 'sent');
        chatInput.value = "";
    }
}

// 3. Hàm hiển thị tin nhắn lên giao diện
function renderMessage(text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('msg', type);
    msgDiv.innerText = text;
    messageBox.appendChild(msgDiv);
    updateLastMsg(text, true);
    
    const lastMsgElement = document.querySelector('.contact-item.active .last-msg');
    if (lastMsgElement) {
        lastMsgElement.innerText = text; 
    }
    // Tự động cuộn xuống dưới cùng
    messageBox.scrollTop = messageBox.scrollHeight;
}
function updateLastMsg(text, isMine) {
    const lastMsgElement = document.querySelector('.last-msg');
    if (lastMsgElement) {
        lastMsgElement.innerText = isMine ? `Bạn: ${text}` : text;
        lastMsgElement.style.fontWeight = isMine ? "normal" : "bold";
    }
}
// Sự kiện click nút gửi hoặc ấn Enter
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});