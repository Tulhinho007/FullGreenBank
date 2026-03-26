import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ identifier: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    console.log('=== [LOGIN] SUBMIT CHAMADO ===')

    const identifierClean = form.identifier.trim()

    console.log('[LOGIN] identifier:', identifierClean)
    console.log('[LOGIN] password preenchida:', !!form.password)

    if (!identifierClean) {
      toast.error('Informe seu e-mail')
      return
    }
    if (!form.password) {
      toast.error('Informe sua senha')
      return
    }

    setLoading(true)
    try {
      const payload = { email: identifierClean, password: form.password }

      console.log('[LOGIN] payload enviado ao contexto:', payload)

      await login(payload as any)

      console.log('[LOGIN] Login bem-sucedido, redirecionando...')
      toast.success('Bem-vindo ao Full Green Bank!')
      navigate('/dashboard')
    } catch (err: any) {
      console.error('[LOGIN] ERRO CAPTURADO:', err)
      console.error('[LOGIN] err.response?.status:', err?.response?.status)
      console.error('[LOGIN] err.response?.data:', err?.response?.data)

      const status = err?.response?.status
      const backendMsg = err?.response?.data?.message || ''
      const lowerMsg = backendMsg.toLowerCase()

      console.log('[LOGIN] status:', status)
      console.log('[LOGIN] backendMsg:', backendMsg)

      if (status === 404 || lowerMsg.includes('encontrado') || lowerMsg.includes('not found')) {
        toast.error('E-mail não cadastrado.')
      } else if (status === 401 || lowerMsg.includes('senha') || lowerMsg.includes('incorrect')) {
        toast.error('Senha incorreta. Tente novamente.')
      } else if (status === 403 || lowerMsg.includes('bloquead') || lowerMsg.includes('inativ')) {
        toast.error('Sua conta está suspensa ou bloqueada.')
      } else {
        toast.error(backendMsg || 'Erro ao entrar. Verifique sua conexão.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 transition-colors duration-300">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10 flex flex-col items-center">
          <img src="/logo.png" alt="Full Green System" className="w-48 h-auto drop-shadow-2xl" />
        </div>

        <div className="nm-modal border-none p-8 lg:p-10 rounded-[2.5rem] shadow-slate-200/50">
          <h2 className="font-display font-bold text-slate-800 text-2xl mb-8">Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={form.identifier}
                onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-4 py-4 flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entrando...</>
              ) : 'Acessar Plataforma'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 font-bold">
            Não tem conta?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-500 font-black transition-colors">
              CRIAR CONTA AGORA
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
