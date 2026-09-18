import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import type { AvaliacaoPorDepartamento } from '../../../types'

type Props = { data: AvaliacaoPorDepartamento[] }

type TickProps = { x?: number; y?: number; payload?: { value: string } }

function DepartamentoTick({ x = 0, y = 0, payload }: TickProps) {
  const nome = payload?.value ?? ''
  const partes = nome.split(' ')

  if (partes.length <= 2) {
    return <text x={x} y={y} dy={14} textAnchor="middle" fill="#9ca3af" fontSize={12}>{nome}</text>
  }

  const meio = Math.ceil(partes.length / 2)
  const linha1 = partes.slice(0, meio).join(' ')
  const linha2 = partes.slice(meio).join(' ')

  return (
    <text x={x} y={y} textAnchor="middle" fill="#9ca3af" fontSize={11}>
      <tspan x={x} dy={12}>{linha1}</tspan>
      <tspan x={x} dy={14}>{linha2}</tspan>
    </text>
  )
}

export default function AvaliacaoPorDepartamentoChart({ data }: Props) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Avaliação por Departamento</h3>
          <p className="text-xs text-gray-400 mt-0.5">Satisfação Geral</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#00B5CC]" />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="departamento" axisLine={false} tickLine={false} interval={0} height={55} tick={<DepartamentoTick />} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}`, 'Satisfação Geral']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
          <Bar dataKey="satisfacao" fill="#00B5CC" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
