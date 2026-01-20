import { getDashboardData } from "@/actions/dashboard"
import { DashboardView } from "@/components/dashboard/dashboard-view"

export const dynamic = "force-dynamic"

export default async function Dashboard() {
    const data = await getDashboardData()

    return (
        <DashboardView 
            stats={data.stats}
            recentTransactions={data.recentTransactions}
            categories={data.categories}
            cashFlow={data.cashFlow}
            goalsCount={data.goalsCount}
            projections={data.projections}
            budgetAlerts={data.budgetAlerts}
        />
    )
}

