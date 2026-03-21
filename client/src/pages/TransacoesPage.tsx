import { useState } from 'react'
import {
  BadgeDollarSign,
  ArrowDownCircle,
  Wallet,
  Hourglass,
  Filter,
  Plus
} from 'lucide-react'
import { Modal } from '../components/ui/Modal'

export const TransacoesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Depósitos & Saques</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Controle financeiro completo por casa de apostas
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20"
        >
          <Plus size={18} />
          Nova Transação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Depósitos */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Total Depósitos</span>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
              <BadgeDollarSign className="text-yellow-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-500 tracking-tight">R$ 0,00</p>
        </div>

        {/* Total Saques */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Total Saques</span>
            <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
              <ArrowDownCircle className="text-pink-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500 tracking-tight">R$ 0,00</p>
        </div>

        {/* Saldo Líquido */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Saldo Líquido</span>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
              <Wallet className="text-blue-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-500 tracking-tight">R$ 0,00</p>
        </div>

        {/* Pendentes */}
        <div className="card p-5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">Pendentes</span>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
              <Hourglass className="text-orange-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-500 tracking-tight">0</p>
        </div>

      </div>

      {/* Linha de Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-surface-300/50 flex items-center justify-center shrink-0 border border-surface-300">
          <Filter size={18} className="text-slate-500" />
        </div>

        <select className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300">
          <option value="">Todas as casas</option>
        </select>

        <select className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300">
          <option value="">Todos os tipos</option>
          <option value="DEPOSITO">Depósito</option>
          <option value="SAQUE">Saque</option>
        </select>

        <select className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300">
          <option value="">Todos os métodos</option>
          <option value="PIX">PIX</option>
          <option value="CARTAO">Cartão</option>
          <option value="BOLETO">Boleto</option>
        </select>

        <select className="input-field w-auto min-w-[150px] h-10 md:h-11 bg-surface-300/50 border-surface-300 text-sm cursor-pointer rounded-xl text-slate-600 dark:text-slate-300">
          <option value="">Todos os status</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="PENDENTE">Pendente</option>
          <option value="RECUSADO">Recusado</option>
        </select>
      </div>

      {/* Área da Tabela */}
      <div className="card overflow-hidden bg-white dark:bg-surface-200">

        {/* Cabeçalho da Tabela */}
        <div className="hidden md:grid grid-cols-[110px_100px_1.5fr_120px_120px_120px_2fr_80px] gap-4 px-6 py-4 bg-slate-50 dark:bg-surface-300/30 border-b border-slate-100 dark:border-surface-300 text-[11px] font-bold text-slate-500 uppercase tracking-widest items-center">
          <span>Data</span>
          <span>Tipo</span>
          <span>Casa</span>
          <span>Valor</span>
          <span>Método</span>
          <span>Status</span>
          <span>Observação</span>
          <span className="text-right pr-4">Ações</span>
        </div>

        {/* Corpo da Tabela (Vazia) */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-400 text-sm font-medium">Nenhuma transação registrada ainda.</p>
        </div>

      </div>

      {/* ── Modal de Nova Transação ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Transação"
        size="md"
      >
        <form className="flex flex-col gap-4 text-slate-700 dark:text-slate-300">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data *</label>
              <input type="date" className="input-field text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo *</label>
              <select className="input-field text-sm cursor-pointer">
                <option value="DEPOSITO">Depósito</option>
                <option value="SAQUE">Saque</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (R$) *</label>
            <input type="number" step="0.01" className="input-field text-sm" placeholder="0,00" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Site / Casa *</label>
            <select className="input-field text-sm cursor-pointer">
              <option value="">Selecione...</option>
              <option value="BET365">Bet365</option>
              <option value="PINNACLE">Pinnacle</option>
              <option value="BETANO">Betano</option>
              <option value="FAIRLAY">Fairlay</option>
              <option value="BETFAIR">Betfair</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Método *</label>
            <select className="input-field text-sm cursor-pointer">
              <option value="">Selecione...</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO">Cartão de Crédito</option>
              <option value="BOLETO">Boleto</option>
              <option value="CARTEIRA">Carteira Digital (Skrill, Neteller)</option>
              <option value="CRIPTO">Criptomoeda</option>
              <option value="TRANSFERENCIA">Transferência Bancária</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
            <select className="input-field text-sm cursor-pointer">
              <option value="CONCLUIDO">Concluído</option>
              <option value="PENDENTE">Pendente</option>
              <option value="RECUSADO">Recusado</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observação</label>
            <textarea 
              className="input-field text-sm resize-none" 
              rows={3} 
              placeholder="Ex: bônus, rollover, saque parcial..."
            ></textarea>
          </div>

          {/* Botões do Rodapé */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary py-3 text-sm font-bold border-slate-200 dark:border-surface-400"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              onClick={(e) => { e.preventDefault(); setIsModalOpen(false); }}
              className="py-3 px-4 bg-[#0bb489] hover:bg-[#0aa07a] text-white font-bold rounded-lg transition-colors text-sm shadow-sm"
            >
              Registrar
            </button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
