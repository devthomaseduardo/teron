import type { Metadata } from 'next'
import { ProposalRoom } from '@/components/proposal-room'

export const metadata: Metadata = {
  title: 'Proposal Room | TERON',
  description: 'Revise e responda a proposta TERON.',
}

export default async function PropostaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <ProposalRoom token={token} />
}
