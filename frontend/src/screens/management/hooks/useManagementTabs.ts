import { useState } from 'react'

import type { Aba } from '../types'

export function useManagementTabs(
  abaInicial: Aba = 'funcionarios',
) {
  const [aba, setAba] = useState<Aba>(abaInicial)

  return {
    aba,
    setAba,
  }
}   