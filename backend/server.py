import asyncio
import websockets
import json

from auth import handle_auth
from database import (
    find_user_by_phone,
    save_message,
    get_chat_history,
    get_conversations,
    delete_conversation,
)

clients = {}  # phone -> websocket

async def handler(ws):
    phone = None

    try:
        async for message in ws:
            data = json.loads(message)
            msg_type = data.get("type")

            # ==================================================
            # AUTH (LOGIN / REGISTER)
            # ==================================================
            if msg_type == "auth":
                res = handle_auth(data)
                await ws.send(json.dumps(res))

                if res.get("status") == "success" and res.get("action") == "login":
                    phone = res["phone"]
                    clients[phone] = ws
                continue

            # ==================================================
            # LOAD CONVERSATIONS
            # ==================================================
            if msg_type == "load_conversations":
                me = data.get("me")
                conversations = get_conversations(me)
                await ws.send(json.dumps({
                    "type": "conversation_list",
                    "conversations": conversations
                }))
                continue

            # ==================================================
            # SEARCH USER
            # ==================================================
            if msg_type == "search_user":
                search_phone = data.get("phone")
                user = find_user_by_phone(search_phone)

                if user:
                    await ws.send(json.dumps({
                        "type": "search_result",
                        "found": True,
                        "phone": user[0],
                        "full_name": user[1]
                    }))
                else:
                    await ws.send(json.dumps({
                        "type": "search_result",
                        "found": False
                    }))
                continue

            # ==================================================
            # LOAD CHAT HISTORY
            # ==================================================
            if msg_type == "load_chat":
                me = data.get("me")
                other = data.get("with")

                history = get_chat_history(me, other)
                await ws.send(json.dumps({
                    "type": "chat_history",
                    "messages": history
                }))
                continue

            if msg_type == "delete_conversation":
                me = data.get("me")
                other = data.get("with")

                delete_conversation(me, other)

                await ws.send(json.dumps({
                    "type": "conversation_deleted",
                    "with": other
                }))
                continue

            # ==================================================
            # PRIVATE CHAT
            # ==================================================
            if msg_type == "private_chat":
                sender = data.get("sender")
                receiver = data.get("receiver")
                content = data.get("content")
                time = data.get("time")

                # lưu DB và lấy id
                message_id = save_message(sender, receiver, content, time)

                msg = {
                    "type": "private_chat",
                    "id": message_id,
                    "sender": sender,
                    "receiver": receiver,
                    "content": content,
                    "time": time
                }

                # gửi cho người nhận nếu online
                if receiver in clients:
                    await clients[receiver].send(json.dumps(msg))

                # echo lại cho sender
                await ws.send(json.dumps(msg))
                continue

            # ==================================================
            # TYPING INDICATOR
            # ==================================================
            if msg_type == "typing":
                receiver = data.get("receiver")
                if receiver in clients:
                    await clients[receiver].send(json.dumps(data))
                continue

    except websockets.exceptions.ConnectionClosed:
        pass

    finally:
        if phone and phone in clients:
            del clients[phone]


async def main():
    async with websockets.serve(handler, "127.0.0.1", 8765):
        print("Server running at ws://127.0.0.1:8765")
        await asyncio.Future()

from database import init_db
init_db()  # 👈 BẮT BUỘC

asyncio.run(main())
