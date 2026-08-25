export type View = 'home' | 'diagnostico' | 'admin' | 'proposal' | 'portal' | 'manager'

export const leads = [
  { name: 'Nuvem Saude', company: 'Healthtech · Sao Paulo', score: 92, stage: 'Proposta', value: 'R$ 48.000', initials: 'NS', color: 'lime' },
  { name: 'Casa Norte', company: 'Varejo · Curitiba', score: 78, stage: 'Diagnostico', value: 'R$ 32.000', initials: 'CN', color: 'blue' },
  { name: 'Orbita Labs', company: 'SaaS · Belo Horizonte', score: 86, stage: 'Construcao', value: 'R$ 64.000', initials: 'OL', color: 'orange' },
  { name: 'Mundo Vivo', company: 'Impacto · Recife', score: 64, stage: 'Novo lead', value: 'R$ 26.000', initials: 'MV', color: 'pink' },
]

export const roadmap = [
  { title: 'Fundacao & estrategia', date: '03 — 14 JUN', status: 'done', items: ['Workshop de posicionamento', 'Mapa de produto', 'Arquitetura de informacao'] },
  { title: 'Sistema visual', date: '17 — 28 JUN', status: 'active', items: ['Direcao visual', 'Design system v1', 'Prototipo navegavel'] },
  { title: 'Construcao', date: '01 — 26 JUL', status: 'next', items: ['Desenvolvimento core', 'Integracoes', 'Testes internos'] },
  { title: 'Validacao & entrega', date: '29 JUL — 08 AGO', status: 'next', items: ['QA e acessibilidade', 'Treinamento', 'Go-live'] },
]

export const services = ['Estrategia de produto', 'Identidade & sistema visual', 'Experiencias digitais', 'Construcao de produtos']

export const copy = {
  eyebrow: 'Estudio de produto digital · Sao Paulo / remoto',
  headline: 'Produtos que fazem sentido antes de fazer barulho.',
  subhead: 'A TERON transforma problemas complexos em produtos digitais claros, desejaveis e prontos para crescer.',
}
