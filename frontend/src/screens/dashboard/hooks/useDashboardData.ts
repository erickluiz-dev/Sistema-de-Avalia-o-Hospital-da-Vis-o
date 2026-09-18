import { useCallback, useEffect, useState } from 'react'

import { apiFetch } from '../../../services/api'

import type { Avaliacao, AvaliacoesPaginadas, Estatisticas } from '../../../types'

export function useDashboardData() {
  const [search, setSearch] = useState('')
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalAvaliacoes, setTotalAvaliacoes] = useState(0)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)

  const carregarEstatisticas = useCallback(async () => {
    try {
      const response = await apiFetch('/avaliacoes/estatisticas', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas')
      }

      const dados: Estatisticas = await response.json()
      setEstatisticas(dados)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }, [])

  const carregarAvaliacoes = useCallback(
    async (paginaAtual = pagina) => {
      try {
        setCarregando(true)

        const params = new URLSearchParams()
        params.set('page', paginaAtual.toString())
        params.set('limit', '10')

        if (search.trim()) {
          params.set('search', search.trim())
        }

        if (dataInicio) {
          params.set('data_inicio', dataInicio)
        }

        if (dataFim) {
          params.set('data_fim', dataFim)
        }

        const response = await apiFetch(`/avaliacoes?${params.toString()}`, {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar avaliações')
        }

        const dados: AvaliacoesPaginadas = await response.json()

        setAvaliacoes(dados.avaliacoes)
        setPagina(dados.pagina)
        setTotalPaginas(dados.total_paginas)
        setTotalAvaliacoes(dados.total)
      } catch (error) {
        console.error('Erro ao carregar avaliações:', error)
      } finally {
        setCarregando(false)
      }
    },
    [dataFim, dataInicio, pagina, search],
  )

  useEffect(() => {
    carregarAvaliacoes(1)
    carregarEstatisticas()
  // A carga inicial deve ocorrer somente na montagem, como no Dashboard original.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    search,
    setSearch,
    avaliacoes,
    pagina,
    setPagina,
    totalPaginas,
    totalAvaliacoes,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    carregando,
    estatisticas,
    carregarAvaliacoes,
    carregarEstatisticas,
  }
}
