import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategories } from "@/actions/categories"
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog"
import prisma from "@/lib/prisma"
import Link from "next/link"

async function getAllTransactions(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
    })
    if (!user) return []

    return await prisma.transaction.findMany({
        where: { userId: user.id },
        include: { category: true },
        orderBy: { date: 'desc' }
    })
}

export default async function TransactionsPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")
    
    const transactions = await getAllTransactions(session.user.email)
    const rawCategories = await getCategories()
    const categories = rawCategories.map(c => ({
        ...c,
        icon: c.icon || undefined
    }))

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Transactions</h1>
                    <p className="text-muted-foreground">History of all income and expenses.</p>
                </div>
                <div className="flex gap-4">
                     <Link href="/">
                        <Button variant="outline">Back to Dashboard</Button>
                    </Link>
                    <AddTransactionDialog categories={categories} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                     {transactions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No transactions found.</p>
                    ) : (
                        <div className="space-y-4">
                              {transactions.map(t => (
                                <div key={t.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">{t.description || "No description"}</p>
                                        <p className="text-sm text-muted-foreground">{t.category?.name} • {new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className={`font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}${t.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
