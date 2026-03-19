import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicRoute = 
        nextUrl.pathname.startsWith('/login') || 
        nextUrl.pathname.startsWith('/register') || 
        nextUrl.pathname === '/manifest.json' ||
        nextUrl.pathname === '/manifest.webmanifest' ||
        nextUrl.pathname.startsWith('/icon-') ||
        nextUrl.pathname === '/apple-touch-icon.png' ||
        nextUrl.pathname === '/favicon.ico'
      
      const isOnProtectedLine = !isPublicRoute && nextUrl.pathname.startsWith('/')
      
      if (isOnProtectedLine) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }
      return true
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
