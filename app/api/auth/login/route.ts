import { NextResponse } from "next/server"
import { signIn } from "@/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      )
    }

    // Since we are in an API route, we can use signIn from "@auth"
    // However, usually we might want to just handle the redirect or return success
    // If we use signIn here, it might trigger a redirect on the server.
    // For API routes, we often just want to verify and return a token, 
    // but with NextAuth, the easiest is to let the client-side signIn call the provider.
    // Let's implement a verify-only or proxy-like route if needed, 
    // or just use this to trigger the session creation.
    
    // NOTE: NextAuth (Auth.js) v5 usually handles everything through the /api/auth/[...nextauth] handler.
    // However, we can use signIn programmatically.
    
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    return NextResponse.json({ message: "Success" })
  } catch (error: any) {
    if (error.type === "CredentialsSignin") {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
