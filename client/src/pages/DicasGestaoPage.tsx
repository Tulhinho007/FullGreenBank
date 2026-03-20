import { 
  Shield, AlertTriangle, Zap, Target, 
  BarChart3, BookOpen, CheckCircle2, Trophy 
} from 'lucide-react'

export const DicasGestaoPage = () => {
  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-10">
      {/* Cabeçalho Centralizado */}
      <header className="flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-2">
          <BookOpen className="text-green-500" size={24} />
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Dicas de Gestão</h1>
        <p className="text-slate-400 text-base max-w-2xl">
          Estratégias e recomendações fundamentais para cada perfil de apostador manter a consistência a longo prazo.
        </p>
      </header>

      {/* Perfis de Apostador */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conservador */}
        <div className="card p-6 flex flex-col items-center text-center group hover:border-emerald-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <Shield className="text-emerald-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-emerald-500 mb-1">Conservador</h3>
          <span className="text-xs font-mono font-bold text-slate-500 mb-4 tracking-widest uppercase">1% a 3% diário</span>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Ideal para quem está começando ou prioriza a preservação total da banca.
          </p>
          <ul className="text-[11px] text-left space-y-3 text-slate-300 w-full">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> Stake fixa de 1-3% da banca por aposta
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> Stop loss diário de 5-10% da banca
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> Foco em odds entre 1.50 e 2.00
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> Máximo de 3-5 apostas por dia
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span> Crescimento lento mas consistente
            </li>
          </ul>
        </div>

        {/* Moderado */}
        <div className="card p-6 flex flex-col items-center text-center group hover:border-amber-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20 group-hover:scale-110 transition-transform">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-amber-500 mb-1">Moderado</h3>
          <span className="text-xs font-mono font-bold text-slate-500 mb-4 tracking-widest uppercase">3% a 9% diário</span>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Para apostadores com experiência que buscam crescimento mais rápido.
          </p>
          <ul className="text-[11px] text-left space-y-3 text-slate-300 w-full">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span> Stake de 3-5% da banca por aposta
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span> Stop loss diário de 15-20% da banca
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span> Odds entre 1.80 e 2.50 são aceitáveis
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span> Máximo de 5-8 apostas por dia
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span> Balanço entre risco e retorno
            </li>
          </ul>
        </div>

        {/* Agressivo */}
        <div className="card p-6 flex flex-col items-center text-center group hover:border-rose-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20 group-hover:scale-110 transition-transform">
            <Zap className="text-rose-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-rose-500 mb-1">Agressivo</h3>
          <span className="text-xs font-mono font-bold text-slate-500 mb-4 tracking-widest uppercase">Acima de 10% diário</span>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Apenas para profissionais com alta tolerância ao risco e banca dividida.
          </p>
          <ul className="text-[11px] text-left space-y-3 text-slate-300 w-full">
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">•</span> Stake de 5-10% da banca por aposta
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">•</span> Stop loss diário de 30% da banca
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">•</span> Aceita odds maiores (acima de 2.50)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">•</span> Volume maior de apostas diárias
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-500 mt-0.5">•</span> Alto risco de grandes perdas (Drawdown)
            </li>
          </ul>
        </div>
      </section>

      {/* Dicas Gerais */}
      <section className="space-y-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Dicas Gerais</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4 flex items-start gap-4 hover:bg-surface-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <Target className="text-red-500" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Defina Metas Realistas</h4>
              <p className="text-[11px] text-slate-400">Estabeleça metas diárias e mensais alcançáveis. Não seja ganancioso.</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-4 hover:bg-surface-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <BarChart3 className="text-blue-500" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Acompanhe Seus Resultados</h4>
              <p className="text-[11px] text-slate-400">Registre todas as apostas. Analise seus erros e acertos regularmente.</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-4 hover:bg-surface-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="text-amber-500" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Estude Constantemente</h4>
              <p className="text-[11px] text-slate-400">O conhecimento é seu maior aliado. Estude estatísticas e mercados.</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-4 hover:bg-surface-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-green-500" size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Disciplina é Tudo</h4>
              <p className="text-[11px] text-slate-400">Siga sua estratégia. Não aposte por impulso ou para recuperar perdas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Regras de Ouro */}
      <section className="card p-8 bg-gradient-to-br from-surface-200 to-green-900/5">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Trophy size={20} className="text-amber-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Regras de Ouro</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-sky-500 font-bold text-lg">1.</span>
            <h5 className="text-sm font-bold text-white">Nunca aposte mais do que pode perder</h5>
            <p className="text-xs text-slate-400">Sua banca deve ser um dinheiro "separado" de outras obrigações.</p>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-sky-500 font-bold text-lg">2.</span>
            <h5 className="text-sm font-bold text-white">Respeite sempre o stop loss</h5>
            <p className="text-xs text-slate-400">Dias ruins acontecem, proteja sua banca para o dia seguinte.</p>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-sky-500 font-bold text-lg">3.</span>
            <h5 className="text-sm font-bold text-white">Não aposte por emoção</h5>
            <p className="text-xs text-slate-400">Decisões racionais = lucro a longo prazo. Evite o 'tilt'.</p>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-sky-500 font-bold text-lg">4.</span>
            <h5 className="text-sm font-bold text-white">Diversifique suas apostas</h5>
            <p className="text-xs text-slate-400">Não coloque tudo em uma única aposta ou mercado.</p>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-sky-500 font-bold text-lg">5.</span>
            <h5 className="text-sm font-bold text-white">Mantenha registros detalhados</h5>
            <p className="text-xs text-slate-400">Dados são sua melhor ferramenta de análise e evolução.</p>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <span className="text-sky-500 font-bold text-lg">6.</span>
            <h5 className="text-sm font-bold text-white">Saiba quando parar</h5>
            <p className="text-xs text-slate-400">Tanto em dias bons quanto em dias ruins, o controle é seu.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
