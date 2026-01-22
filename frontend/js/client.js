/* =====================================================
   GLOBAL STATE
===================================================== */
let socket = null;
let currentChatUser = null;
let contacts = {}; // phone -> { phone, fullName, element }

const currentUser = localStorage.getItem("currentUser");

const messageBox = document.getElementById("message-box");
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const searchInput = document.getElementById("search-phone");
const searchResultBox = document.getElementById("search-result");
const contactListEl = document.querySelector(".contact-list");

let lastSender = null;
let dateDividerAdded = false;
let typingTimeout = null;

/* =====================================================
   AUTH GUARD
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true" || !currentUser) {
        window.location.href = "login.html";
        return;
    }

    initSocket();
});

/* =====================================================
   SOCKET INIT
===================================================== */
function initSocket() {
    socket = new WebSocket("ws://127.0.0.1:8765");

    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: "load_conversations",
            me: currentUser
        }));
    };

    socket.onmessage = handleSocketMessage;
}

/* =====================================================
   SOCKET MESSAGE HANDLER
===================================================== */
function handleSocketMessage(event) {
    const data = JSON.parse(event.data);

    /* ===== TYPING ===== */
    if (data.type === "typing" && data.sender !== currentUser) {
        showTyping();
        return;
    }

    /* ===== SEARCH RESULT ===== */
    if (data.type === "search_result") {
        renderSearchResult(data);
        return;
    }


    /* ===== CONVERSATION LIST ===== */
    if (data.type === "conversation_list") {
        renderConversationList(data.conversations);
        return;
    }

    /* ===== CHAT HISTORY ===== */
    if (data.type === "chat_history") {
        messageBox.innerHTML = "";
        lastSender = null;
        dateDividerAdded = false;

        data.messages.forEach(msg => {
            renderMessage(msg, msg.sender === currentUser);
        });
        return;
    }

    /* ===== PRIVATE CHAT ===== */
    if (data.type === "private_chat") {
        hideTyping();
        addTodayDivider();

        const other =
            data.sender === currentUser
                ? currentChatUser
                : data.sender;

        ensureContact(other);
        updateLastMessage(other, data.content);

        if (other === currentChatUser) {
            renderMessage(data, data.sender === currentUser);
        }
        return;
    }

    /* ===== MESSAGE DELETED ===== */
    if (data.type === "message_deleted") {
        const msgEl = document.querySelector(
            `[data-message-id="${data.message_id}"]`
        );
        if (msgEl) msgEl.remove();
        return;
    }
}

/* =====================================================
   CONVERSATION LIST
===================================================== */
function renderConversationList(conversations) {
    contactListEl.innerHTML = "";
    contacts = {};

    conversations.forEach((c, index) => {
        ensureContact(c.phone, c.full_name);
        updateLastMessage(c.phone, c.last_message);

        if (index === 0) {
            openPrivateChat(c.phone, c.full_name);
        }
    });
}

/* =====================================================
   CONTACT LIST
===================================================== */
function ensureContact(phone, fullName = "") {
    if (!phone || contacts[phone]) return;

    const item = document.createElement("div");
    item.className = "contact-item";

    item.innerHTML = `
        <img src="https://hoanghamobile.com/tin-tuc/wp-content/uploads/2023/12/ten-nhom-chat.jpg" width="40">
        <div class="contact-info">
            <p class="name">${fullName || phone}</p>
            <p class="last-msg"></p>
        </div>

        <div class="contact-menu">⋮
            <div class="contact-menu-dropdown">
                <div class="delete-conversation">Xóa cuộc trò chuyện</div>
            </div>
        </div>
    `;

    const menu = item.querySelector(".contact-menu");
    const dropdown = item.querySelector(".contact-menu-dropdown");
    const delBtn = item.querySelector(".delete-conversation");

    menu.onclick = (e) => {
        e.stopPropagation();
        dropdown.style.display =
            dropdown.style.display === "block" ? "none" : "block";
    };

    delBtn.onclick = (e) => {
        e.stopPropagation();

        if (!confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) return;

        socket.send(JSON.stringify({
            type: "delete_conversation",
            me: currentUser,
            with: phone
        }));

        // xóa UI ngay
        item.remove();

        if (currentChatUser === phone) {
            messageBox.innerHTML = "";
            document.getElementById("chat-user-name").innerText = "";
            currentChatUser = null;
        }
    };

    item.onclick = () => openPrivateChat(phone, fullName);

    contactListEl.prepend(item);

    contacts[phone] = {
        phone,
        fullName: fullName || phone,
        element: item
    };
}

function updateLastMessage(phone, message) {
    const contact = contacts[phone];
    if (!contact) return;

    contact.element.querySelector(".last-msg").innerText = message;
    contactListEl.prepend(contact.element);
}

function setActiveContact(phone) {
    document.querySelectorAll(".contact-item")
        .forEach(el => el.classList.remove("active"));

    if (contacts[phone]) {
        contacts[phone].element.classList.add("active");
    }
}

