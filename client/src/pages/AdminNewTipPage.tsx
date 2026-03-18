import { useNavigate } from 'react-router-dom'
import { TrendingUp, ArrowLeft } from 'lucide-react'

/**
 * AdminNewTipPage
 *
 * A criação de dicas foi migrada para o modal inline da TipsPage (Dicas do Dia).
 * Esta página existe apenas para redirecionar usuários que acessem /admin/tips/new diretamente,
 * mantendo compatibilidade com links e logs existentes.
 *
 * Para criar uma nova dica, use o botão "+ Nova Dica" na página Dicas do Dia.
 */
export const AdminNewTipPage = () => {
  const navigate = useNavigate()

  return (
    <div className="max-w-md mx-auto mt-12 text-center flex flex-col items-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
        <TrendingUp size={28} className="text-green-600 dark:text-green-400" />
      </div>

      <div>
        <h2 className="font-display font-semibold text-slate-900 dark:text-white text-lg mb-2">
          Nova Dica
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          A criação de dicas agora é feita diretamente na página{' '}
          <strong className="text-slate-700 dark:text-slate-200">Dicas do Dia</strong>{' '}
          pelo botão <strong className="text-green-600 dark:text-green-400">+ Nova Dica</strong>.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft size={15} />
          Voltar
        </button>
        <button
          onClick={() => navigate('/tips')}
          className="btn-primary flex items-center gap-2"
        >
          <TrendingUp size={15} />
          Ir para Dicas do Dia
        </button>
      </div>
    </div>
  )
}
