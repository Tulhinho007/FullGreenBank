import { useState } from 'react'
import { NumericFormat } from 'react-number-format'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  placeholder?: string
  className?: string
  alertLimit?: number  // padrão R$ 1.000,00
  disabled?: boolean
  allowNegative?: boolean
}

const HIGH_VALUE_LIMIT = 1000

export const CurrencyInput = ({
  value,
  onChange,
  label,
  placeholder = 'R$ 0,00',
  className = '',
  alertLimit = HIGH_VALUE_LIMIT,
  disabled = false,
  allowNegative = false,
}: CurrencyInputProps) => {
  const [pendingValue, setPendingValue] = useState<number | null>(null)
  const [showConfirm, setShowConfirm]   = useState(false)

  const handleValueChange = (values: { floatValue?: number }) => {
    const newValue = values.floatValue ?? 0

    if (newValue >= alertLimit) {
      setPendingValue(newValue)
      setShowConfirm(true)
    } else {
      onChange(newValue)
    }
  }

  const handleConfirm = () => {
    if (pendingValue !== null) onChange(pendingValue)
    setShowConfirm(false)
    setPendingValue(null)
  }

  const handleCancel = () => {
    setShowConfirm(false)
    setPendingValue(null)
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        {label && <label className="label">{label}</label>}
        <NumericFormat
          value={value || ''}
          onValueChange={handleValueChange}
          thousandSeparator="."
          decimalSeparator=","
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          allowNegative={allowNegative}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${className}`}
        />
      </div>

      {/* Modal de confirmação de valor alto */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm"
             style={{ animation: 'fadeIn .2s ease' }}>
          <div className="bg-surface-200 border border-surface-300 rounded-2xl p-8 max-w-sm w-[92%] shadow-2xl"
               style={{ animation: 'slideUp .25s ease' }}>
            <div className="text-4xl mb-4 text-center">⚠️</div>
            <h3 className="text-white font-bold text-xl text-center mb-2">
              Valor Alto Detectado
            </h3>
            <p className="text-slate-400 text-sm text-center mb-6">
              Você está prestes a confirmar um valor de{' '}
              <span className="text-yellow-400 font-bold text-base">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(pendingValue ?? 0)}
              </span>
              . Tem certeza?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 btn-primary"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}