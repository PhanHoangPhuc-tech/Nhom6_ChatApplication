/* =====================================================
   GLOBAL SOCKET (AUTH)
===================================================== */
let socket = null;

/* =====================================================
   INIT SOCKET FOR AUTH PAGES
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const isLoginPage = document.getElementById("login-phone");
    const isRegisterPage = document.getElementById("reg-phone");

    // chỉ init socket khi ở login / register
    if (isLoginPage || isRegisterPage) {
        initAuthSocket();
    }

    // nếu đã login rồi thì không cho quay lại login
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const currentUser = localStorage.getItem("currentUser");

    if (isLoggedIn === "true" && currentUser && isLoginPage) {
        window.location.href = "index.html";
    }
});

/* =====================================================
   INIT AUTH SOCKET
===================================================== */
function initAuthSocket() {
    socket = new WebSocket("ws://127.0.0.1:8765");

    socket.onopen = () => {
        console.log("Auth socket connected");
    };

    socket.onmessage = (event) => {
        const res = JSON.parse(event.data);

        /* ===== LOGIN SUCCESS ===== */
        if (res.status === "success" && res.action === "login") {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", res.phone);

            window.location.href = "index.html";
            return;
        }

        /* ===== REGISTER SUCCESS ===== */
        if (res.status === "success" && res.action === "register") {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            window.location.href = "login.html";
            return;
        }

        /* ===== ERROR ===== */
        if (res.status === "error") {
            alert(res.message || "Có lỗi xảy ra");
        }
    };

    socket.onclose = () => {
        console.log("Auth socket closed");
    };
}

/* =====================================================
   LOGIN
===================================================== */
function handleLogin() {
    const phoneInput = document.getElementById("login-phone");
    const passInput = document.getElementById("login-pass");

    if (!phoneInput || !passInput) return;

    const phone = phoneInput.value.trim();
    const password = passInput.value.trim();

    if (!phone || !password) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    socket.send(JSON.stringify({
        type: "auth",
        action: "login",
        phone: phone,
        password: password
    }));
}

/* =====================================================
   REGISTER
===================================================== */
function handleRegister() {
    const phoneInput = document.getElementById("reg-phone");
    const nameInput = document.getElementById("reg-name");
    const passInput = document.getElementById("reg-pass");
    const repassInput = document.getElementById("reg-repass");

    if (!phoneInput || !nameInput || !passInput || !repassInput) return;

    const phone = phoneInput.value.trim();
    const fullname = nameInput.value.trim();
    const password = passInput.value.trim();
    const repass = repassInput.value.trim();

    if (!phone || !fullname || !password || !repass) {
        alert("Vui lòng nhập đầy đủ thông tin");
        return;
    }

    if (!/^0\d{9}$/.test(phone)) {
        alert("Số điện thoại không hợp lệ");
        return;
    }

    if (password !== repass) {
        alert("Mật khẩu không khớp");
        return;
    }

    socket.send(JSON.stringify({
        type: "auth",
        action: "register",
        phone: phone,
        full_name: fullname,
        password: password
    }));
}

/* =====================================================
   LOGOUT (DỰ PHÒNG – KHÔNG DÙNG Ở INDEX)
===================================================== */
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
}
