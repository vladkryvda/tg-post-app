// api/publish.js

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHANNEL_USERNAME;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не дозволений' });
    }

    const { chunks } = req.body;

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        return res.status(400).json({ error: 'Відсутні частини повідомлення для відправки.' });
    }

    if (!telegramToken || !telegramChatId) {
        return res.status(500).json({ error: 'Не налаштовано змінні Telegram на сервері.' });
    }

    try {
        // Надсилаємо частини послідовно одна за одною
        for (let i = 0; i < chunks.length; i++) {
            let chunkText = chunks[i];
            
            // Якщо повідомлення довге і розбите на частини, додаємо красиве маркування в кінці
            if (chunks.length > 1) {
                chunkText += `\n\n<i>[Частина ${i + 1}/${chunks.length}]</i>`;
            }

            const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: telegramChatId,
                    text: chunkText,
                    parse_mode: 'HTML'
                })
            });

            const telData = await telegramResponse.json();

            if (!telegramResponse.ok || !telData.ok) {
                throw new Error(telData.description || `Помилка відправки частини ${i + 1}`);
            }
            
            // Затримка 250 мс між відправками частин, щоб Telegram не сприйняв це як спам
            await new Promise(resolve => setTimeout(resolve, 250));
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
