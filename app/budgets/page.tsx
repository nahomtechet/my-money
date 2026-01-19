import { BudgetsView } from "@/components/budgets/budgets-view"
import { getBudgetsWithProgress } from "@/actions/budgets"

export default async function BudgetsPage() {
    const data = await getBudgetsWithProgress()

    return (
        <BudgetsView 
            budgets={data.budgets}
            availableCategories={data.categories}
            totalBudgeted={data.totalBudgeted}
            totalSpent={data.totalSpent}
        />
    )
}
