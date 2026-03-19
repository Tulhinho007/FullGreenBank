import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, Download, Share2, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
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
  const m = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
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
      // html-to-image setup for high-res output
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Double resolution for crisp quality
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

  // Visual Setup
  const isGreen = status === 'GREEN'
  const isRed = status === 'RED'
  const isPending = status === 'PENDING'
  const isVoid = status === 'VOID'

  let resultColor = 'text-amber-400'
  let resultBg = 'bg-amber-500/10 border-amber-500/20'
  let resultText = 'PENDENTE'
  let ResultIcon = AlertCircle
  let profitText = 'Aguardando'
  
  if (isGreen) {
    resultColor = 'text-[#00ff41]' // Neon Green
    resultBg = 'bg-[#00ff41]/10 border-[#00ff41]/20'
    resultText = 'GREEN'
    ResultIcon = CheckCircle2
    profitText = `+${formatBRL(tip.profit ?? (potentialReturn - tip.stake))}`
  } else if (isRed) {
    resultColor = 'text-[#ff003c]' // Neon Red
    resultBg = 'bg-[#ff003c]/10 border-[#ff003c]/20'
    resultText = 'RED'
    ResultIcon = XCircle
    profitText = `-${formatBRL(tip.stake)}`
  } else if (isVoid) {
    resultColor = 'text-slate-300'
    resultBg = 'bg-slate-300/10 border-slate-300/20'
    resultText = 'ANULADO'
    ResultIcon = AlertCircle
    profitText = 'R$ 0,00'
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        {/* Modal Container */}
        <div className="bg-surface-200 border border-surface-400 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-900/50 flex items-center justify-center border border-green-500/20">
                <Share2 size={18} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Compartilhar Tip</h3>
                <p className="text-xs text-slate-400">Gere um card para o Instagram ou Facebook</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-surface-300 p-2 rounded-lg">
              <X size={16} />
            </button>
          </div>

          {/* Content area: Scaled wrapper for preview */}
          <div className="p-6 bg-surface-300 flex-1 overflow-y-auto flex items-center justify-center relative">
            
            <div className="scale-container relative flex justify-center items-center h-full w-full max-h-[60vh] overflow-hidden">
               {/* Fixed container size for 1080x1920 scaled down via CSS */}
               <div className="relative overflow-hidden" style={{
                  width: '1080px',
                  height: '1920px',
                  transform: 'scale(calc(min(1, 100% / 1080, 60vh / 1920)))', // Scaled to fit container visually
                  transformOrigin: 'top center'
               }}>
                 {/* ───────────────────────────────────────────── */}
                 {/* THE ACTUAL SHARE CARD Node to capture */}
                 {/* ───────────────────────────────────────────── */}
                 <div
                   ref={cardRef}
                   className="absolute inset-0 bg-[#06110a] text-white flex flex-col font-sans"
                   style={{
                     // Carbon Fiberish / Deep mesh gradient
                     backgroundImage: 'radial-gradient(circle at 50% 0%, #0a2514 0%, #06110a 70%), url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%230f301b\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")'
                   }}
                 >
                   {/* Top Border Highlight */}
                   <div className="h-4 w-full bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-60" />

                   {/* Header */}
                   <div className="px-16 pt-24 pb-8 flex items-center justify-between">
                     <div className="font-extrabold text-[#00ff41] tracking-tighter" style={{ fontSize: '3rem' }}>
                       FullGreen
                     </div>
                     <div className="text-slate-300 font-medium tracking-widest text-right" style={{ fontSize: '1.4rem' }}>
                       {formatDate(tip.tipDate)}
                     </div>
                   </div>

                   {/* Main Content */}
                   <div className="flex-1 px-16 flex flex-col justify-center">
                     
                     {/* Tip Title (Match) */}
                     <div className="mb-16">
                       <h1 className="font-black text-white leading-tight mb-4" style={{ fontSize: '5rem', textShadow: '0 8px 30px rgba(0,0,0,0.8)' }}>
                         {tip.event}
                       </h1>
                       <h2 className="text-[#00ff41] font-semibold tracking-wide uppercase" style={{ fontSize: '2rem' }}>
                         {tip.market} <span className="text-slate-400 mx-2">•</span> <span className="text-slate-200">{tip.title.split('—')[1]?.trim() || tip.sport}</span>
                       </h2>
                     </div>

                     {/* Glassmorphic Details Card */}
                     <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-12 mb-16 shadow-2xl relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                       
                       <div className="flex flex-col gap-10 relative z-10 w-full">
                         
                         {/* Stake & Odd Row */}
                         <div className="flex items-center justify-between w-full border-b border-white/10 pb-10">
                           <div className="flex flex-col">
                             <span className="text-slate-400 uppercase tracking-widest font-bold mb-2 text-2xl">Stake</span>
                             <span className="text-white font-mono font-bold text-5xl">{formatBRL(tip.stake)}</span>
                           </div>
                           <div className="w-[2px] h-24 bg-white/10 mx-8" />
                           <div className="flex flex-col items-end">
                             <span className="text-slate-400 uppercase tracking-widest font-bold mb-2 text-2xl">Odd</span>
                             <span className="text-[#00ff41] font-mono font-bold text-6xl drop-shadow-[0_0_15px_rgba(0,255,65,0.4)]">@{tip.odds.toFixed(2)}</span>
                           </div>
                         </div>

                         {/* Potential Return Row */}
                         <div className="flex items-center justify-between w-full">
                           <span className="text-slate-300 uppercase tracking-widest font-bold text-2xl">Retorno Potencial</span>
                           <span className="text-white font-mono font-bold text-5xl">{formatBRL(potentialReturn)}</span>
                         </div>
                       </div>
                     </div>

                   </div>

                   {/* Bottom Result Banner */}
                   {(!isPending || true) && (
                     <div className="px-16 pb-24">
                       <div className={`rounded-[2.5rem] p-10 flex items-center justify-center gap-8 border-[3px] shadow-2xl ${resultBg}`}>
                         <ResultIcon className={resultColor} style={{ width: '5rem', height: '5rem' }} strokeWidth={2.5} />
                         <div className="flex flex-col">
                           <span className={`font-black tracking-tight ${resultColor}`} style={{ fontSize: '5rem', lineHeight: '1' }}>
                             ✓ {resultText}
                           </span>
                           <span className={`font-mono font-bold mt-2 ${resultColor}`} style={{ fontSize: '3rem', opacity: 0.9 }}>
                             {profitText}
                           </span>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   {/* Bottom Border Highlight */}
                   <div className="mt-auto h-4 w-full bg-gradient-to-r from-transparent via-[#00ff41] to-transparent opacity-60" />

                 </div>
                 {/* ───────────────────────────────────────────── */}
               </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-surface-400 flex items-center justify-between bg-surface-200">
             <div className="flex-1 flex justify-end gap-3">
               <button onClick={onClose} className="px-5 py-3 rounded-xl border border-surface-400 text-slate-300 font-medium hover:bg-surface-300 transition-colors">
                 Cancelar
               </button>
               <button onClick={handleDownload} disabled={downloading}
                 className="flex items-center gap-2 px-6 py-3 bg-[#00ff41] hover:bg-[#00cc34] text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_25px_rgba(0,255,65,0.5)] transition-all disabled:opacity-50">
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
