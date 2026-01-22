const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
    if (!BOT_TOKEN) {
        console.warn("⚠️  TELEGRAM_BOT_TOKEN is not set. Skipping message.");
        return null;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: "HTML",
                reply_markup: replyMarkup,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Telegram API Error:", {
                status: response.status,
                statusText: response.statusText,
                error: data,
                chatId,
                messagePreview: text.substring(0, 100)
            });
            return null;
        }
        
        console.log("✅ Telegram message sent successfully:", {
            chatId,
            messageId: data.result?.message_id,
            timestamp: new Date().toISOString()
        });
        
        return data.result?.message_id || null;
    } catch (error) {
        console.error("❌ Failed to send Telegram message:", {
            error: error instanceof Error ? error.message : "Unknown error",
            chatId,
            messagePreview: text.substring(0, 100)
        });
        return null;
    }
}

export async function deleteTelegramMessage(chatId: string, messageId: number) {
    if (!BOT_TOKEN) {
        console.warn("⚠️  TELEGRAM_BOT_TOKEN is not set. Skipping message deletion.");
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Failed to delete Telegram message:", {
                status: response.status,
                error: data,
                chatId,
                messageId
            });
            return false;
        }
        
        console.log("✅ Telegram message deleted successfully:", { chatId, messageId });
        return true;
    } catch (error) {
        console.error("❌ Failed to delete Telegram message:", {
            error: error instanceof Error ? error.message : "Unknown error",
            chatId,
            messageId
        });
        return false;
    }
}
