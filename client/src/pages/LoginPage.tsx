import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ identifier: '', password: '' })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!form.identifier.trim()) {
      toast.error('Informe seu e-mail ou usuário')
      return
    }
    if (!form.password) {
      toast.error('Informe sua senha')
      return
    }

    setLoading(true)
    try {
      // Detecta automaticamente se digitou email ou username
      const isEmail = form.identifier.includes('@')
      const payload = isEmail
        ? { email: form.identifier.trim(), password: form.password }
        : { username: form.identifier.trim(), password: form.password }

      await login(payload as any, form.password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const status = (err as any)?.response?.status
      const msg    = (err as any)?.response?.data?.message ?? ''
      const lower  = msg.toLowerCase()

      if (status === 404 || lower.includes('not found') || lower.includes('encontrado') || lower.includes('usuário não')) {
        const isEmail = form.identifier.includes('@')
        toast.error(isEmail
          ? 'Nenhuma conta encontrada com esse e-mail.'
          : 'Usuário não encontrado. Verifique o nome de usuário.'
        )
      } else if (status === 401 || lower.includes('senha') || lower.includes('password') || lower.includes('credencial') || lower.includes('incorrect')) {
        toast.error('Senha incorreta. Tente novamente.')
      } else if (status === 403 || lower.includes('inativ') || lower.includes('bloquead') || lower.includes('suspens')) {
        toast.error('Conta inativa ou bloqueada. Entre em contato com o suporte.')
      } else if (msg) {
        toast.error(msg)
      } else {
        toast.error('Não foi possível fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-green-900/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-900/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-700 mb-4 logo-glow">
            <TrendingUp size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Full Green Bank</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão inteligente de banca</p>
        </div>

        {/* Card */}
        <div className="card border border-surface-400 p-8">
          <h2 className="font-display font-semibold text-white text-xl mb-6">Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">E-mail ou usuário</label>
              <input
                type="text"
                className="input-field"
                placeholder="seu@email.com ou @usuario"
                value={form.identifier}
                onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))}
                autoComplete="username"
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
              className="btn-primary mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Entrando...</>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Não tem conta?{' '}
            <Link to="/register" className="text-green-400 hover:text-green-300 font-medium">
              Cadastrar-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
