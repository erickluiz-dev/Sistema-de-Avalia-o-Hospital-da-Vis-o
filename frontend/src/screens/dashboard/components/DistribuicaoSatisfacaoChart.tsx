import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type PieItem = { name: string; value: number; color: string }
type Props = { data: PieItem[]; porcentagem: (quantidade: number) => number }

export default function DistribuicaoSatisfacaoChart({ data, porcentagem }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Distribuição de Satisfação</h3>
        <p className="text-xs text-gray-400 mt-0.5">Sempre</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-gray-600">{d.name}</span>
            </div>
            <span className="font-semibold text-gray-900">{porcentagem(d.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
