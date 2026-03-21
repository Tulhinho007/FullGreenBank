import { useState } from 'react';
import { Trophy, Activity, ArrowLeft, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ArenaClecioPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const handleCreateMatch = () => {
    alert("Funcionalidade de criação será implementada com a integração do Backend!");
  };

  const handleFinalize = (match: any) => {
    setSelectedMatch(match);
    setShowModal(true);
  };

  const confirmFinalize = (winner: string) => {
    alert(`Partida finalizada! Vencedor: ${winner}`);
    setShowModal(false);
  };

  return (
    <div className="flex flex-col gap-8 w-full pb-20 max-w-6xl mx-auto relative px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <header className="relative pt-10 pb-6">
        <div className="flex flex-col items-center justify-center text-center relative px-16">
            {/* BACK BUTTON - Aligned with the content flow but absolute for layering */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2">
                <Link 
                    to="/dashboard" 
                    className="p-3.5 rounded-2xl bg-white dark:bg-surface-300/10 border border-slate-200 dark:border-surface-400 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shadow-sm group"
                >
                    <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="space-y-1.5 px-4">
                <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-4">
                    <Activity className="text-green-500 w-8 h-8 md:w-10 md:h-10" /> Arena Clêcio
                </h1>
                <p className="text-slate-700 dark:text-slate-200 font-semibold text-base md:text-lg">Gestão de desafios e apostas casadas.</p>
            </div>
        </div>
      </header>

      {/* RESUMO FINANCEIRO - O Pulo do Gato */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 p-8 rounded-[2rem] shadow-xl flex items-center gap-6 group hover:border-green-500/50 transition-all">
              <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Activity size={32} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Jogos Criados (Hoje)</p>
                  <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">12</p>
              </div>
          </div>

          <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 p-8 rounded-[2rem] shadow-xl flex items-center gap-6 group hover:border-green-500/50 transition-all">
              <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Trophy size={32} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Apostado (Hoje)</p>
                  <p className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                      <span className="text-green-500/50 text-xl mr-1">R$</span>1.500,00
                  </p>
              </div>
          </div>

          <div className="hidden lg:flex bg-green-500 p-8 rounded-[2rem] shadow-xl shadow-green-500/20 items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-black/10 flex items-center justify-center text-black/40 shrink-0">
                  <CheckCircle size={32} />
              </div>
              <div className="text-black">
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Status da Arena</p>
                  <p className="text-2xl font-display font-bold leading-tight">Arena Ativa & Monitorada</p>
              </div>
          </div>
      </div>

      {/* Card de Nova Partida */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy size={22} className="text-yellow-500" /> Novo Desafio
            </h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                <Info size={12} /> Preencha para Iniciar
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Dupla 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dupla A (Mandante)</label>
            </div>
            <input type="text" placeholder="Jogador 1" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm" />
            <input type="text" placeholder="Jogador 2" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm" />
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center text-4xl font-black text-green-500/20 italic select-none">
            VS
          </div>

          {/* Dupla 2 */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Dupla B (Visitante)</label>
            <input type="text" placeholder="Jogador 3" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm" />
            <input type="text" placeholder="Jogador 4" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all shadow-sm" />
          </div>

          {/* Detalhes da Aposta */}
          <div className="space-y-4 bg-green-500/5 dark:bg-green-500/10 p-6 rounded-3xl border border-dashed border-green-500/30">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 block">Valor da Aposta (R$)</label>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-green-500/50">R$</span>
                <input type="number" placeholder="50" className="w-full bg-transparent text-4xl font-display font-bold text-green-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-green-500/20 pt-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Sets</label>
                <select className="bg-transparent block text-slate-800 dark:text-white font-bold text-lg cursor-pointer outline-none w-full">
                  <option value="1">1 Set</option>
                  <option value="3" defaultValue="3">Melhor de 3</option>
                  <option value="5">Melhor de 5</option>
                </select>
              </div>
              <div className="text-right">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Pts/Set</label>
                <input type="number" defaultValue="18" className="w-full bg-transparent text-slate-800 dark:text-white font-bold text-xl text-right outline-none" />
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCreateMatch}
          className="w-full mt-14 bg-green-500 hover:bg-green-400 text-black font-black text-lg py-6 rounded-3xl transition-all shadow-2xl shadow-green-500/30 active:scale-[0.98] uppercase tracking-wider"
        >
          CRIAR NOVO DESAFIO
        </button>
      </div>

      {/* Lista de Partidas Ativas */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-8 border-b border-slate-100 dark:border-surface-300/50 flex items-center justify-between bg-slate-50/50 dark:bg-surface-300/10">
            <h3 className="font-display font-bold text-slate-800 dark:text-white text-lg">Desafios Ativos</h3>
            <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Em tempo real</span>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-300/5 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-6 border-b border-slate-100 dark:border-surface-300/50">Partida / Duplas</th>
                <th className="px-8 py-6 text-center border-b border-slate-100 dark:border-surface-300/50">Investimento</th>
                <th className="px-8 py-6 text-center border-b border-slate-100 dark:border-surface-300/50">Configuração</th>
                <th className="px-8 py-6 text-center border-b border-slate-100 dark:border-surface-300/50">Placar Atual</th>
                <th className="px-8 py-6 text-right border-b border-slate-100 dark:border-surface-300/50">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-300/50">
              <tr className="group hover:bg-slate-50/50 dark:hover:bg-surface-300/10 transition-colors">
                <td className="px-8 py-8">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-900 dark:text-white">Giba / Renato</span>
                      <span className="text-[9px] text-green-500 font-black uppercase">Dupla A</span>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200 dark:bg-surface-300/50 origin-center rotate-[20deg]" />
                    <div className="flex flex-col items-start text-slate-500 dark:text-slate-400">
                      <span className="font-bold">Belo / Fabio</span>
                      <span className="text-[9px] text-slate-400 font-black uppercase">Dupla B</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-8 text-center">
                    <span className="inline-flex px-4 py-1.5 rounded-2xl bg-green-500/10 text-green-500 font-bold text-base shadow-sm ring-1 ring-green-500/20">
                        R$ 200,00
                    </span>
                </td>
                <td className="px-8 py-8 text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-slate-600 dark:text-slate-300 text-sm font-bold">Melhor de 3</span>
                        <span className="text-[10px] text-slate-400 font-medium">Sets de 18 pontos</span>
                    </div>
                </td>
                <td className="px-8 py-8 text-center">
                    <div className="inline-flex items-center gap-3 bg-slate-900 dark:bg-surface-300 text-white dark:text-slate-900 px-4 py-2 rounded-2xl font-display font-black text-xl shadow-lg ring-4 ring-slate-100 dark:ring-surface-400">
                        1 <span className="opacity-30">-</span> 0
                    </div>
                </td>
                <td className="px-8 py-8 text-right">
                  <button 
                    onClick={() => handleFinalize({ teamA: "Giba / Renato", teamB: "Belo / Fabio" })}
                    className="bg-green-500 text-black hover:bg-green-400 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    Finalizar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-surface-200 w-full max-w-lg rounded-[2.5rem] border border-slate-200 dark:border-surface-400 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 text-center">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-yellow-500/5">
                    <Trophy className="text-yellow-500" size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">Finalizar Partida</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-10 px-4 text-sm font-medium">Confirme a dupla vencedora para processar o resultado financeiro.</p>
                
                <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={() => confirmFinalize(selectedMatch?.teamA)}
                        className="group flex flex-col items-center p-6 rounded-3xl bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 hover:border-green-500 hover:bg-green-500/5 transition-all text-left relative overflow-hidden"
                    >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Vencedor sugerido</span>
                        <span className="text-xl font-display font-bold text-slate-900 dark:text-white">{selectedMatch?.teamA}</span>
                        <div className="absolute top-4 right-4 text-green-500 opacity-0 group-hover:opacity-100 transition-all">
                            <CheckCircle size={24} />
                        </div>
                    </button>

                    <button 
                        onClick={() => confirmFinalize(selectedMatch?.teamB)}
                        className="group flex flex-col items-center p-6 rounded-3xl bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 hover:border-green-500 hover:bg-green-500/5 transition-all text-left relative overflow-hidden"
                    >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Outro Vencedor</span>
                        <span className="text-xl font-display font-bold text-slate-900 dark:text-white">{selectedMatch?.teamB}</span>
                        <div className="absolute top-4 right-4 text-green-500 opacity-0 group-hover:opacity-100 transition-all">
                            <CheckCircle size={24} />
                        </div>
                    </button>
                </div>

                <div className="mt-10 flex flex-col gap-4">
                    <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold">
                        <AlertTriangle size={14} /> Essa ação não pode ser desfeita.
                    </div>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-black uppercase text-[10px] tracking-widest pt-2"
                    >
                        Cancelar Operação
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

