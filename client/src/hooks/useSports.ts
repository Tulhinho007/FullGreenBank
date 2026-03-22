import { useState, useEffect } from 'react'
import { sportsService, Sport } from '../services/cadastros.service'

// Hook compartilhado — busca esportes do banco e faz cache em memória
let cachedSports: Sport[] | null = null

export const useSports = () => {
  const [sports, setSports]   = useState<Sport[]>(cachedSports || [])
  const [loading, setLoading] = useState(!cachedSports)

  useEffect(() => {
    if (cachedSports) return
    setLoading(true)
    sportsService.getAll()
      .then(data => {
        cachedSports = data
        setSports(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { sports, loading }
}
