import { getEqubs, getBankAccounts } from "@/actions/equb"
import { EqubView } from "@/components/equb/equb-view"

export const dynamic = "force-dynamic"

export default async function EqubPage() {
  const { equbs = [] } = await getEqubs()
  const { bankAccounts = [] } = await getBankAccounts()

  return <EqubView equbs={equbs} bankAccounts={bankAccounts} />
}
