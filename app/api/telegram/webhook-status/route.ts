import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return NextResponse.json({ 
                error: "TELEGRAM_BOT_TOKEN not configured",
                configured: false
            }, { status: 500 });
        }

        // Get webhook info from Telegram
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || !data.ok) {
            return NextResponse.json({
                error: "Failed to get webhook info",
                details: data
            }, { status: 500 });
        }

        return NextResponse.json({
            configured: true,
            webhookInfo: data.result,
            isRegistered: !!data.result.url,
            expectedUrl: `${process.env.NEXTAUTH_URL || 'https://my-moneys.vercel.app'}/api/telegram/webhook`
        });
    } catch (error) {
        console.error("Webhook status check error:", error);
        return NextResponse.json({
            error: "Failed to check webhook status",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
