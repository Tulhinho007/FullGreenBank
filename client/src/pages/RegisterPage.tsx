import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [show,    setShow]    = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('As senhas não conferem'); return }
    if (form.password.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao cadastrar'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-emerald-600 mb-6 shadow-xl shadow-emerald-500/20">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="font-display font-black text-4xl text-slate-800 tracking-tight">Full Green Bank</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Crie sua conta gratuitamente</p>
        </div>

        <div className="bg-white border border-slate-100 p-8 lg:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
          <h2 className="font-display font-bold text-slate-800 text-2xl mb-8">Criar conta</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Nome completo</label>
                <input className="input-field" placeholder="Seu nome" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input-field" placeholder="(11) 99999-9999" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="seu@email.com" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    className="input-field pr-10"
                    placeholder="••••••"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirmar senha</label>
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  required
                />
              </div>
            </div>

            {/* Role info */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-[10px] font-bold text-emerald-700/80 leading-relaxed uppercase tracking-widest">
              🔒 Toda conta começa como <span className="text-emerald-900 font-black">Membro</span>. Admins podem promover sua conta.
            </div>

            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 mt-2 py-4 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Criando conta...</>
              ) : 'FINALIZAR CADASTRO'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8 font-bold">
            Já tem conta?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-500 font-black transition-colors">FAZER LOGIN</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
