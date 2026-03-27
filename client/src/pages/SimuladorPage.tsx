import React, { useState, useEffect, useMemo } from 'react'
import { Target, TrendingUp, AlertTriangle, ShieldCheck, Zap, Flame } from 'lucide-react'
import api from '../services/api'

interface ResultadoDia {
  dia: number
  meta_rs: number
  acumulado: number
}

export const SimuladorPage = () => {
  const [bancaAtual, setBancaAtual] = useState<number | ''>('')
  const [objetivo, setObjetivo] = useState<number | ''>('')
  const [metaPercent, setMetaPercent] = useState<number>(4)
  const [perfilAtivo, setPerfilAtivo] = useState<'CONSERVADOR' | 'MODERADO' | 'AGRESSIVO'>('MODERADO')
  
  const [loadingBanca, setLoadingBanca] = useState(true)

  useEffect(() => {
    // Buscar bancas ativas para pré-preencher
    api.get('/bancas')
      .then(res => {
        const bancas = res.data;
        if (bancas && bancas.length > 0) {
          // Soma inicial simples ou banca atual simulada.
          // Aqui tentamos pegar a bancaAtual (se o backend já entrega, ou iteramos em bancaInicial + saldo itens)
          let total = 0
          bancas.forEach((b: any) => {
             total += Number(b.bancaAtual || b.bancaInicial || 0)
          })
          if (total > 0) {
             setBancaAtual(total)
          }
        }
      })
      .catch(err => console.log('Erro ao buscar bancas p/ simulador:', err))
      .finally(() => setLoadingBanca(false))
  }, [])

  const setPerfil = (perfil: 'CONSERVADOR' | 'MODERADO' | 'AGRESSIVO', percent: number) => {
    setPerfilAtivo(perfil)
    setMetaPercent(percent)
  }

  const handleBancaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setBancaAtual(val > 0 ? val : '')
  }

  const handleObjetivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setObjetivo(val > 0 ? val : '')
  }
  
  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setMetaPercent(val)
    setPerfilAtivo('MODERADO') // Se mexeu manualmente, desativa estilos ativos
  }

  const simular = useMemo(() => {
    if (!bancaAtual || !objetivo || !metaPercent || metaPercent <= 0) return []
    if (bancaAtual >= objetivo) return []

    let saldo = Number(bancaAtual)
    let meta = Number(metaPercent)
    let dias = 0
    let resultados: ResultadoDia[] = []

    // Limite de segurança de 365 dias para evitar loops infinitos em caso de cálculos absurdos (ex: 0.001%)
    while (saldo < Number(objetivo) && dias < 365) {
      dias++
      let lucroDia = saldo * (meta / 100)
      saldo += lucroDia
      resultados.push({
        dia: dias,
        meta_rs: lucroDia,
        acumulado: Math.min(saldo, Number(objetivo)) // Não mostrar a mais que o objetivo final logicamente no último dia.
      })
    }
    return resultados
  }, [bancaAtual, objetivo, metaPercent])

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-3">
             <Target size={12} strokeWidth={3} /> Projeção de Crescimento
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">
            Simulador de Consistência
          </h1>
          <p className="text-sm font-bold text-slate-400 mt-1 max-w-xl leading-relaxed">
            Descubra quantos dias perfeitos de meta batida são necessários para alcançar a liberdade financeira com os juros compostos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LADO ESQUERDO: CONTROLES */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white border text-center border-slate-200 rounded-[2rem] p-5 shadow-sm flex flex-col gap-5">
            
            <div className="flex flex-col text-left">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">1. Estratégia / Perfil de Risco</label>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => setPerfil('CONSERVADOR', 2)}
                  className={`px-3 py-2.5 rounded-2xl border-2 transition-all flex items-center justify-between group ${perfilAtivo === 'CONSERVADOR' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${perfilAtivo === 'CONSERVADOR' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <ShieldCheck size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-black uppercase tracking-wide ${perfilAtivo === 'CONSERVADOR' ? 'text-emerald-700' : 'text-slate-600'}`}>Conservador</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proteção Máxima</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${perfilAtivo === 'CONSERVADOR' ? 'text-emerald-600' : 'text-slate-400'}`}>2.0% aa/d</span>
                </button>

                <button 
                  onClick={() => setPerfil('MODERADO', 4)}
                  className={`px-3 py-2.5 rounded-2xl border-2 transition-all flex items-center justify-between group ${perfilAtivo === 'MODERADO' ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-amber-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${perfilAtivo === 'MODERADO' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Zap size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-black uppercase tracking-wide ${perfilAtivo === 'MODERADO' ? 'text-amber-700' : 'text-slate-600'}`}>Moderado</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equilíbrio Ideal</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${perfilAtivo === 'MODERADO' ? 'text-amber-600' : 'text-slate-400'}`}>4.0% ao/d</span>
                </button>

                <button 
                  onClick={() => setPerfil('AGRESSIVO', 8)}
                  className={`px-3 py-2.5 rounded-2xl border-2 transition-all flex items-center justify-between group ${perfilAtivo === 'AGRESSIVO' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-rose-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${perfilAtivo === 'AGRESSIVO' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Flame size={16} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className={`text-xs font-black uppercase tracking-wide ${perfilAtivo === 'AGRESSIVO' ? 'text-rose-700' : 'text-slate-600'}`}>Agressivo</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alavancagem</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${perfilAtivo === 'AGRESSIVO' ? 'text-rose-600' : 'text-slate-400'}`}>8.0% ao/d</span>
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            <div className="flex flex-col gap-3 text-left">
               <div>
                 <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1 block">2. Valor Inicial (Banca)</label>
                 <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                   <input 
                     type="number" 
                     className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold pl-10 pr-4 py-2.5 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                     value={bancaAtual}
                     onChange={handleBancaChange}
                     placeholder={loadingBanca ? "Buscando..." : "100"}
                   />
                 </div>
               </div>

               <div>
                 <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1 block">3. Porcentagem Diária (%)</label>
                 <input 
                   type="number" 
                   step="0.1"
                   className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                   value={metaPercent}
                   onChange={handleMetaChange}
                   placeholder="Ex: 2.5"
                 />
               </div>

               <div>
                 <label className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-1 block">🎯 Objetivo Final</label>
                 <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">R$</div>
                   <input 
                     type="number" 
                     className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-lg pl-12 pr-4 py-3 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all"
                     value={objetivo}
                     onChange={handleObjetivoChange}
                     placeholder="10000"
                   />
                 </div>
               </div>
            </div>
          </div>
          
          {/* Rodapé Alerta */}
          <div className="p-4 bg-yellow-50/50 border border-yellow-200/50 rounded-2xl flex gap-3 items-start">
             <AlertTriangle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
             <p className="text-[10px] text-yellow-700/80 font-bold uppercase tracking-widest leading-relaxed">
               As simulações consideram dias de 100% de aproveitamento. Na realidade, enfrentamos oscilações, red's e dias neutros. Mantenha os pés no chão.
             </p>
          </div>
        </div>

        {/* LADO DIREITO: RESULTADOS / TABELA */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {simular.length > 0 ? (
            <>
              {/* HERO RESULT CARD */}
              <div className="bg-emerald-600 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 blur-2xl rounded-full -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10">
                  <p className="text-emerald-100 font-black tracking-widest uppercase text-xs mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Resumo do Cenário
                  </p>
                  
                  <h2 className="text-white font-display text-4xl md:text-5xl font-black tracking-tight leading-tight mb-6">
                    Você precisará de <span className="text-yellow-400">{simular.length} dias</span> perfeitos.
                  </h2>

                  <div className="flex flex-wrap items-center justify-between gap-6 border-t border-emerald-500/30 pt-6">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest">Rentabilidade Diária Média (Fim)</span>
                        <span className="text-white text-lg font-black tracking-widest">
                          + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simular[simular.length-1].meta_rs)} /dia
                        </span>
                     </div>
                     <div className="flex flex-col gap-1 text-right">
                        <span className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest">Retorno S. Investimento</span>
                        <span className="text-white text-lg font-black tracking-widest">
                          + {(((Number(objetivo) - Number(bancaAtual)) / Number(bancaAtual)) * 100).toFixed(1)}%
                        </span>
                     </div>
                  </div>
                </div>
              </div>

              {/* DATA TABLE */}
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    Projeção Passo a Passo
                  </h3>
                  {simular.length === 365 && <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest border border-amber-200 bg-amber-50 px-2 py-1 rounded-md">Máx Cap 365 Dias</span>}
                </div>
                
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="sticky top-0 bg-white shadow-sm z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                        <th className="py-4 px-6 border-b border-slate-100 w-24">Dia</th>
                        <th className="py-4 px-6 border-b border-slate-100 hidden sm:table-cell">Meta Exigida (R$)</th>
                        <th className="py-4 px-6 border-b border-slate-100 text-right">Saldo Projetado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {simular.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-3 px-6">
                            <span className="font-mono font-bold text-slate-500 text-xs">#{row.dia.toString().padStart(3, '0')}</span>
                          </td>
                          <td className="py-3 px-6 hidden sm:table-cell">
                             <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-md">
                               <TrendingUp size={10} /> + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.meta_rs)}
                             </div>
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className="font-mono text-[13px] font-black text-slate-900 tracking-tight">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.acumulado)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Rodapé Tabela */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                   <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                     As metas diárias calculadas são os lucros limpos necessários para aquele dia específico.
                   </p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center animate-pulse">
              <Target size={48} strokeWidth={1} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-display font-medium text-slate-500 mb-2">Preencha os dados ao lado</h3>
              <p className="text-sm font-medium text-slate-400 max-w-sm">
                Insira sua banca inicial e o valor que deseja alcançar para que possamos traçar o seu mapa da consistência.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
