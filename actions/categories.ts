import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function getCategories() {
  const session = await auth()
  if (!session?.user?.email) return []

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })
  
  if (!user) return []

  return await prisma.category.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userId: null }
      ]
    },
    orderBy: { name: 'asc' }
  })
}
