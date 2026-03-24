import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { X, Download, Share2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

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

export function ShareTipModal({ isOpen, onClose, tip }: ShareTipModalProps) {
  const { user } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const formatCurrency = (v: number) => 
    v.toLocaleString(user?.language === 'PT-BR' ? 'pt-BR' : 'en-US', { 
      style: 'currency', 
      currency: user?.currency || 'BRL' 
    })

  const formatTipDate = (iso: string) => {
    const d = new Date(iso)
    const locale = user?.language === 'PT-BR' ? 'pt-BR' : 'en-US'
    const day = d.getDate().toString().padStart(2, '0')
    const m = d.toLocaleString(locale, { month: 'short' }).replace('.', '').charAt(0).toUpperCase() + d.toLocaleString(locale, { month: 'short' }).slice(1).replace('.', '')
    const yr = d.getFullYear()
    const hs = d.getHours().toString().padStart(2, '0')
    const ms = d.getMinutes().toString().padStart(2, '0')
    return `${day} ${m} ${yr} • ${hs}:${ms}`
  }

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
    ? `+${formatCurrency(tip.profit ?? (potentialReturn - tip.stake))}`
    : isRed
    ? `-${formatCurrency(tip.stake)}`
    : isVoid ? (user?.currency === 'USD' ? '$ 0.00' : user?.currency === 'EUR' ? '€ 0,00' : 'R$ 0,00') : 'Aguardando'

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
        {/* Modal Container */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
          {/* Header */}
          <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                <Share2 size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Compartilhar Tip</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest underline decoration-emerald-200 decoration-2 underline-offset-4">Preview Social Card</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 hover:border-rose-200 text-slate-400 hover:text-rose-500 transition-all active:scale-90">
              <X size={20} />
            </button>
          </div>

          {/* Content area */}
          <div className="p-8 bg-slate-50 flex-1 overflow-y-auto flex items-center justify-center relative">
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
                    {formatTipDate(tip.tipDate)}
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
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{formatCurrency(tip.stake)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#64856f' }}>Odd</span>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#ffffff' }}>{tip.odds.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#8ba895' }}>Retorno Potencial</span>
                    <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ffffff' }}>{formatCurrency(potentialReturn)}</span>
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
          <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
             <div className="flex-1 flex justify-end gap-4">
               <button onClick={onClose} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                 Fechar
               </button>
               <button onClick={handleDownload} disabled={downloading}
                 className="flex items-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-95 disabled:opacity-50">
                 {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={20} />}
                 {downloading ? 'PROCESSANDO...' : 'Baixar Card'}
               </button>
             </div>
          </div>
        </div>
      </div>
    </>
  )
}
