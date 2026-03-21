import { Trophy, Activity, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ArenaClecioPage = () => {
  return (
    <div className="flex flex-col gap-8 w-full pb-20 max-w-6xl mx-auto relative px-4 md:px-0">
      
      {/* HEADER SECTION */}
      <header className="space-y-4">
        <div className="flex items-center gap-4">
           {/* BACK BUTTON */}
          <Link 
            to="/dashboard" 
            className="p-2 rounded-xl bg-slate-100 dark:bg-surface-300/10 border border-slate-200 dark:border-surface-400 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="text-green-500" /> Arena Clêcio - Futevôlei
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Gestão de desafios e apostas casadas.</p>
          </div>
        </div>
      </header>

      {/* Card de Nova Partida */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-3xl p-8 shadow-xl">
        <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Trophy size={22} className="text-yellow-500" /> Novo Desafio
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Dupla 1 */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dupla A</label>
            <input type="text" placeholder="Jogador 1" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" />
            <input type="text" placeholder="Jogador 2" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" />
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center text-3xl font-black text-green-500/30 italic select-none">
            VS
          </div>

          {/* Dupla 2 */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dupla B</label>
            <input type="text" placeholder="Jogador 3" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" />
            <input type="text" placeholder="Jogador 4" className="w-full bg-slate-50 dark:bg-surface-300/20 border border-slate-200 dark:border-surface-400 p-4 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all" />
          </div>

          {/* Detalhes da Aposta */}
          <div className="space-y-4 bg-green-500/5 dark:bg-green-500/10 p-6 rounded-3xl border border-dashed border-green-500/30">
            <div>
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Valor da Aposta (R$)</label>
              <input type="number" placeholder="0,00" className="w-full bg-transparent text-3xl font-display font-bold text-green-500 focus:outline-none" />
            </div>
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Sets</label>
                <select className="bg-transparent block text-slate-800 dark:text-white font-bold text-lg cursor-pointer outline-none">
                  <option value="1">1 Set</option>
                  <option value="3" selected>3 Sets</option>
                  <option value="5">5 Sets</option>
                </select>
              </div>
              <div className="flex-1 text-right">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 block">Pontos/Set</label>
                <input type="number" defaultValue="18" className="w-16 bg-transparent text-slate-800 dark:text-white font-bold text-lg text-right outline-none" />
              </div>
            </div>
          </div>
        </div>

        <button className="w-full mt-10 bg-green-500 hover:bg-green-400 text-black font-bold py-5 rounded-2xl transition-all shadow-xl shadow-green-500/20 active:scale-[0.98]">
          CRIAR NOVO DESAFIO
        </button>
      </div>

      {/* Lista de Partidas Ativas */}
      <div className="bg-white dark:bg-surface-200 border border-slate-200 dark:border-surface-400 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-100 dark:border-surface-300/50 bg-slate-50/50 dark:bg-surface-300/10">
            <h3 className="font-display font-bold text-slate-800 dark:text-white">Desafios Ativos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-surface-300/5 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5 border-b border-slate-100 dark:border-surface-300/50">Partida</th>
                <th className="px-8 py-5 text-center border-b border-slate-100 dark:border-surface-300/50">Valor</th>
                <th className="px-8 py-5 text-center border-b border-slate-100 dark:border-surface-300/50">Configuração</th>
                <th className="px-8 py-5 text-right border-b border-slate-100 dark:border-surface-300/50">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-300/50">
              <tr className="group hover:bg-slate-50/50 dark:hover:bg-surface-300/10 transition-colors">
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 dark:text-white">Giba / Renato</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest my-1">vs</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">Belo / Fabio</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                    <span className="inline-flex px-3 py-1 rounded-full bg-green-500/10 text-green-500 font-bold text-sm">
                        R$ 200,00
                    </span>
                </td>
                <td className="px-8 py-6 text-center text-slate-600 dark:text-slate-400 text-sm font-medium">Melhor de 3 / 18pts</td>
                <td className="px-8 py-6 text-right">
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-green-500 dark:hover:bg-green-500 hover:text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95">
                    Finalizar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
