import {
  Angry,
  Frown,
  Meh,
  Smile,
  Laugh,
} from 'lucide-react'

import type { RatingKey } from '../types'

export const RATINGS: { key: RatingKey; label: string; color: string; bg: string; border: string; shadow: string; Icon: React.ElementType }[] = [
  { key: 'pessimo',   label: 'Péssimo',   color: '#C0392B', bg: '#FEF2F2', border: '#FECACA', shadow: 'rgba(192,57,43,0.25)',   Icon: Angry  },
  { key: 'ruim',      label: 'Ruim',      color: '#E05A2B', bg: '#FFF7ED', border: '#FED7AA', shadow: 'rgba(224,90,43,0.25)',   Icon: Frown  },
  { key: 'razoavel',  label: 'Razoável',  color: '#E8862A', bg: '#FEFCE8', border: '#FDE68A', shadow: 'rgba(232,134,42,0.25)',  Icon: Meh    },
  { key: 'bom',       label: 'Bom',       color: '#7DC36B', bg: '#F0FDF4', border: '#BBF7D0', shadow: 'rgba(125,195,107,0.25)', Icon: Smile  },
  { key: 'excelente', label: 'Excelente', color: '#2EAA4A', bg: '#F0FDF4', border: '#86EFAC', shadow: 'rgba(46,170,74,0.25)',   Icon: Laugh  },
]