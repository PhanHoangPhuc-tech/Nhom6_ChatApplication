import sqlite3

DB_NAME = "users.db"


def get_connection():
    return sqlite3.connect(DB_NAME)


def init_db():
    conn = get_connection()
    c = conn.cursor()

    # USERS
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE,
            fullname TEXT,
            password TEXT
        )
    """)

    # MESSAGES
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            receiver TEXT,
            content TEXT,
            time TEXT
        )
    """)

    # DELETED CONVERSATIONS (XÓA 1 PHÍA)
    c.execute("""
        CREATE TABLE IF NOT EXISTS deleted_conversations (
            user TEXT,
            other TEXT,
            PRIMARY KEY (user, other)
        )
    """)

    conn.commit()
    conn.close()


# ================= USER =================
def create_user(phone, fullname, password):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO users (phone, fullname, password) VALUES (?, ?, ?)",
            (phone, fullname, password)
        )
        conn.commit()
        return True
    except:
        return False
    finally:
        conn.close()


def find_user_by_phone(phone):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT phone, fullname FROM users WHERE phone = ?", (phone,))
    user = c.fetchone()
    conn.close()
    return user


def check_login(phone, password):
    conn = get_connection()
    c = conn.cursor()
    c.execute(
        "SELECT phone, fullname FROM users WHERE phone = ? AND password = ?",
        (phone, password)
    )
    user = c.fetchone()
    conn.close()
    return user


# ================= MESSAGE =================
def save_message(sender, receiver, content, time):
    """
    Lưu tin nhắn mới
    Đồng thời: nếu trước đó sender đã xóa cuộc chat thì KHÔI PHỤC lại
    """
    conn = get_connection()
    c = conn.cursor()

    # nếu sender từng xóa chat với receiver → khôi phục
    c.execute("""
        DELETE FROM deleted_conversations
        WHERE user = ? AND other = ?
    """, (sender, receiver))

    c.execute(
        "INSERT INTO messages (sender, receiver, content, time) VALUES (?, ?, ?, ?)",
        (sender, receiver, content, time)
    )

    message_id = c.lastrowid
    conn.commit()
    conn.close()
    return message_id


def load_messages(user1, user2):
    conn = get_connection()
    c = conn.cursor()

    # nếu user1 đã xóa chat với user2 → không load gì
    c.execute("""
        SELECT 1 FROM deleted_conversations
        WHERE user = ? AND other = ?
    """, (user1, user2))
    if c.fetchone():
        conn.close()
        return []

    c.execute("""
        SELECT id, sender, receiver, content, time
        FROM messages
        WHERE (sender=? AND receiver=?)
           OR (sender=? AND receiver=?)
        ORDER BY id
    """, (user1, user2, user2, user1))

    rows = c.fetchall()
    conn.close()
    return rows


def get_chat_history(user1, user2):
    rows = load_messages(user1, user2)
    return [
        {
            "id": r[0],
            "sender": r[1],
            "content": r[3],
            "time": r[4]
        }
        for r in rows
    ]


# ================= DELETE CONVERSATION (1 PHÍA) =================
def delete_conversation(user, other):
    """
    Xóa cuộc trò chuyện CHỈ phía user
    """
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        INSERT OR IGNORE INTO deleted_conversations (user, other)
        VALUES (?, ?)
    """, (user, other))

    conn.commit()
    conn.close()
    return True


# ================= CONVERSATION LIST =================
def get_conversations(user_phone):
    """
    Trả về danh sách các cuộc chat CHƯA bị user xóa
    """
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        SELECT
            CASE
                WHEN sender = ? THEN receiver
                ELSE sender
            END AS other_user,
            content,
            time,
            id
        FROM messages
        WHERE sender = ? OR receiver = ?
        ORDER BY id DESC
    """, (user_phone, user_phone, user_phone))

    rows = c.fetchall()

    conversations = {}
    for other, content, time, _ in rows:
        # bỏ qua nếu user đã xóa cuộc chat này
        c.execute("""
            SELECT 1 FROM deleted_conversations
            WHERE user = ? AND other = ?
        """, (user_phone, other))
        if c.fetchone():
            continue

        if other not in conversations:
            conversations[other] = {
                "phone": other,
                "last_message": content,
                "time": time
            }

    result = []
    for phone, convo in conversations.items():
        c.execute(
            "SELECT fullname FROM users WHERE phone = ?",
            (phone,)
        )
        user = c.fetchone()
        result.append({
            "phone": phone,
            "full_name": user[0] if user else phone,
            "last_message": convo["last_message"],
            "time": convo["time"]
        })

    conn.close()
    return result
