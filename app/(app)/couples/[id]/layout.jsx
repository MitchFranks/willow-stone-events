import { couples } from '@/lib/mock/records'

export function generateStaticParams() {
  return couples.map((c) => ({ id: c.id }))
}

export const dynamicParams = false

export default function CoupleLayout({ children }) {
  return children
}
