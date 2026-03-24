import { useState } from 'react'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

export const InvestimentosPage = () => {
  const { user } = useAuth()
  const [aceitoTermos, setAceitoTermos] = useState(false)
  const [valorAporte, setValorAporte] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aceitoTermos) {
      toast.error('Você precisa aceitar os termos para prosseguir.')
      return
    }
    const valor = parseFloat(valorAporte)
    if (isNaN(valor) || valor <= 0) {
      toast.error('Informe um valor de aporte válido.')
      return
    }

    setLoading(true)
    try {
      await api.post('/solicitacoes', { valorAporte: valor, termoAceito: true })
      if (user) addLog({ userEmail: user.email, userName: user.name, userRole: user.role, category: 'Financeiro', action: 'Solicitação de aporte', detail: `Solicitou aporte de R$ ${valor.toFixed(2)}` })
      toast.success('Sua solicitação foi enviada e está em análise pela nossa equipe técnica.')
      setValorAporte('')
      setAceitoTermos(false)
    } catch {
      toast.error('Erro ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 transition-colors duration-300">
      {/* 1. Header */}
      <div>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl">Gestão de Banca Gerenciada</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Leia atentamente o contrato e defina o valor do seu aporte.</p>
      </div>

      {/* 2. Aviso Legal Curto */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl flex gap-3 shadow-sm">
        <ShieldAlert className="text-amber-600 dark:text-amber-500 shrink-0" size={20} />
        <div className="text-[11px] lg:text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed font-medium">
          <p className="mb-1.5 font-bold uppercase tracking-wider">Aviso Legal Importante</p>
          <p>
            Este serviço consiste na gestão de apostas esportivas realizada de forma privada e mediante autorização do cliente.
            Não se trata de investimento financeiro, não há garantia de lucro, e existem riscos de perda parcial ou total do valor utilizado.
            Ao continuar, você declara estar ciente dos riscos envolvidos nas apostas esportivas.
          </p>
        </div>
      </div>

      {/* 3. O Termo de Adesão e Formulário */}
      <div className="bg-white dark:bg-surface-200 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 flex flex-col lg:flex-row gap-10 shadow-sm">
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-widest flex items-center gap-2">
            CONTRATO DE PRESTAÇÃO DE SERVIÇO
          </h3>
          <div className="bg-slate-50 dark:bg-surface-300/30 border border-slate-100 dark:border-surface-400 rounded-2xl p-6 h-96 overflow-y-auto custom-scrollbar text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-4">
            <p className="font-black text-slate-900 dark:text-white text-center text-sm mb-6 underline decoration-green-500/30 underline-offset-4">
              GESTÃO DE APOSTAS ESPORTIVAS
            </p>
            
            <p className="italic">O presente termo tem como objetivo formalizar a prestação de serviço de gestão de apostas esportivas realizada de forma privada, mediante autorização do cliente.</p>

            <div className="space-y-4 font-medium">
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">1.</span> O serviço consiste na execução e gerenciamento de apostas esportivas com valores previamente definidos pelo cliente.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">2.</span> O cliente declara estar ciente de que apostas esportivas envolvem risco, podendo ocorrer ganhos ou perdas, inclusive perda total do valor utilizado.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">3.</span> Não há qualquer promessa ou garantia de lucro, rendimento ou resultado positivo.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">4.</span> O valor enviado pelo cliente será utilizado exclusivamente para realização de apostas esportivas conforme a estratégia adotada.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">5.</span> O cliente autoriza a realização das apostas em seu nome ou sob sua autorização, estando ciente dos riscos da atividade.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">6.</span> O prestador do serviço poderá cobrar taxa de administração ou comissão sobre resultados, conforme acordado previamente.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">7.</span> O cliente poderá solicitar encerramento da gestão a qualquer momento, estando ciente de que valores em operação podem estar sujeitos a resultados ainda não finalizados.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">8.</span> Este serviço não constitui investimento financeiro, fundo, carteira administrada, banco, corretora ou qualquer tipo de instituição financeira.</p>
              
              <p><span className="font-bold text-slate-900 dark:text-white mr-1">9.</span> Ao aceitar este termo, o cliente declara que leu, compreendeu e concorda com todas as condições acima.</p>
            </div>
          </div>
        </div>

        {/* Formulário de Aporte */}
        <div className="w-full lg:w-96 flex flex-col justify-center">
           <form onSubmit={handleSolicitar} className="flex flex-col gap-5 bg-slate-50 dark:bg-surface-300/20 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
             
             <div>
               <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest">Valor do Aporte (BRL)</label>
               <div className="relative group">
                 <CurrencyInput
                   value={valorAporte ? Number(valorAporte) : 0}
                   onChange={(v) => setValorAporte(String(v))}
                   alertLimit={100}
                   className="w-full py-4 text-2xl font-display font-bold bg-white dark:bg-surface-100 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white transition-all group-focus-within:ring-2 group-focus-within:ring-green-500/20"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-bold pointer-events-none transition-colors group-focus-within:text-green-500">BRL</div>
               </div>
               <p className="text-[9px] text-slate-400 mt-2 italic px-1">Mínimo sugerido: R$ 100,00 para gestão eficiente.</p>
             </div>

             <div className="h-px bg-slate-200 dark:bg-white/5 my-1" />

             <label className="flex items-start gap-4 cursor-pointer group select-none">
               <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                 <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={aceitoTermos}
                  onChange={(e) => setAceitoTermos(e.target.checked)}
                 />
                 <div className="w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-surface-100 peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center shadow-sm">
                   <div className={`w-2.5 h-2.5 bg-white rounded-sm transition-transform duration-200 ${aceitoTermos ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                 </div>
               </div>
               <span className="text-[11px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-relaxed font-medium">
                 Declaro que li e aceito os termos do serviço de gestão de apostas esportivas, estando ciente de que não há garantia de lucro e que posso perder o valor utilizado.
               </span>
             </label>

             <button 
               type="submit"
               disabled={!aceitoTermos || !valorAporte || parseFloat(valorAporte) <= 0 || loading}
               className="w-full mt-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 dark:disabled:bg-surface-100 disabled:text-slate-400 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-lg shadow-green-500/10 hover:shadow-green-500/30 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
             >
               {loading ? (
                 <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               ) : 'SOLICITAR ADERÊNCIA'}
             </button>
           </form>

           <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400">
             <CheckCircle2 size={12} className="text-green-500" />
             <span>Processamento em até 24h úteis</span>
           </div>
        </div>
      </div>
    </div>
  )
}
