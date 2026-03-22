import { useState, useRef } from 'react'
import { Camera, X, Loader2, Upload, Zap } from 'lucide-react'
import { SportSelect } from './SportSelect'

type TipoBilhete = 'simples' | 'multipla' | 'criar-aposta' | 'multipla-criar-aposta'

interface BilheteScannerProps {
  onSimples: (data: any) => void
  onMultipla: (data: any) => void
  onCriarAposta: (data: any) => void
  onMultiplaCriarAposta: (data: any) => void
}

const TIPO_LABELS: Record<TipoBilhete, string> = {
  'simples':               '📋 Simples',
  'multipla':              '🔢 Múltipla',
  'criar-aposta':          '⭐ Criar Aposta',
  'multipla-criar-aposta': '🔢⭐ Múltipla + CA',
}

export const BilheteScanner = ({ onSimples, onMultipla, onCriarAposta, onMultiplaCriarAposta }: BilheteScannerProps) => {
  const [isOpen, setIsOpen]   = useState(false)
  const [image, setImage]     = useState<string | null>(null)
  const [tipo, setTipo]       = useState<TipoBilhete>('multipla')
  const [sport, setSport]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // Comprime a imagem antes de salvar
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = new Image()

  img.onload = () => {
    // Reduz para no máximo 1200px de largura
    const maxW = 1200
    const ratio = Math.min(1, maxW / img.width)
    canvas.width  = img.width  * ratio
    canvas.height = img.height * ratio
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Converte para JPEG com 80% de qualidade
    setImage(canvas.toDataURL('image/jpeg', 0.8))
  }

  img.src = URL.createObjectURL(file)
  setError(null)
}

  const buildPrompt = (t: TipoBilhete): string => {
    if (t === 'simples') {
      return `Leia este bilhete de aposta e extraia os dados. Responda APENAS com JSON válido, sem texto adicional:
{"event":"Nome do jogo/evento","market":"Mercado da aposta","odds":1.85,"stake":50.00,"sport":"Futebol"}`
    }
    if (t === 'multipla') {
      return `Leia este bilhete de aposta múltipla e extraia todos os jogos. Responda APENAS com JSON válido, sem texto adicional:
{"stake":10.00,"oddTotal":5.20,"jogos":[{"mandante":"Time A","visitante":"Time B","mercado":"Resultado Final","selecao":"Time A","odd":1.80,"resultado":"PENDING"}]}`
    }
    if (t === 'criar-aposta') {
      return `Leia este bilhete de Criar Aposta / Bet Builder e extraia os dados. Responda APENAS com JSON válido, sem texto adicional:
{"event":"Nome do jogo","stake":10.00,"odds":2.05,"sport":"Futebol","mercados":["Time A - Resultado Final","Mais de 1.5 Gols"]}`
    }
    return `Leia este bilhete de aposta múltipla com Criar Aposta e extraia todos os dados. Responda APENAS com JSON válido, sem texto adicional:
{"stake":10.00,"jogos":[{"mandante":"Newcastle United","visitante":"Sunderland","odd":2.05,"resultado":"PENDING","mercados":[{"selecao":"Newcastle United","mercado":"Resultado Final"},{"selecao":"Mais de 1.5","mercado":"Total de Gols Mais/Menos"}]}]}`
  }

  const handleScan = async () => {
    if (!image) return
    setLoading(true)
    setError(null)

    try {
      const base64    = image.split(',')[1]
      const mediaType = image.split(';')[0].split(':')[1] as 'image/jpeg' | 'image/png' | 'image/webp'
      const prompt    = buildPrompt(tipo)
      const token     = localStorage.getItem('token')

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/scan-bilhete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: mediaType, data: base64 },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      })

      if (!response.ok) throw new Error(`Erro ${response.status} ao processar imagem`)

      const data = await response.json()
      const text = data.content?.[0]?.text || ''

      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/)
      const jsonStr   = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text

      let parsed: any
      try {
        parsed = JSON.parse(jsonStr.trim())
      } catch {
        throw new Error('Não consegui ler o bilhete. Tente uma foto mais nítida.')
      }

      if (sport) parsed.sport = sport

      if (tipo === 'simples') onSimples(parsed)
      else if (tipo === 'multipla') onMultipla(parsed)
      else if (tipo === 'multipla-criar-aposta') onMultiplaCriarAposta(parsed)
      else onCriarAposta(parsed)

      setIsOpen(false)
      setImage(null)
      setTipo('multipla')
      setSport('')

    } catch (err: any) {
      setError(err.message || 'Erro ao processar imagem.')
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => { setIsOpen(false); setImage(null); setError(null); setSport('') }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
        <Zap size={15} /> Scan Bilhete
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-100 border border-surface-300 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        <div className="flex items-center justify-between p-5 border-b border-surface-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Zap size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Scan de Bilhete</h2>
              <p className="text-xs text-slate-500">IA lê e preenche o modal automaticamente</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surface-300 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* Tipo */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Tipo de Aposta</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TIPO_LABELS) as TipoBilhete[]).map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    tipo === t ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-surface-400 bg-surface-300 text-slate-400 hover:text-white'
                  }`}>
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Esporte */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Esporte</label>
            <SportSelect value={sport} onChange={setSport} />
          </div>

          {/* Upload */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Foto do Bilhete</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            {!image ? (
              <button onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-surface-400 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group">
                <div className="w-12 h-12 rounded-full bg-surface-300 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Camera size={22} className="text-slate-500 group-hover:text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Clique para selecionar</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP — screenshot ou foto</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Upload size={12} /> Suporta bilhetes da Betano, Bet365 e outras casas
                </div>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-surface-300">
                <img src={image} alt="Bilhete" className="w-full max-h-72 object-contain bg-surface-300" />
                <button onClick={() => setImage(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  ✓ Imagem carregada
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 flex items-start gap-2">
              <X size={14} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={closeModal} className="flex-1 btn-secondary py-2.5 text-sm">Cancelar</button>
            <button onClick={handleScan} disabled={!image || loading}
              className="flex-[2] py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: !image || loading ? undefined : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: !image || loading ? undefined : '0 4px 14px rgba(124,58,237,0.3)',
              }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Lendo bilhete...</> : <><Zap size={15} /> Gerar Modal</>}
            </button>
          </div>

          <p className="text-[10px] text-slate-600 text-center">
            A imagem é processada pela IA e descartada imediatamente — não é salva.
          </p>
        </div>
      </div>
    </div>
  )
}
