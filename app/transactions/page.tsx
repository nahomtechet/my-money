
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTransactions } from "@/actions/transactions"
import { getCategories } from "@/actions/categories"
import { TransactionsView } from "@/components/transactions/transactions-view"

export default async function TransactionsPage() {
    const session = await auth()
    if (!session?.user?.email) redirect("/login")
    
    // Fetch initial data
    const transactionData = await getTransactions()
    const rawCategories = await getCategories()
    
    // Transform categories to match expected format if needed
    // The View component handles icon rendering details
    const categories = rawCategories.map(c => ({
        ...c,
        icon: c.icon || undefined
    }))

    return (
        <TransactionsView 
            initialTransactions={transactionData.transactions || []} 
            categories={categories} 
        />
    )
}
