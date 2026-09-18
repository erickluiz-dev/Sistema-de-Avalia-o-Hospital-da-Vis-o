import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

import type { AvaliacaoPorFuncionario } from '../../../types'

type Props = { data: AvaliacaoPorFuncionario[] }
type PieItem = { name: string; value: number; color: string }

export default function AvaliacaoPorFuncionarioChart({ data }: Props) {
  const [funcionarioSearch, setFuncionarioSearch] = useState('')
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<AvaliacaoPorFuncionario | null>(null)
  const [indiceFuncionario, setIndiceFuncionario] = useState(0)
  const [mostrarSugestoesFuncionario, setMostrarSugestoesFuncionario] = useState(false)

  const funcionariosFiltrados = data.filter((funcionario) =>
    funcionario.funcionario.toLowerCase().includes(funcionarioSearch.toLowerCase()),
  )

  const funcionarioAtual = funcionarioSelecionado ?? data[indiceFuncionario] ?? null

  const dadosFuncionario: PieItem[] = funcionarioAtual
    ? [
        { name: 'Excelente', value: funcionarioAtual.excelente, color: '#00B5CC' },
        { name: 'Bom', value: funcionarioAtual.bom, color: '#0eb374' },
        { name: 'Razoável', value: funcionarioAtual.razoavel, color: '#EAB308' },
        { name: 'Ruim', value: funcionarioAtual.ruim, color: '#F97316' },
        { name: 'Péssimo', value: funcionarioAtual.pessimo, color: '#EF4444' },
      ]
    : []

  const porcentagemFuncionario = (quantidade: number) => {
    const total = funcionarioAtual
      ? funcionarioAtual.excelente + funcionarioAtual.bom + funcionarioAtual.razoavel + funcionarioAtual.ruim + funcionarioAtual.pessimo
      : 0

    if (total === 0) return 0
    return Math.round((quantidade / total) * 100)
  }

  useEffect(() => {
    if (funcionarioSelecionado || data.length === 0) return

    const intervalo = window.setInterval(() => {
      setIndiceFuncionario((atual) => (atual + 1) % data.length)
    }, 3000)

    return () => window.clearInterval(intervalo)
  }, [funcionarioSelecionado, data.length])

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">Avaliação por Funcionário</h3>
        <p className="text-xs text-gray-400 mt-0.5">{funcionarioAtual?.funcionario ?? 'Nenhum funcionário'}</p>
        <div className="relative mt-3">
          <input
            value={funcionarioSearch}
            onChange={(e) => {
              setFuncionarioSearch(e.target.value)
              setFuncionarioSelecionado(null)
              setIndiceFuncionario(0)
              setMostrarSugestoesFuncionario(true)
            }}
            onFocus={() => {
              if (funcionarioSearch.trim() !== '') setMostrarSugestoesFuncionario(true)
            }}
            placeholder="Pesquisar funcionário..."
            className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5CC]"
          />
          {mostrarSugestoesFuncionario && funcionarioSearch.trim() !== '' && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {funcionariosFiltrados.length > 0 ? (
                funcionariosFiltrados.map((funcionario) => (
                  <button
                    key={funcionario.funcionario_id}
                    type="button"
                    onClick={() => {
                      setFuncionarioSelecionado(funcionario)
                      setFuncionarioSearch(funcionario.funcionario)
                      setMostrarSugestoesFuncionario(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {funcionario.funcionario}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400">Nenhum funcionário encontrado</div>
              )}
            </div>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={dadosFuncionario} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
            {dadosFuncionario.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(value, name) => [`${Number(value)} avaliações`, name]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5 mt-2">
        {dadosFuncionario.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-900">{porcentagemFuncionario(item.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
