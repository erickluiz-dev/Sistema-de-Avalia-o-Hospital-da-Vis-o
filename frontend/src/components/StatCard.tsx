import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon: ReactNode
}

function StatCard({
  label,
  value,
  sub,
  color = '#00B5CC',
  icon,
}: StatCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-3"
      style={{
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">
          {label}
        </span>

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: color + '18',
          }}
        >
          <div style={{ color }}>
            {icon}
          </div>
        </div>
      </div>

      <div>
        <div
          className="text-3xl font-bold text-gray-900"
          style={{
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {value}
        </div>

        {sub && (
          <div className="text-xs text-gray-400 mt-0.5">
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard