import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                telegramId: true,
                telegramUsername: true,
                telegramVerificationCode: true,
            }
        });

        return NextResponse.json({
            telegramId: user?.telegramId || "",
            telegramUsername: user?.telegramUsername || "",
            telegramVerificationCode: user?.telegramVerificationCode || "",
        });
    } catch (error) {
        console.error("Failed to fetch telegram status:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
