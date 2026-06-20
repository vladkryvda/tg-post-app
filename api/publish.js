// api/publish.js

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHANNEL_USERNAME;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не дозволений' });
    }

    const { formattedText } = req.body;

    if (!telegramToken || !telegramChatId) {
        return res.status(500).json({ error: 'Не налаштовано змінні Telegram на сервері.' });
    }

    try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramChatId,
                text: formattedText,
                parse_mode: 'HTML'
            })
        });

        const telData = await telegramResponse.json();

        if (!telegramResponse.ok || !telData.ok) {
            throw new Error(telData.description || 'Помилка Telegram API');
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
