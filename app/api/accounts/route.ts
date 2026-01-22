import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { createNotification } from "@/actions/notifications"

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["BANK", "MOBILE_MONEY"]),
  accountNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error("Fetch accounts error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = accountSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Account validation failed:", parsed.error.format())
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 })
    }

    const account = await prisma.bankAccount.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        accountNumber: parsed.data.type === "BANK" ? parsed.data.accountNumber : null,
        phoneNumber: parsed.data.type === "MOBILE_MONEY" ? parsed.data.phoneNumber : null,
        userId: session.user.id
      }
    })

    // Create notification
    await createNotification({
        userId: session.user.id,
        title: "New Account Linked 🏦",
        message: `Successfully linked ${parsed.data.name} (${parsed.data.type === "BANK" ? "Bank" : "Mobile Money"}).`,
        type: "SUCCESS"
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error("Create account error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
