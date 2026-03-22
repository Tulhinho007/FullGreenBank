interface SportSelectProps {
  value: string
  onChange: (v: string) => void
  className?: string
  required?: boolean
}

const SPORTS = [
  { id: '1', name: 'Futebol', emoji: '⚽' },
  { id: '2', name: 'Basquete', emoji: '🏀' },
  { id: '3', name: 'Vôlei', emoji: '🏐' },
]

export const SportSelect = ({ value, onChange, className = '', required }: SportSelectProps) => {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className={`input-field py-2.5 px-3 w-full bg-surface-200 ${className}`}
    >
      <option value="">— Selecione o esporte —</option>
      {SPORTS.map(s => (
        <option key={s.id} value={s.name}>
          {s.emoji} {s.name}
        </option>
      ))}
    </select>
  )
}