import { NextResponse } from "next/server"

export async function GET() {
    console.error("AUTH_DEBUG_TEST_LOG: This should appear in terminal")
    return NextResponse.json({ message: "Hello from test route", timestamp: new Date().toISOString() })
}
