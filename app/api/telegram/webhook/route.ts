import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Telegram sends updates in the 'message' field
        const message = body.message;
        if (!message || !message.text) {
            return new NextResponse("OK", { status: 200 });
        }

        const chatId = message.chat.id.toString();
        const text = message.text.trim();

        // 1. Handle 6-digit verification code
        if (/^\d{6}$/.test(text)) {
            const user = await prisma.user.findFirst({
                where: { telegramVerificationCode: text },
                select: { id: true, name: true }
            });

            if (user) {
                // Link the user
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        telegramId: chatId,
                        telegramVerificationCode: null // Clear code after success
                    }
                });

                await sendTelegramMessage(chatId, `✅ <b>Success!</b> Your account is now linked, <b>${user.name || "friend"}</b>. You will receive Equb reminders here.`);
                
                // Also create a success notification in the app
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        title: "Telegram Connected! 🤖",
                        message: "Your Telegram account has been securely linked for reminders.",
                        type: "SUCCESS"
                    }
                });
            } else {
                await sendTelegramMessage(chatId, "❌ <b>Invalid code.</b> Please check the 6-digit code on your MyMoney Settings page and try again.");
            }
        } 
        // 2. Handle /start or help
        else if (text.startsWith("/start")) {
            await sendTelegramMessage(chatId, "👋 <b>Welcome to Equb Reminders!</b>\n\nPlease send me the <b>6-digit verification code</b> from your MyMoney Settings page to link your account.");
        }
        else {
            await sendTelegramMessage(chatId, "🤔 I don't recognize that. Please send the <b>6-digit code</b> from your Settings page to connect your account.");
        }

        return new NextResponse("OK", { status: 200 });
    } catch (error) {
        console.error("Telegram Webhook Error:", error);
        return new NextResponse("OK", { status: 200 }); // Always return 200 to Telegram
    }
}
