import { TeronAuthLogin } from '@/components/teron-auth-login'

export const metadata = { title: 'Login administrativo | TERON', description: 'Acesse o workspace interno da TERON.' }

export default function AdminLoginPage() {
  return <TeronAuthLogin role="admin" />
}
