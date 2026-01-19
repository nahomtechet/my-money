import { getGoals } from "@/actions/goals"
import { GoalsView } from "@/components/goals/goals-view"

export default async function GoalsPage() {
    const goals = await getGoals()

    return <GoalsView goals={goals} />
}
