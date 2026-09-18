type KpiCard = {
  label: string
  value: string
  trend: string
  pos: boolean | null
}

type DashboardKpiCardsProps = {
  cards: KpiCard[]
}

export default function DashboardKpiCards({ cards }: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((k) => (
        <div
          key={k.label}
          className="bg-white rounded-2xl p-4"
          style={{
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            border: '1px solid #f3f4f6',
          }}
        >
          <div className="text-xs font-medium text-gray-500">{k.label}</div>
          <div
            className="text-2xl font-bold text-gray-900 mt-1"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {k.value}
          </div>
          <div
            className={`text-xs mt-1 ${
              k.pos === true
                ? 'text-[#0eb374]'
                : k.pos === false
                  ? 'text-red-400'
                  : 'text-[#00B5CC]'
            }`}
          >
            {k.trend}
          </div>
        </div>
      ))}
    </div>
  )
}
