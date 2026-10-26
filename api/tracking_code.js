        // Send cart products (with photos, descriptions, prices, tracking codes) to support chat
        async function sendCartOrderToSupport() {
            const pendingOrderStr = localStorage.getItem('pending_order');
            if (!pendingOrderStr || !currentUser) return;

            const items = JSON.parse(pendingOrderStr);
            let totalPrice = 0;
            items.forEach(item => {
                totalPrice += getProductRawPrice(item);
            });

            // دریافت کدهای رهگیری عددی، ترتیبی و یکتا از سرور
            let trackingCodes = [];
            try {
                const res = await fetch('/api/tracking_code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ count: items.length })
                });
                const data = await res.json();
                if (data.success && data.codes) {
                    trackingCodes = data.codes;
                } else {
                    throw new Error(data.error || 'خطا در دریافت کد رهگیری');
                }
            } catch (err) {
                alert("خطا در دریافت کد رهگیری: " + err.message);
                return;
            }

            const processedItems = items.map((item, index) => {
                return {
                    ...item,
                    trackingCode: trackingCodes[index] || (1000 + index).toString()
                };
            });

            const order = {
                id: 'ORD-' + Date.now(),
                items: processedItems,
                totalPrice: totalPrice,
                timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
            };

            localStorage.setItem('active_order', JSON.stringify(order));
            localStorage.removeItem('pending_order');

            // Clear cart
            currentUser.cart = [];
            localStorage.setItem('app_user', JSON.stringify(currentUser));
            try {
                await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'syncCart', username: currentUser.username, cart: [] })
                });
            } catch(e) {}

            // Build rich HTML summary containing product photos, descriptions, prices and tracking codes for the chat
            let orderHtmlSummary = `📦 <b>ثبت سفارش جدید از سبد خرید:</b><br><div class="space-y-2 mt-2">`;
            processedItems.forEach(item => {
                const rawPrice = getProductRawPrice(item);
                orderHtmlSummary += `
                    <div class="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 flex items-center gap-3">
                        <img src="${item.mainImg || ''}" class="w-14 h-14 object-cover rounded-lg flex-shrink-0" onerror="this.src='https://placehold.co/100x100/1e293b/a855f7?text=Product'">
                        <div class="flex-grow">
                            <h5 class="font-bold text-white text-xs">${item.name || ''}</h5>
                            <p class="text-[11px] text-slate-300 line-clamp-1 mt-0.5">${item.desc || 'بدون توضیحات'}</p>
                            <div class="flex justify-between items-center mt-1 text-[11px]">
                                <span class="text-amber-400 font-semibold">${formatPrice(rawPrice)} تومان</span>
                                <span class="bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded font-mono text-[10px]">کد رهگیری: ${item.trackingCode}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            orderHtmlSummary += `</div><div class="mt-3 pt-2 border-t border-slate-700 flex justify-between items-center text-xs font-bold"><span>مجموع کل:</span><span class="text-amber-400 text-sm">${formatPrice(totalPrice)} تومان</span></div>`;

            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: currentUser.username,
                        text: orderHtmlSummary,
                        sender: 'user'
                    })
                });
            } catch (err) {}

            checkOrderPanel();
            loadMessages();
        }
