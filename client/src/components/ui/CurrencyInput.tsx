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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-300 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-4xl mb-6 text-center">⚠️</div>
            <h3 className="text-slate-900 dark:text-white font-display font-bold text-xl text-center mb-2">
              Valor Alto Detectado
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 leading-relaxed">
              Você está prestes a confirmar um aporte de{' '}
              <span className="text-green-600 dark:text-green-400 font-bold text-base">
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
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-surface-300 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-200 dark:hover:bg-surface-400 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all active:scale-95"
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