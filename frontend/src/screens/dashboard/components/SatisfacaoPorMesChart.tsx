import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { SatisfacaoPorMes } from '../../../types'

type Props = { data: SatisfacaoPorMes[] }

export default function SatisfacaoPorMesChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Satisfação Geral</h3>
          <p className="text-xs text-gray-400 mt-0.5">tendência de 8 meses</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#00B5CC]" />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Satisfação']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
          <Line type="monotone" dataKey="satisfacao" stroke="#00B5CC" strokeWidth={2.5} dot={{ fill: '#00B5CC', r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
