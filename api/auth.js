export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { action, username, password, newUsername, newPassword } = req.body;
  const dbUrl = "https://freedom-mfe-default-rtdb.asia-southeast1.firebasedatabase.app";

  try {
    // 1. ثبت نام کاربر جدید
    if (action === 'register') {
      const cleanUser = username.trim().toLowerCase();

      // اعتبارسنجی طول و کاراکترها
      if (cleanUser.length <= 4 || password.length <= 4) {
        return res.status(400).json({ message: 'نام کاربری و رمز عبور باید بیشتر از ۴ حرف باشند.' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
        return res.status(400).json({ message: 'نام کاربری باید شامل حروف انگلیسی باشد.' });
      }

      // بررسی تکراری نبودن نام کاربری
      const userCheckRes = await fetch(`${dbUrl}/users/${cleanUser}.json`);
      const existingUser = await userCheckRes.json();

      if (existingUser) {
        return res.status(400).json({ message: 'این نام کاربری قبلاً ثبت شده است. لطفاً نام دیگری انتخاب کنید.' });
      }

      // ذخیره کاربر جدید
      const userData = { username: cleanUser, password: password, createdAt: new Date().toISOString() };
      await fetch(`${dbUrl}/users/${cleanUser}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      return res.status(200).json({ success: true, message: 'ثبت‌نام با موفقیت انجام شد.', user: userData });
    }

    // 2. ورود کاربر
    if (action === 'login') {
      const cleanUser = username.trim().toLowerCase();
      const userRes = await fetch(`${dbUrl}/users/${cleanUser}.json`);
      const userData = await userRes.json();

      if (!userData) {
        return res.status(404).json({ message: 'نام کاربری یافت نشد. لطفاً ابتدا ثبت نام کنید.' });
      }

      if (userData.password !== password) {
        return res.status(401).json({ message: 'رمز عبور اشتباه است. اگر اکانت ندارید از طریق ثبت نام اقدام کنید.' });
      }

      return res.status(200).json({ success: true, message: 'ورود موفقیت‌آمیز بود.', user: userData });
    }

    // 3. ویرایش اطلاعات کاربری
    if (action === 'update') {
      const oldCleanUser = username.trim().toLowerCase();
      const newCleanUser = newUsername.trim().toLowerCase();

      if (newCleanUser.length <= 4 || newPassword.length <= 4) {
        return res.status(400).json({ message: 'نام کاربری و رمز عبور جدید باید بیشتر از ۴ حرف باشند.' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(newCleanUser)) {
        return res.status(400).json({ message: 'نام کاربری باید شامل حروف انگلیسی باشد.' });
      }

      // اگر نام کاربری تغییر کرده باشد، بررسی تکراری نبودن نام جدید
      if (newCleanUser !== oldCleanUser) {
        const checkRes = await fetch(`${dbUrl}/users/${newCleanUser}.json`);
        const exist = await checkRes.json();
        if (exist) {
          return res.status(400).json({ message: 'این نام کاربری جدید قبلاً توسط شخص دیگری ثبت شده است.' });
        }
        // حذف رکورد قبلی
        await fetch(`${dbUrl}/users/${oldCleanUser}.json`, { method: 'DELETE' });
      }

      // ثبت اطلاعات جدید
      const updatedData = { username: newCleanUser, password: newPassword, updatedAt: new Date().toISOString() };
      await fetch(`${dbUrl}/users/${newCleanUser}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      return res.status(200).json({ success: true, message: 'اطلاعات با موفقیت به‌روزرسانی شد.', user: updatedData });
    }

    return res.status(400).json({ message: 'عملیات نامعتبر است.' });

  } catch (error) {
    return res.status(500).json({ message: 'خطای سرور: ' + error.message });
  }
}
