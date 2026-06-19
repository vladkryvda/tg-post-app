import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не дозволений' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Немає токена авторизації' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Неавторизований доступ' });
    }

    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Текст повідомлення порожній' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    try {
        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });

        const telegramData = await response.json();

        if (response.ok && telegramData.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: 'Помилка Telegram API: ' + telegramData.description });
        }

    } catch (err) {
        return res.status(500).json({ error: 'Помилка відправки запиту: ' + err.message });
    }
}
