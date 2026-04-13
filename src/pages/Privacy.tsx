import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-2">Politica de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Ultima atualizacao: 12 de abril de 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">1. Introducao</h2>
            <p className="text-muted-foreground leading-relaxed">
              A GeoTeach ("nos", "nosso") opera a plataforma GeoTeach (o "Servico").
              Esta pagina informa sobre nossas politicas relativas a coleta, uso e divulgacao
              de dados pessoais quando voce utiliza nosso Servico, em conformidade com a
              Lei Geral de Protecao de Dados (LGPD - Lei n 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">2. Dados Coletados</h2>
            <p className="text-muted-foreground leading-relaxed">Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Nome completo (fornecido no cadastro)</li>
              <li>Endereco de e-mail (para autenticacao e comunicacao)</li>
              <li>Dados de uso da plataforma (projetos criados, atividades)</li>
              <li>Informacoes do dispositivo (navegador, sistema operacional)</li>
              <li>Dados de instituicao de ensino (quando aplicavel)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">3. Finalidade do Tratamento</h2>
            <p className="text-muted-foreground leading-relaxed">Seus dados sao utilizados para:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Fornecer e manter o Servico</li>
              <li>Gerenciar sua conta e autenticacao</li>
              <li>Enviar comunicacoes sobre o Servico</li>
              <li>Melhorar a experiencia do usuario</li>
              <li>Cumprir obrigacoes legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">4. Base Legal (Art. 7, LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              O tratamento de dados pessoais e realizado com base no consentimento do titular (Art. 7, I),
              na execucao de contrato (Art. 7, V), e no interesse legitimo do controlador (Art. 7, IX).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">5. Compartilhamento de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados podem ser compartilhados com:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Supabase (infraestrutura e banco de dados - servidores nos EUA)</li>
              <li>Vercel (hospedagem da aplicacao)</li>
              <li>Sentry (monitoramento de erros, dados anonimizados)</li>
              <li>Sua instituicao de ensino (quando vinculado a uma escola)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">6. Seus Direitos (Art. 18, LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">Voce tem direito a:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Confirmacao da existencia de tratamento</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correcao de dados incompletos ou desatualizados</li>
              <li>Anonimizacao, bloqueio ou eliminacao de dados</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminacao dos dados tratados com consentimento</li>
              <li>Revogacao do consentimento</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Para exercer seus direitos, acesse Configuracoes &gt; Seguranca na plataforma
              ou entre em contato pelo e-mail: <strong>privacidade@geoteach.com.br</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">7. Retencao de Dados</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados pessoais sao retidos enquanto sua conta estiver ativa.
              Apos a exclusao da conta, os dados sao removidos em ate 30 dias,
              exceto quando necessario para cumprimento de obrigacoes legais.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">8. Seguranca</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos medidas tecnicas e organizacionais para proteger seus dados,
              incluindo criptografia em transito (TLS), controle de acesso baseado em funcoes (RBAC),
              e isolamento de dados por instituicao (multi-tenancy).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-3">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para questoes sobre esta politica ou sobre seus dados pessoais,
              entre em contato: <strong>privacidade@geoteach.com.br</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
