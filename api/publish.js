// api/publish.js (або pages/api/publish.js)

export default async function handler(req, res) {
    // Дозволяємо лише POST запити
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не дозволений' });
    }

    const { title, text } = req.body;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    // Використовуємо CHAT_ID, якщо його немає — беремо CHANNEL_USERNAME
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHANNEL_USERNAME;

    if (!token || !chatId) {
        return res.status(500).json({ error: 'На сервері не налаштовано змінні оточення Telegram.' });
    }

    // Екранування символів для безпечного парсингу HTML в Telegram
    const escapeHTML = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };

    let formattedMessage = '';
    if (title) {
        formattedMessage += `<b>${escapeHTML(title)}</b>\n\n`;
    }
    formattedMessage += escapeHTML(text);

    try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: 'HTML',
            }),
        });

        const data = await telegramResponse.json();

        if (telegramResponse.ok && data.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: data.description || 'Помилка Telegram API' });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
