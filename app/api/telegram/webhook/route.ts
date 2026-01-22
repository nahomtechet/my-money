import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTelegramMessage, deleteTelegramMessage } from "@/lib/telegram";
import { internalActionMarkContributionPaid } from "@/actions/equb";
import { createNotification } from "@/actions/notifications";
import { 
    handleQuickLog, 
    handleBalanceQuery, 
    handleSummaryQuery, 
    handleEqubQuery,
    handleWeeklyReport 
} from "@/actions/telegram";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 1. Handle callback_query (Button Clicks)
        if (body.callback_query) {
            const callback = body.callback_query;
            const chatId = callback.message.chat.id.toString();
            const data = callback.data;

            // Find user by chatId
            const user = await prisma.user.findFirst({
                where: { telegramId: chatId },
                select: { id: true, name: true }
            });

            if (!user) {
                await sendTelegramMessage(chatId, "⚠️ <b>Error:</b> Your account is not linked. Please use the verification code from your MyMoney Settings.");
                return new NextResponse("OK", { status: 200 });
            }

            if (data.startsWith("pay_equb:")) {
                const contributionId = data.split(":")[1];
                
                const result = await internalActionMarkContributionPaid(contributionId, user.id);
                
                if (result.success) {
                    await sendTelegramMessage(chatId, `✅ <b>Success!</b> Your Equb payment has been recorded, <b>${user.name || "friend"}</b>.`);
                } else {
                    await sendTelegramMessage(chatId, `❌ <b>Error:</b> ${result.error || "Failed to record payment."}`);
                }

                // Answer callback query to remove loading state in Telegram
                const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
                if (BOT_TOKEN) {
                    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ callback_query_id: callback.id })
                    });
                }
            }
            return new NextResponse("OK", { status: 200 });
        }

        // 2. Handle Messages
        const message = body.message;
        if (!message || !message.text) {
            return new NextResponse("OK", { status: 200 });
        }

        const chatId = message.chat.id.toString();
        const text = message.text.trim();

        // 3. Handle Commands and Quick Logging
        if (text.startsWith("/")) {
            const command = text.split(" ")[0].toLowerCase();
            
            switch (command) {
                case "/start":
                    await sendTelegramMessage(chatId, "👋 <b>Welcome to MyMoney Bot!</b>\n\nI can help you track your expenses and manage your Equbs directly from Telegram.");
                    await sendTelegramMessage(chatId, "To get started, please send me the <b>6-digit verification code</b> from your MyMoney Settings page.");
                    break;
                case "/help":
                    const helpText = [
                        "🤖 <b>Bot Commands</b>",
                        "",
                        "💰 /balance - View account balances",
                        "📊 /summary - Last 7 days overview",
                        "📅 /weekly - This week's detailed report",
                        "🗓️ /equb - Upcoming Equb payments",
                        "",
                        "📝 <b>Quick Log</b>",
                        "Just send me something like:",
                        "• <i>Lunch 200</i>",
                        "• <i>500 Taxi</i>",
                        "...and I'll record it as an expense!"
                    ].join("\n");
                    await sendTelegramMessage(chatId, helpText);
                    break;
                case "/balance":
                    await handleBalanceQuery(chatId);
                    break;
                case "/summary":
                    await handleSummaryQuery(chatId);
                    break;
                case "/weekly":
                    await handleWeeklyReport(chatId);
                    break;
                case "/equb":
                    await handleEqubQuery(chatId);
                    break;
                default:
                    await sendTelegramMessage(chatId, "🤔 I don't know that command. Type /help to see what I can do.");
            }
            return new NextResponse("OK", { status: 200 });
        }

        // 4. Handle 6-digit verification code
        if (/^\d{6}$/.test(text)) {
            const user = await prisma.user.findFirst({
                where: { telegramVerificationCode: text },
                select: { id: true, name: true }
            });

            if (user) {
                // Check if this telegram account is already linked to another user
                const existingUser = await prisma.user.findFirst({
                    where: {
                        telegramId: chatId,
                        id: { not: user.id }
                    },
                    select: { id: true, name: true }
                });

                if (existingUser) {
                    await sendTelegramMessage(chatId, `❌ <b>Already Linked!</b> This Telegram account is already linked to another MyMoney account.`);
                    return new NextResponse("OK", { status: 200 });
                }

                // Link the user
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        telegramId: chatId,
                        telegramVerificationCode: null
                    }
                });

                await createNotification({
                    userId: user.id,
                    title: "Telegram Connected! 🤖 ✨",
                    message: `Success! Your account is now securely linked, ${user.name || "friend"}. Type /help to see what I can do!`,
                    type: "SUCCESS"
                });
            } else {
                await sendTelegramMessage(chatId, "❌ <b>Invalid code.</b> Please check the 6-digit code on your MyMoney Settings page.");
            }
            return new NextResponse("OK", { status: 200 });
        } 

        // 5. Try Quick Logging (Description Amount)
        const logged = await handleQuickLog(chatId, text);
        if (!logged) {
            await sendTelegramMessage(chatId, "🤔 I'm not sure what you mean. Type /help to see available commands or just send something like 'Lunch 200' to log an expense.");
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("Telegram Webhook Error:", error);
        return new NextResponse("OK", { status: 200 });
    }
}
