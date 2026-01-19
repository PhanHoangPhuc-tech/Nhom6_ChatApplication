const SERVER_URL = 'wss://echo.websocket.events'; 
const socket = new WebSocket(SERVER_URL);

const messageBox = document.getElementById('message-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

// 1. Lắng nghe sự kiện nhận tin nhắn từ Server
socket.onmessage = (event) => {
    
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
function logout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        // Xóa thông tin user đã lưu
        localStorage.removeItem('currentUser');
        
        // Nếu đang có kết nối WebSocket thì đóng lại
        if (socket) {
            socket.close();
        }
        
        // Chuyển về trang đăng nhập
        window.location.href = 'login.html';
    }
}

// Bổ sung: Hiển thị tên user từ LocalStorage lên tiêu đề nếu cần
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('currentUser');
    if (user) {
        console.log("Đang đăng nhập với tên:", user);
        // Bạn có thể đổi avatar hoặc tên hiển thị ở đây
    }
});
// Lấy thẻ avatar ở thanh menu bên trái
const menuAvatar = document.querySelector('.menu-avatar');
const modal = document.getElementById('user-info-modal');

// Khi nhấn vào Avatar
if (menuAvatar) {
    menuAvatar.onclick = function() {
        const currentUser = localStorage.getItem('currentUser') || "Người dùng";
        document.getElementById('display-name').innerText = currentUser;
        modal.style.display = "block";
    }
}

// Đóng modal
function closeModal() {
    modal.style.display = "none";
}

// Đóng modal khi nhấn ra ngoài vùng trắng
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}
// Hàm mở modal và đổ dữ liệu hiện tại vào input
function openUserInfo() {
    const modal = document.getElementById('user-info-modal');
    const currentUser = localStorage.getItem('currentUser') || "Người dùng";
    const currentPhone = localStorage.getItem('userPhone') || "0123 456 789";
    
    document.getElementById('edit-name').value = currentUser;
    document.getElementById('edit-phone').value = currentPhone;
    
    modal.style.display = "block";
}

// Hàm Lưu thông tin
function saveUserInfo() {
    const newName = document.getElementById('edit-name').value;
    const newPhone = document.getElementById('edit-phone').value;
    const newDob = document.getElementById('edit-dob').value;

    if (newName.trim() === "") {
        alert("Tên không được để trống!");
        return;
    }

    // 1. Lưu vào LocalStorage
    localStorage.setItem('currentUser', newName);
    localStorage.setItem('userPhone', newPhone);
    localStorage.setItem('userDob', newDob);

    // 2. Cập nhật ngay lập tức lên giao diện (nếu có chỗ hiển thị tên)
    alert("Cập nhật thông tin thành công!");
    
    // 3. Đóng modal
    closeModal();
    
    // Tùy chọn: Refresh nhẹ trang hoặc cập nhật DOM để thấy tên mới
    location.reload(); 
}

// Gán lại sự kiện click cho avatar ở menu trái
document.querySelector('.menu-avatar').onclick = openUserInfo;