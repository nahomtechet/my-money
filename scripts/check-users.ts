import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('Users in DB:', users.map(u => ({ email: u.email, name: u.name, hasPassword: !!u.password })))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
