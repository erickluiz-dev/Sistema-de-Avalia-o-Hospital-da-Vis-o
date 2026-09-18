import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

import type { HistoricoPontuacao } from '../../../types'

type Props = { data: HistoricoPontuacao[] }

export default function HistoricoPontuacaoChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Histórico de Pontuação de Satisfação</h3>
          <p className="text-xs text-gray-400 mt-0.5">tendência de 8 semanas</p>
        </div>
        <div className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0eb374] bg-green-50">↑ Tendência de Crescimento</div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <YAxis domain={[3, 5]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <Tooltip formatter={(value) => [Number(value).toFixed(2), 'Pontuação']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
          <Line type="monotone" dataKey="pontuacao" stroke="#00B5CC" strokeWidth={2.5} dot={{ fill: '#00B5CC', r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
