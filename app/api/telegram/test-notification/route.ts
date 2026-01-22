import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's Telegram ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { telegramId: true, name: true }
        });

        if (!user?.telegramId) {
            return NextResponse.json({ 
                error: "Telegram not connected. Please link your Telegram account in Settings first.",
                connected: false
            }, { status: 400 });
        }

        // Send test message
        const testMessage = `🧪 <b>Test Notification</b>

Hello ${user.name || "there"}! 👋

This is a test message from MyMoney to verify your Telegram integration is working correctly.

✅ If you're seeing this, notifications are working!`;

        const success = await sendTelegramMessage(user.telegramId, testMessage);

        if (success) {
            return NextResponse.json({
                success: true,
                message: "Test notification sent successfully! Check your Telegram.",
                telegramConnected: true
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Failed to send test message. Check server logs for details.",
                telegramConnected: true
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Test notification error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to send test notification",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
