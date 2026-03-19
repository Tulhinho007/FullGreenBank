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
        pixelRatio: 3,
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

  const isGreen = status === 'GREEN'
  const isRed = status === 'RED'
  const isVoid = status === 'VOID'

  const bannerBg = isGreen ? '#0a2612' : isRed ? '#2a0e14' : '#182e1e'
  const statusColor = isGreen ? '#00ff41' : isRed ? '#ff4d4d' : '#fbbf24'
  const statusLabel = isGreen ? '✓ GREEN' : isRed ? 'X RED' : isVoid ? '⚪ ANULADO' : 'PENDENTE'
  const profitLabel = isGreen
    ? `+${formatBRL(tip.profit ?? (potentialReturn - tip.stake))}`
    : isRed
    ? `-${formatBRL(tip.stake)}`
    : isVoid ? 'R$ 0,00' : 'Aguardando'

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

          {/* Content area */}
          <div className="p-8 bg-surface-300 flex-1 overflow-y-auto flex items-center justify-center relative">
            <div className="relative w-full max-w-[500px]">
              {/* ── THE SHARE CARD NODE TO CAPTURE ── */}
              <div
                ref={cardRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  background: 'radial-gradient(circle at top right, #0b2213 0%, #08150c 60%)',
                  border: '1px solid #1b3623',
                  borderRadius: '24px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'sans-serif',
                  color: '#ffffff',
                }}
              >
                {/* Watermark */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden', zIndex: 1 }}>
                  <span style={{ fontWeight: 900, letterSpacing: '0.1em', color: '#ffffff', opacity: 0.04, transform: 'rotate(-45deg)', userSelect: 'none', fontSize: '48px', whiteSpace: 'nowrap' }}>
                    KamaelzinhoTips
                  </span>
                </div>

                {/* Top Row: Logo and Date */}
                <div style={{ padding: '32px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 800, color: '#00ff41', letterSpacing: '-0.05em', fontSize: '1.25rem' }}>
                    FullGreen
                  </div>
                  <div style={{ color: '#64856f', fontWeight: 500, fontSize: '0.875rem' }}>
                    {formatDate(tip.tipDate)}
                  </div>
                </div>

                {/* Match Info */}
                <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid rgba(27,54,35,0.6)', marginBottom: '8px', position: 'relative', zIndex: 10 }}>
                  <h1 style={{ fontWeight: 700, fontSize: '1.875rem', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '8px', color: '#ffffff' }}>
                    {tip.event}
                  </h1>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#64856f' }}>
                    {tip.market} <span style={{ margin: '0 4px' }}>•</span> {tip.title.split('—')[1]?.trim() || tip.sport}
                  </div>
                </div>

                {/* Values Table */}
                <div style={{ padding: '8px 32px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#64856f' }}>Stake</span>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{formatBRL(tip.stake)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#64856f' }}>Odd</span>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{tip.odds.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#8ba895' }}>Retorno Potencial</span>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff' }}>{formatBRL(potentialReturn)}</span>
                  </div>
                </div>

                {/* Bottom Banner */}
                <div style={{ padding: '24px 32px 32px', position: 'relative', zIndex: 10 }}>
                  <div style={{
                    width: '100%',
                    borderRadius: '1rem',
                    padding: '20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    backgroundColor: bannerBg,
                  }}>
                    <span style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '1.2rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: statusColor }}>{statusLabel}</span>
                      <span style={{ fontFamily: 'monospace', color: '#ffffff', fontWeight: 700 }}>{profitLabel}</span>
                    </span>
                  </div>
                </div>

              </div>
              {/* ── END SHARE CARD ── */}
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
