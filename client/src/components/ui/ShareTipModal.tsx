import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, Download, Share2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Tip {
  id: string
  title: string
  description: string
  sport: string
  event: string
  market: string
  odds: number
  stake: number
  result?: string
  profit?: number
  tipDate: string
}

interface ShareTipModalProps {
  isOpen: boolean
  onClose: () => void
  tip: Tip
}

const formatBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatDate = (iso: string) => {
  const d = new Date(iso)
  const day = d.getDate().toString().padStart(2, '0')
  const m = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').charAt(0).toUpperCase() + d.toLocaleString('pt-BR', { month: 'short' }).slice(1).replace('.', '')
  const yr = d.getFullYear()
  const hs = d.getHours().toString().padStart(2, '0')
  const ms = d.getMinutes().toString().padStart(2, '0')
  return `${day} ${m} ${yr} • ${hs}:${ms}`
}

export function ShareTipModal({ isOpen, onClose, tip }: ShareTipModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  if (!isOpen) return null

  const potentialReturn = tip.stake * tip.odds
  const status = tip.result || 'PENDING'

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    const toastId = toast.loading('Gerando imagem...')
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, // High resolution matching standard photo size
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })
      
      const link = document.createElement('a')
      link.download = `tip-${tip.event.replace(/\s+/g, '-').toLowerCase()}-${tip.id.slice(0,5)}.png`
      link.href = dataUrl
      link.click()
      toast.success('Imagem baixada com sucesso!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar a imagem.', { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  // Visual Setup matching Photo 2
  const isGreen = status === 'GREEN'
  const isRed = status === 'RED'
  const isVoid = status === 'VOID'

  let resultColor = 'text-amber-400'
  let resultBg = 'bg-[#182e1e]/50 text-amber-400'
  let resultText = 'PENDENTE'
  let profitText = 'Aguardando'
  
  if (isGreen) {
    resultColor = 'text-[#00ff41]' 
    resultBg = 'bg-[#0a2612]'
    resultText = '✓ GREEN'
    profitText = `+${formatBRL(tip.profit ?? (potentialReturn - tip.stake))}`
  } else if (isRed) {
    resultColor = 'text-[#ff003c]'
    resultBg = 'bg-[#2a0e14]'
    resultText = 'X RED'
    profitText = `-${formatBRL(tip.stake)}`
  } else if (isVoid) {
    resultColor = 'text-slate-400'
    resultBg = 'bg-slate-800/40'
    resultText = '⚪ ANULADO'
    profitText = 'R$ 0,00'
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Modal Container */}
        <div className="bg-surface-200 border border-surface-400 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-900/50 flex items-center justify-center border border-green-500/20">
                <Share2 size={18} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Compartilhar Tip</h3>
                <p className="text-xs text-slate-400">Preview do card formato quadrado/feed</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-surface-300 p-2 rounded-lg">
              <X size={16} />
            </button>
          </div>

          {/* Content area: Scaled wrapper for preview */}
          <div className="p-8 bg-surface-300 flex-1 overflow-y-auto flex items-center justify-center relative">
            <div className="relative w-full max-w-[500px]">
               {/* ───────────────────────────────────────────── */}
               {/* THE ACTUAL SHARE CARD Node to capture */}
               {/* ───────────────────────────────────────────── */}
               <div
                 ref={cardRef}
                 className="relative w-full bg-[#08150c] border border-[#1b3623] text-white flex flex-col font-sans rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                 style={{
                   // Optional: subtle radial gradient to mimic the center glow from Photo 2
                   backgroundImage: 'radial-gradient(circle at top right, #0b2213 0%, #08150c 60%)'
                 }}
               >
                 {/* Top Row: Logo and Date */}
                 <div className="px-8 pt-8 flex items-center justify-between">
                   <div className="font-extrabold text-[#00ff41] tracking-tighter text-xl">
                     FullGreen
                   </div>
                   <div className="text-[#64856f] font-medium text-sm">
                     {formatDate(tip.tipDate)}
                   </div>
                 </div>

                 {/* Match Info */}
                 <div className="px-8 pt-8 pb-6 border-b border-[#1b3623]/60 mb-2">
                   <h1 className="font-bold text-white text-3xl leading-tight tracking-tight mb-2">
                     {tip.event}
                   </h1>
                   <div className="text-[#64856f] text-[15px] font-medium">
                     {tip.market} <span className="mx-1">•</span> {tip.title.split('—')[1]?.trim() || tip.sport}
                   </div>
                 </div>

                 {/* Values Table */}
                 <div className="px-8 py-2 flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                     <span className="text-[#64856f] font-medium text-[15px]">Stake</span>
                     <span className="text-white font-bold text-lg">{formatBRL(tip.stake)}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-[#64856f] font-medium text-[15px]">Odd</span>
                     <span className="text-white font-bold text-lg">{tip.odds.toFixed(2)}</span>
                   </div>
                   <div className="flex items-center justify-between mt-2">
                     <span className="text-[#8ba895] font-semibold text-[15px]">Retorno Potencial</span>
                     <span className="text-white font-bold text-xl">{formatBRL(potentialReturn)}</span>
                   </div>
                 </div>

                 {/* Bottom Banner (Green/Red/Pending) */}
                 <div className="px-8 pt-6 pb-8">
                   <div className={`w-full rounded-2xl py-5 flex items-center justify-center gap-3 ${resultBg}`}>
                     <span className={`font-black tracking-widest text-xl uppercase ${resultColor}`}>
                       {resultText} <span className="ml-2 font-mono">{profitText}</span>
                     </span>
                   </div>
                 </div>
                 
               </div>
               {/* ───────────────────────────────────────────── */}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-surface-400 flex items-center justify-between bg-surface-200">
             <div className="flex-1 flex justify-end gap-3">
               <button onClick={onClose} className="px-5 py-3 rounded-xl border border-surface-400 text-slate-300 font-medium hover:bg-surface-300 transition-colors">
                 Cancelar
               </button>
               <button onClick={handleDownload} disabled={downloading}
                 className="flex items-center gap-2 px-6 py-3 bg-[#00ff41] hover:bg-[#00cc34] text-black font-bold rounded-xl transition-all disabled:opacity-50">
                 {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                 {downloading ? 'Gerando...' : 'Baixar Imagem'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </>
  )
}
