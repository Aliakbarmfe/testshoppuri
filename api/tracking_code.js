const FIREBASE_URL = "https://freedom-mfe-default-rtdb.asia-southeast1.firebasedatabase.app";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { count } = req.body;
        const numItems = parseInt(count) || 1;

        // دریافت آخرین عدد تولیدشده از فایربیس
        const response = await fetch(`${FIREBASE_URL}/settings/last_tracking_code.json`);
        let lastCode = await response.json();

        // اگر هنوز عددی ثبت نشده بود، از 999 شروع می‌کنیم تا اولین عدد 1000 باشد
        if (lastCode === null || lastCode === undefined || isNaN(lastCode)) {
            lastCode = 999;
        }

        const startCode = lastCode + 1;
        const newLastCode = lastCode + numItems;

        // ذخیره آخرین عدد جدید در فایربیس
        const updateRes = await fetch(`${FIREBASE_URL}/settings/last_tracking_code.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLastCode)
        });

        if (!updateRes.ok) {
            return res.status(500).json({ error: 'خطا در بروزرسانی کد رهگیری در فایربیس' });
        }

        // تولید آرایه‌ای از کدهای رهگیری عددی اختصاص‌یافته به تعداد محصولات
        const codes = [];
        for (let i = 0; i < numItems; i++) {
            codes.push((startCode + i).toString());
        }

        return res.status(200).json({ success: true, codes });
    } catch (err) {
        return res.status(500).json({ error: 'خطا در برقراری ارتباط با فایربیس', details: err.message });
    }
}
 