/* =====================================================
   OPEN CHAT
===================================================== */
function openPrivateChat(phone, fullName = "") {
    currentChatUser = phone;

    ensureContact(phone, fullName);
    setActiveContact(phone);

    document.getElementById("chat-user-name").innerText =
        contacts[phone].fullName;

    messageBox.innerHTML = "";
    lastSender = null;
    dateDividerAdded = false;

    socket.send(JSON.stringify({
        type: "load_chat",
        me: currentUser,
        with: phone
    }));
}

/* =====================================================
   SEND MESSAGE
===================================================== */
sendBtn.onclick = sendMessage;
input.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

function sendMessage() {
    if (!socket || !currentChatUser) return;

    const text = input.value.trim();
    if (!text) return;

    ensureContact(currentChatUser);
    updateLastMessage(currentChatUser, text);

    socket.send(JSON.stringify({
        type: "private_chat",
        sender: currentUser,
        receiver: currentChatUser,
        content: text,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    }));

    input.value = "";
}

/* =====================================================
   TYPING
===================================================== */
const typingEl = document.createElement("div");
typingEl.className = "typing-indicator";
typingEl.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
messageBox.appendChild(typingEl);

function showTyping() {
    typingEl.style.display = "flex";
}

function hideTyping() {
    typingEl.style.display = "none";
}

input.addEventListener("input", () => {
    if (!socket || !currentChatUser) return;

    socket.send(JSON.stringify({
        type: "typing",
        sender: currentUser,
        receiver: currentChatUser
    }));

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(hideTyping, 1500);
});

/* =====================================================
   RENDER MESSAGE (WITH DELETE)
===================================================== */
function renderMessage(data, isMine) {
    const isSameSender = data.sender === lastSender;

    const row = document.createElement("div");
    row.className = `chat-row ${isMine ? "mine" : "other"} ${isSameSender ? "continued" : ""}`;
    row.dataset.messageId = data.id;

    if (!isMine) {
        if (!isSameSender) {
            const avatar = document.createElement("div");
            avatar.className = "chat-avatar";
            avatar.innerText = data.sender.charAt(0).toUpperCase();
            row.appendChild(avatar);
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "chat-avatar-placeholder";
            row.appendChild(placeholder);
        }

        const wrap = document.createElement("div");
        wrap.className = "chat-content-wrap";

        const bubble = createBubble(data, false);
        wrap.appendChild(bubble);
        row.appendChild(wrap);
    } else {
        const bubble = createBubble(data, true);
        row.appendChild(bubble);
    }

    messageBox.appendChild(row);
    messageBox.scrollTop = messageBox.scrollHeight;
    lastSender = data.sender;
}

function createBubble(data, isMine) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isMine ? "mine-bubble" : "other-bubble"}`;
    bubble.dataset.messageId = data.id;

    bubble.innerHTML = `
        <div class="chat-text">${data.content}</div>
        <div class="chat-time">${data.time}</div>
    `;

    if (isMine) {
        const del = document.createElement("span");
        del.className = "delete-btn";
        del.innerText = "🗑️";
        del.onclick = () => {
            socket.send(JSON.stringify({
                type: "delete_message",
                message_id: data.id,
                me: currentUser
            }));
        };
        bubble.appendChild(del);
    }

    return bubble;
}

/* =====================================================
   DATE DIVIDER
===================================================== */
function addTodayDivider() {
    if (dateDividerAdded) return;

    const divider = document.createElement("div");
    divider.className = "date-divider";
    divider.innerText = "Hôm nay";
    messageBox.appendChild(divider);

    dateDividerAdded = true;
}

/* =====================================================
   LOGOUT
===================================================== */
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}

function renderSearchResult(data) {
    if (!data.found) {
        searchResultBox.innerHTML = "";
        searchResultBox.style.display = "none";
        return;
    }

    searchResultBox.innerHTML = `
        <div class="search-user-item">
            <div class="avatar">
                ${data.full_name.charAt(0).toUpperCase()}
            </div>
            <div class="info">
                <div class="name">${data.full_name}</div>
                <div class="phone">${data.phone}</div>
            </div>
        </div>
    `;

    searchResultBox.style.display = "block";

    searchResultBox.querySelector(".search-user-item").onclick = () => {
        searchResultBox.style.display = "none";
        searchInput.value = "";
        openPrivateChat(data.phone, data.full_name);
    };
}

/* =====================================================
   SEARCH USER (BẮT BUỘC PHẢI CÓ)
===================================================== */
searchInput.addEventListener("input", () => {
    const phone = searchInput.value.trim();

    if (!/^0\d{9}$/.test(phone)) {
        searchResultBox.innerHTML = "";
        searchResultBox.style.display = "none";
        return;
    }

    // ⛔ socket đã bị đóng
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("Socket not open, reconnecting...");
        initSocket();
        setTimeout(() => searchInput.dispatchEvent(new Event("input")), 100); // ✅ DÒNG NÀY
        return;
    }


    socket.send(JSON.stringify({
        type: "search_user",
        phone
    }));
});

function initSocket() {
    socket = new WebSocket("ws://127.0.0.1:8765");

    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: "load_conversations",
            me: currentUser
        }));
    };

    socket.onmessage = handleSocketMessage;

    socket.onclose = () => {
        console.warn("Socket closed");
    };
}





