import { useState } from 'react'
import { CheckCircle2, Briefcase, Bot, ShieldCheck, LineChart, Info, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export const InvestimentosPage = () => {
  const [aceitoTermos, setAceitoTermos] = useState(false)
  const [valorAporte, setValorAporte] = useState('')

  const handleSolicitar = (e: React.FormEvent) => {
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

    // Lógica futura de integração
    toast.success('Solicitação enviada com sucesso! Nossa equipe entrará em contato.')
    setValorAporte('')
    setAceitoTermos(false)
  }

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Header */}
      <div>
        <h2 className="font-display font-semibold text-white">Investimento em Banca Gerenciada</h2>
        <p className="text-xs text-slate-500 mt-0.5">Evolua sua gestão com nossa operação automatizada e profissional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Resumo 1: Saldo Disponível (Mock) */}
        <div className="card p-5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Saldo Disponível na Corretora</span>
          </div>
          <p className="text-3xl font-bold text-white">R$ 0,00</p>
        </div>

        {/* Card Resumo 2: Total Investido (Mock) */}
        <div className="card p-5 bg-gradient-to-br from-green-900/40 to-surface-100 border-green-900/50 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <LineChart size={16} className="text-green-400" />
            <span className="text-sm font-medium text-green-400/80 uppercase tracking-wider">Total em Gestão</span>
          </div>
          <p className="text-3xl font-bold text-green-400">R$ 0,00</p>
        </div>
      </div>

      {/* 2. Como Funciona */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Info size={16} className="text-blue-400" /> Como Funciona o Serviço
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 border-l-2 border-l-blue-500">
            <Briefcase size={20} className="text-blue-400 mb-2" />
            <h4 className="font-semibold text-white text-sm">1. Aporte de Capital</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Você define o valor que deseja colocar sob gestão técnica na nossa plataforma.</p>
          </div>
          <div className="card p-4 border-l-2 border-l-purple-500">
            <Bot size={20} className="text-purple-400 mb-2" />
            <h4 className="font-semibold text-white text-sm">2. Operação Automatizada</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Nossa inteligência e traders executam as ordens sem que você precise abrir a corretora.</p>
          </div>
          <div className="card p-4 border-l-2 border-l-red-500">
            <ShieldCheck size={20} className="text-red-400 mb-2" />
            <h4 className="font-semibold text-white text-sm">3. Gestão de Risco</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Aplicamos critérios rigorosos de stake e stop-loss para proteger seu patrimônio.</p>
          </div>
          <div className="card p-4 border-l-2 border-l-green-500">
            <LineChart size={20} className="text-green-400 mb-2" />
            <h4 className="font-semibold text-white text-sm">4. Acompanhamento</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">Você visualiza os resultados em tempo real através do dashboard de relatórios.</p>
          </div>
        </div>
      </div>

      {/* 3. O Termo de Adesão */}
      <div className="card p-6 flex flex-col lg:flex-row gap-6 border-surface-300">
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" /> Termo de Adesão e Ciência
          </h3>
          <div className="bg-surface-300/30 border border-surface-400 rounded-xl p-5 h-72 overflow-y-auto custom-scrollbar text-xs text-slate-300 leading-relaxed pr-6">
            <p className="font-bold text-white mb-4 text-center text-sm">TERMO DE ADESÃO – GESTÃO DE BANCA AUTOMATIZADA</p>
            
            <p className="font-bold text-white mt-4 mb-1">1. OBJETO E SERVIÇO</p>
            <p>O presente termo dispõe sobre a adesão do USUÁRIO ao serviço de Banca Gerenciada, onde o capital aportado será movimentado de forma automatizada pelo sistema. O serviço engloba a análise, definição de estratégias, gestão de risco e a execução técnica das ordens no mercado esportivo.</p>
            
            <p className="font-bold text-white mt-6 mb-1">2. RESPONSABILIDADE TÉCNICA</p>
            <p>O sistema compromete-se a operar utilizando protocolos de gestão técnica, visando a preservação do capital e a busca por rentabilidade. O USUÁRIO declara ciência de que:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>A operação é 100% automatizada, sem necessidade de intervenção manual;</li>
              <li>As decisões de entrada (stakes) e saídas são determinadas exclusivamente pela estratégia do sistema.</li>
            </ul>

            <p className="font-bold text-white mt-6 mb-1">3. RISCOS E RENTABILIDADE</p>
            <p>O USUÁRIO declara estar ciente de que o mercado esportivo é um mercado de renda variável.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Resultados passados não garantem lucros futuros;</li>
              <li>Embora existam travas de segurança e gestão de risco rigorosa, o capital está sujeito às oscilações inerentes ao mercado.</li>
            </ul>

            <p className="font-bold text-white mt-6 mb-1">4. TAXAS E COMISSIONAMENTO</p>
            <p>A adesão ao serviço implica na aceitação do modelo de divisão de lucros ou taxas de performance previamente estabelecidos no painel principal do sistema.</p>

            <p className="font-bold text-white mt-6 mb-1">5. VIGÊNCIA E RESGATE</p>
            <p>Este contrato entra em vigor no momento da confirmação do aporte. As regras para solicitação de resgate, prazos de processamento e carência (se houver) seguem as diretrizes configuradas na carteira do investidor.</p>

            <p className="font-bold text-white mt-6 mb-1">6. DECLARAÇÃO DE CONCORDÂNCIA</p>
            <p>Ao clicar em "SOLICITAR ADERÊNCIA", o USUÁRIO afirma ter lido, compreendido e aceitado todos os pontos acima, autorizando o sistema a iniciar as operações em sua conta/sub-contrato.</p>
          </div>
        </div>

        {/* Formulário de Aporte */}
        <div className="w-full lg:w-80 flex flex-col justify-end gap-5">
           <form onSubmit={handleSolicitar} className="flex flex-col gap-4 bg-surface-200/50 p-5 rounded-xl border border-surface-300">
             
             <div>
               <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Valor do Aporte (R$)</label>
               <input 
                 type="number"
                 step="0.01"
                 min="1"
                 required
                 placeholder="0.00"
                 value={valorAporte}
                 onChange={e => setValorAporte(e.target.value)}
                 className="input-field w-full py-3 px-4 text-lg font-bold text-white bg-surface-300 focus:ring-green-500/50 transition-all font-mono"
               />
             </div>

             <label className="flex items-start gap-3 cursor-pointer group mt-2">
               <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                 <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={aceitoTermos}
                  onChange={(e) => setAceitoTermos(e.target.checked)}
                 />
                 <div className="w-5 h-5 rounded border border-surface-400 bg-surface-300 peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors flex items-center justify-center">
                   <CheckCircle2 size={14} className={`text-white transition-transform ${aceitoTermos ? 'scale-100' : 'scale-0'}`} />
                 </div>
               </div>
               <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed select-none">
                 Li e concordo com os termos de gestão automatizada.
               </span>
             </label>

             <button 
               type="submit"
               disabled={!aceitoTermos || !valorAporte || parseFloat(valorAporte) <= 0}
               className="w-full mt-2 bg-green-600 hover:bg-green-500 disabled:bg-surface-400 disabled:text-slate-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg hover:shadow-green-900/40 disabled:shadow-none flex items-center justify-center gap-2"
             >
               SOLICITAR ADERÊNCIA
             </button>
           </form>
        </div>
      </div>
    </div>
  )
}
