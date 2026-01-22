const fs = require('fs');
const path = require('path');

// Manually load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            if (key && value) {
                process.env[key] = value;
            }
        }
    });
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = "https://my-moneys.vercel.app/api/telegram/webhook";

async function setupWebhook() {
    if (!BOT_TOKEN) {
        console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env file");
        process.exit(1);
    }

    try {
        // Set the webhook
        const setWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
        const response = await fetch(setWebhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                url: WEBHOOK_URL,
                drop_pending_updates: true, // Clear any pending updates
            }),
        });

        const data = await response.json();

        if (data.ok) {
            console.log("✅ Webhook successfully registered!");
            console.log(`📍 Webhook URL: ${WEBHOOK_URL}`);
            console.log(`📊 Response:`, data);
            
            // Verify the webhook
            const getWebhookUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
            const verifyResponse = await fetch(getWebhookUrl);
            const verifyData = await verifyResponse.json();
            
            console.log("\n🔍 Current webhook status:");
            console.log(verifyData.result);
        } else {
            console.error("❌ Failed to register webhook:");
            console.error(data);
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Error setting up webhook:", error);
        process.exit(1);
    }
}

setupWebhook();
