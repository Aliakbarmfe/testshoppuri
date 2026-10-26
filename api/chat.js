// api/chat.js
const FIREBASE_URL = "https://freedom-mfe-default-rtdb.asia-southeast1.firebasedatabase.app";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { action, username } = req.query;

            if (action === 'get_users') {
                const response = await fetch(`${FIREBASE_URL}/support_chats.json`);
                const data = await response.json() || {};
                const users = Object.keys(data).map(user => {
                    const messages = data[user] || {};
                    const msgList = Object.values(messages);
                    const lastMsg = msgList[msgList.length - 1] || {};
                    let lastText = lastMsg.text || '';
                    if (!lastText && lastMsg.imageUrl) lastText = '[عکس]';
                    return {
                        username: user,
                        lastMessage: lastText,
                        lastTime: lastMsg.timestamp || ''
                    };
                });
                return res.status(200).json({ success: true, users });
            }

            if (action === 'get_messages' && username) {
                const response = await fetch(`${FIREBASE_URL}/support_chats/${username}.json`);
                const messages = await response.json() || {};
                return res.status(200).json({ success: true, messages });
            }

            return res.status(400).json({ error: 'دستور نامعتبر است' });
        }

        if (req.method === 'POST') {
            const { username, text, sender, imageUrl } = req.body;

            if (!username || (!text && !imageUrl) || !sender) {
                return res.status(400).json({ error: 'اطلاعات ناقص است' });
            }

            const newMessage = {
                sender: sender, // 'user' یا 'admin'
                text: text || '',
                imageUrl: imageUrl || null,
                timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            };

            const response = await fetch(`${FIREBASE_URL}/support_chats/${username}.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage)
            });

            if (response.ok) {
                return res.status(200).json({ success: true, message: newMessage });
            } else {
                return res.status(500).json({ error: 'خطا در ذخیره پیام' });
            }
        }
    } catch (err) {
        return res.status(500).json({ error: 'خطا در برقراری ارتباط با فایربیس', details: err.message });
    }
}
