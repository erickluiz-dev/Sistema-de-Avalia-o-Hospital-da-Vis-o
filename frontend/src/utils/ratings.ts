import type { RatingKey } from '../types'

export const RATINGS = {
  pessimo: {
    label: 'Péssimo',
    color: '#EF4444',
  },
  ruim: {
    label: 'Ruim',
    color: '#F97316',
  },
  razoavel: {
    label: 'Razoável',
    color: '#EAB308',
  },
  bom: {
    label: 'Bom',
    color: '#0eb374',
  },
  excelente: {
    label: 'Excelente',
    color: '#00B5CC',
  },
} as const

export function ratingLabel(
  rating: string | RatingKey,
): string {
  const normalized = rating
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalized in RATINGS) {
    return RATINGS[normalized as RatingKey].label
  }

  return rating
}

export function ratingColor(
  rating: string | RatingKey,
): string {
  const normalized = rating
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (normalized in RATINGS) {
    return RATINGS[normalized as RatingKey].color
  }

  return '#6b7280'
}