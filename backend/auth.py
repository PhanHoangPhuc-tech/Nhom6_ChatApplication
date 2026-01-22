from database import create_user, check_login


def handle_auth(data):
    """
    Xử lý đăng ký và đăng nhập
    data nhận từ client:
    {
        type: "auth",
        action: "login" | "register",
        phone: "...",
        full_name: "...",   # chỉ có khi register
        password: "..."
    }
    """

    action = data.get("action")
    phone = data.get("phone")
    full_name = data.get("full_name")
    password = data.get("password")

    # =====================================================
    # REGISTER
    # =====================================================
    if action == "register":
        # validate
        if not phone or not full_name or not password:
            return {
                "status": "error",
                "message": "Vui lòng nhập đầy đủ thông tin"
            }

        # tạo user
        success = create_user(phone, full_name, password)

        if success:
            return {
                "status": "success",
                "action": "register",
                "message": "Đăng ký thành công"
            }

        return {
            "status": "error",
            "message": "Số điện thoại đã tồn tại"
        }

    # =====================================================
    # LOGIN
    # =====================================================
    if action == "login":
        if not phone or not password:
            return {
                "status": "error",
                "message": "Vui lòng nhập số điện thoại và mật khẩu"
            }

        user = check_login(phone, password)

        if user:
            # user = (phone, fullname)
            return {
                "status": "success",
                "action": "login",
                "phone": user[0],
                "full_name": user[1],
                "message": "Đăng nhập thành công"
            }

        return {
            "status": "error",
            "message": "Sai số điện thoại hoặc mật khẩu"
        }

    # =====================================================
    # UNKNOWN ACTION
    # =====================================================
    return {
        "status": "error",
        "message": "Yêu cầu không hợp lệ"
    }
