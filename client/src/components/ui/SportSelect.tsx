import { useEffect, useState } from 'react'
import api from '../../services/api'

interface Sport {
  id: string
  name: string
  emoji: string
}

interface SportSelectProps {
  value: string
  onChange: (v: string) => void
  className?: string
  required?: boolean
}

export const SportSelect = ({ value, onChange, className = '', required }: SportSelectProps) => {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/cadastros/sports')
      .then(res => setSports(res.data))
      .catch(() => setSports([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      disabled={loading}
      className={`input-field py-2.5 px-3 w-full bg-surface-200 ${className}`}
    >
      <option value="">{loading ? 'Carregando...' : '— Selecione o esporte —'}</option>
      {sports.map(s => (
        <option key={s.id} value={s.name}>
          {s.emoji} {s.name}
        </option>
      ))}
    </select>
  )
}