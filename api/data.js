export default async function handler(req, res) {
    // تنظیمات CORS برای دسترسی امن فرانت‌اند
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const firebaseURL = 'https://freedom-mfe-default-rtdb.asia-southeast1.firebasedatabase.app/.json';
        const response = await fetch(firebaseURL);
        
        if (!response.ok) {
            throw new Error('خطا در دریافت اطلاعات از فایربیس');
        }

        const data = await response.json();
        return res.status(200).json(data || {});
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
