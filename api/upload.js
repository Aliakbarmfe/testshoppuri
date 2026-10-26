// api/upload.js
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
        const { image } = req.body; // تصویر به صورت Base64
        if (!image) {
            return res.status(400).json({ error: 'تصویری ارسال نشده است' });
        }

        const apiKey = '32b44cf4a92e03d876d7d02104feabfb';
        
        // پاک کردن پیشوند data:image/...;base64, در صورت وجود
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('image', base64Data);

        const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const data = await imgbbRes.json();

        if (data.success) {
            return res.status(200).json({
                success: true,
                url: data.data.url,
                display_url: data.data.display_url
            });
        } else {
            return res.status(500).json({ error: 'خطا در آپلود عکس در ImgBB', details: data });
        }
    } catch (err) {
        return res.status(500).json({ error: 'خطا در سرور واسطه', details: err.message });
    }
}
