const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log('--- USER DATA START ---')
  console.log(JSON.stringify(users.map(u => ({ email: u.email, name: u.name, hasPassword: !!u.password })), null, 2))
  console.log('--- USER DATA END ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
