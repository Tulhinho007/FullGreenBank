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
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-100">
              <span className="text-4xl text-amber-500">⚠️</span>
            </div>
            <h3 className="text-slate-800 font-display font-black text-2xl text-center mb-3 tracking-tight">
              Valor Elevado
            </h3>
            <p className="text-slate-400 font-medium text-center mb-10 leading-relaxed">
              Você está prestes a confirmar um aporte de{' '}
              <span className="text-emerald-600 font-display font-black text-lg block mt-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(pendingValue ?? 0)}
              </span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
              >
                Confirmar Aporte
              </button>
              <button
                onClick={handleCancel}
                className="w-full py-4 rounded-2xl bg-white text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 border border-slate-100 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}