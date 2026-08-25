import { TeronAuthLogin } from '@/components/teron-auth-login'

export const metadata = { title: 'Login do cliente | TERON', description: 'Acesse o portal do cliente TERON.' }

export default function ClientLoginPage() {
  return <TeronAuthLogin role="client" />
}
