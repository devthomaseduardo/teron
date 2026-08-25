export type View = 'home' | 'diagnostico' | 'admin' | 'proposal' | 'portal' | 'manager'

export const leads = [
  { name: 'Nuvem Saúde', company: 'Healthtech · São Paulo', score: 92, stage: 'Proposta', value: 'R$ 48.000', initials: 'NS', color: 'lime' },
  { name: 'Casa Norte', company: 'Varejo · Curitiba', score: 78, stage: 'Diagnóstico', value: 'R$ 32.000', initials: 'CN', color: 'blue' },
  { name: 'Órbita Labs', company: 'SaaS · Belo Horizonte', score: 86, stage: 'Construção', value: 'R$ 64.000', initials: 'OL', color: 'orange' },
  { name: 'Mundo Vivo', company: 'Impacto · Recife', score: 64, stage: 'Novo lead', value: 'R$ 26.000', initials: 'MV', color: 'pink' },
]

export const roadmap = [
  { title: 'Fundação & estratégia', date: '03 — 14 JUN', status: 'done', items: ['Workshop de posicionamento', 'Mapa de produto', 'Arquitetura de informação'] },
  { title: 'Sistema visual', date: '17 — 28 JUN', status: 'active', items: ['Direção visual', 'Design system v1', 'Protótipo navegável'] },
  { title: 'Construção', date: '01 — 26 JUL', status: 'next', items: ['Desenvolvimento core', 'Integrações', 'Testes internos'] },
  { title: 'Validação & entrega', date: '29 JUL — 08 AGO', status: 'next', items: ['QA e acessibilidade', 'Treinamento', 'Go-live'] },
]

export const services = ['Estratégia de produto', 'Identidade & sistema visual', 'Experiências digitais', 'Construção de produtos']

export const copy = {
  eyebrow: 'Estúdio de produto digital · São Paulo / remoto',
  headline: 'Produtos que fazem sentido antes de fazer barulho.',
  subhead: 'A TERON transforma problemas complexos em produtos digitais claros, desejáveis e prontos para crescer.',
}
