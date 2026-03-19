import { getGoalById } from "@/actions/goals"
import { GoalDetailsView } from "@/components/goals/goal-details-view"
import { notFound } from "next/navigation"

export default async function GoalPage({ params }: { params: { id: string } }) {
    const goal = await getGoalById(params.id)

    if (!goal) {
        notFound()
    }

    return <GoalDetailsView goal={goal} />
}
