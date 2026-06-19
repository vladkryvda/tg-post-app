import { createClient } from '@supabase/supabase-js';

// Ініціалізація Supabase на бекенді
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    // 1. Перевірка авторизації через Supabase токен
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Немає токена авторизації' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Неавторизований доступ' });
    }

    // Назва вашого каналу (наприклад, channel_username для t.me/s/channel_username)
    const channelUsername = process.env.TELEGRAM_CHANNEL_USERNAME;

    try {
        // 2. Завантажуємо публічну веб-сторінку каналу
        const response = await fetch(`https://t.me/s/${channelUsername}`);
        const html = await response.text();

        // 3. Парсинг за допомогою регулярних виразів
        const messages = [];
        
        // Знаходимо блоки повідомлень
        const messageBlockRegex = /<div class="tgme_widget_message_bubble">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
        let match;

        while ((match = messageBlockRegex.exec(html)) !== null) {
            const blockContent = match[1];

            // Витягуємо текст повідомлення
            const textMatch = /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/.exec(blockContent);
            // Витягуємо час
            const timeMatch = /<time class="time"[^>]*>([^<]+)<\/time>/.exec(blockContent);

            if (textMatch && timeMatch) {
                // Очищаємо HTML теги з тексту повідомлення
                let text = textMatch[1]
                    .replace(/<br\s*\/?>/g, '\n') // зберігаємо перенесення рядків
                    .replace(/<[^>]*>/g, '')      // прибираємо інші HTML-теги
                    .trim();

                messages.push({
                    text: text,
                    time: timeMatch[1].trim()
                });
            }
        }

        // Повертаємо останні 15 повідомлень (нові внизу)
        return res.status(200).json(messages.slice(-15));

    } catch (err) {
        return res.status(500).json({ error: 'Помилка отримання або парсингу історії: ' + err.message });
    }
}
