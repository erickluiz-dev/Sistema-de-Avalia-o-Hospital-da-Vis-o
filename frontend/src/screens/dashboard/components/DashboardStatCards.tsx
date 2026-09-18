import type { ReactNode } from 'react'

import StatCard from '../../../components/StatCard'

type StatCardItem = {
  label: string
  value: string
  sub: string
  color: string
  icon: ReactNode
}

type DashboardStatCardsProps = {
  cards: StatCardItem[]
}

export default function DashboardStatCards({ cards }: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((s) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          sub={s.sub}
          color={s.color}
          icon={s.icon}
        />
      ))}
    </div>
  )
}
