import { useState } from 'react'
import { CheckCircle2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { useAuth } from '../contexts/AuthContext'
import { addLog } from '../services/log.service'

/**
 * InvestimentosPage - Updated with specific legal contract and disclaimer.
 * Fix: all texts readable on both light and dark mode.
 */
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
      if (user) {
        addLog({ 
          userEmail: user.email, 
          userName: user.name, 
          userRole: user.role, 
          category: 'Financeiro', 
          action: 'Solicitação de aporte', 
          detail: `Solicitou aporte de R$ ${valor.toFixed(2)}` 
        })
      }
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
    <div className="flex flex-col gap-6 transition-colors duration-300" id="page-investimentos-v2">

      {/* 1. Header Principal */}
      <div>
        <h2 className="font-display font-bold text-slate-900 dark:text-white text-2xl">Gestão de Banca Gerenciada</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Leia atentamente o contrato e defina o valor do seu aporte para gestão privada.</p>
      </div>

      {/* 2. AVISO LEGAL CURTO */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 lg:p-5 rounded-2xl flex gap-4 shadow-sm">
        <ShieldAlert className="text-amber-600 dark:text-amber-500 shrink-0" size={24} />
        <div className="text-[11px] lg:text-xs leading-relaxed font-medium">
          {/* título: amarelo escuro no light, amarelo claro no dark */}
          <p className="mb-2 font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">AVISO LEGAL IMPORTANTE</p>
          {/* corpo: slate escuro no light (legível), amarelo claro no dark */}
          <div className="space-y-1 text-slate-700 dark:text-amber-200/80">
            <p>Este serviço consiste na gestão de apostas esportivas realizada de forma privada e mediante autorização do cliente.</p>
            <p>Não se trata de investimento financeiro, não há garantia de lucro, e existem riscos de perda parcial ou total do valor utilizado.</p>
            <p><strong>Ao continuar, você declara estar ciente dos riscos envolvidos nas apostas esportivas.</strong></p>
          </div>
        </div>
      </div>

      {/* 3. CONTRATO + FORMULÁRIO */}
      <div className="bg-white dark:bg-surface-200 p-6 lg:p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 flex flex-col lg:flex-row gap-10 shadow-sm transition-all duration-300">
        
        {/* Lado Esquerdo: O Contrato */}
        <div className="flex-1 flex flex-col">
          {/* título do contrato: sempre escuro no light, branco no dark */}
          <h3 className="text-xs lg:text-sm font-bold text-slate-900 dark:text-white mb-5 uppercase tracking-widest flex items-center gap-2">
            CONTRATO DE PRESTAÇÃO DE SERVIÇO – GESTÃO DE APOSTAS ESPORTIVAS
          </h3>

          {/* caixa de texto do contrato */}
          <div className="bg-slate-50 dark:bg-surface-300/30 border border-slate-200 dark:border-surface-400 rounded-2xl p-6 lg:p-8 h-[450px] overflow-y-auto custom-scrollbar leading-relaxed space-y-5
            text-xs lg:text-[13px]
            text-slate-700 dark:text-slate-300">

            <p className="italic border-b border-slate-200 dark:border-white/5 pb-4">
              O presente termo tem como objetivo formalizar a prestação de serviço de gestão de apostas esportivas realizada de forma privada, mediante autorização do cliente.
            </p>

            <div className="space-y-5 font-medium">
              {[
                'O serviço consiste na execução e gerenciamento de apostas esportivas com valores previamente definidos pelo cliente.',
                'O cliente declara estar ciente de que apostas esportivas envolvem risco, podendo ocorrer ganhos ou perdas, inclusive perda total do valor utilizado.',
                'Não há qualquer promessa ou garantia de lucro, rendimento ou resultado positivo.',
                'O valor enviado pelo cliente será utilizado exclusivamente para realização de apostas esportivas conforme a estratégia adotada.',
                'O cliente autoriza a realização das apostas em seu nome ou sob sua autorização, estando ciente dos riscos da atividade.',
                'O prestador do serviço poderá cobrar taxa de administração ou comissão sobre resultados, conforme acordado previamente.',
                'O cliente poderá solicitar encerramento da gestão a qualquer momento, estando ciente de que valores em operação podem estar sujeitos a resultados ainda não finalizados.',
                'Este serviço não constitui investimento financeiro, fundo, carteira administrada, banco, corretora ou qualquer tipo de instituição financeira.',
                'Ao aceitar este termo, o cliente declara que leu, compreendeu e concorda com todas as condições acima.',
              ].map((text, i) => (
                <p key={i}>
                  {/* número do item: sempre bem visível */}
                  <span className="font-bold text-slate-900 dark:text-white mr-2">{i + 1}.</span>
                  {text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário de Aporte */}
        <div className="w-full lg:w-[400px] flex flex-col justify-start pt-2">
          <form onSubmit={handleSolicitar} className="flex flex-col gap-6 bg-slate-50 dark:bg-surface-300/20 p-6 lg:p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
            
            <div>
              {/* label legível em ambos os modos */}
              <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-widest">
                Valor do Aporte Planejado (BRL)
              </label>
              <div className="relative group">
                <CurrencyInput
                  value={valorAporte ? Number(valorAporte) : 0}
                  onChange={(v) => setValorAporte(String(v))}
                  alertLimit={100}
                  className="w-full py-5 text-3xl font-display font-bold bg-white dark:bg-surface-100 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white transition-all group-focus-within:ring-2 group-focus-within:ring-green-500/20 shadow-sm"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold pointer-events-none transition-colors group-focus-within:text-green-500">BRL</div>
              </div>
              {/* hint legível em ambos os modos */}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2.5 italic px-1">
                Defina o montante que deseja disponibilizar para a gestão.
              </p>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/5 my-2" />

            {/* Checkbox */}
            <label className="flex items-start gap-4 cursor-pointer group select-none">
              <div className="relative flex items-center justify-center mt-1 shrink-0">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={aceitoTermos}
                  onChange={(e) => setAceitoTermos(e.target.checked)}
                />
                <div className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-white/10 bg-white dark:bg-surface-100 peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={16} className={`text-white transition-all duration-200 ${aceitoTermos ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                </div>
              </div>
              {/* texto do checkbox: slate escuro no light, slate claro no dark */}
              <span className="text-[11px] lg:text-xs text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-relaxed font-semibold">
                Declaro que li e aceito os termos do serviço de gestão de apostas esportivas, estando ciente de que não há garantia de lucro e que posso perder o valor utilizado.
              </span>
            </label>

            <button 
              type="submit"
              disabled={!aceitoTermos || !valorAporte || parseFloat(valorAporte) <= 0 || loading}
              className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-200 dark:disabled:bg-surface-100 disabled:text-slate-500 dark:disabled:text-slate-500 text-white font-bold py-5 px-4 rounded-2xl transition-all shadow-lg shadow-green-500/10 hover:shadow-green-500/30 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95 text-sm uppercase tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : 'Solicitar Aderência'}
            </button>
          </form>

          {/* rodapé do formulário */}
          <div className="mt-8 flex flex-col items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-green-500" />
              <span>Análise técnica prioritária</span>
            </div>
            <span>Processamento em até 24h úteis</span>
          </div>
        </div>
      </div>
    </div>
  )
}
