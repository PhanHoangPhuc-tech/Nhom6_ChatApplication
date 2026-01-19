// Xử lý Đăng nhập
function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user && pass) {
        
        console.log("Đang xác thực...");
        // Lưu tên user vào bộ nhớ tạm để sang trang chat hiển thị
        localStorage.setItem('currentUser', user);
        window.location.href = 'index.html'; // Chuyển sang trang chat
    } else {
        alert("Vui lòng nhập đầy đủ!");
    }
}

// Xử lý Đăng ký
function handleRegister() {
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    const repass = document.getElementById('reg-repass').value;

    if (user && pass === repass) {
        alert("Đăng ký thành công! Hãy đăng nhập.");
        window.location.href = 'login.html';
    } else {
        alert("Mật khẩu không khớp hoặc thông tin trống!");
    }
}
