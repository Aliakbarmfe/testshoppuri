export default async function handler(req, res) {
  // تنظیم هدرهای CORS برای دسترسی امن
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'مسیر (path) مشخص نشده است.' });
  }

  // آدرس دیتابیس فایربیس شما
  const databaseURL = 'https://freedom-mfe-default-rtdb.asia-southeast1.firebasedatabase.app';

  try {
    const response = await fetch(`${databaseURL}/${path}.json`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'خطا در ارتباط با فایربیس' });
  }
}
