import type { Metadata } from 'next'
import { DiagnosisWizard } from '@/components/diagnosis-wizard'

export const metadata: Metadata = {
  title: 'Diagnostico | TERON',
  description:
    'Responda ao diagnostico TERON e receba uma proposta personalizada para o seu produto digital.',
}

export default function DiagnosticoPage() {
  return <DiagnosisWizard />
}
