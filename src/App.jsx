// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { DarkModeProvider } from './DarkModeContext';
import RotaProtegida from './components/RotaProtegida';
import TeamSelectionModal from './components/TeamSelectionModal';
import GlobalToast from './components/GlobalToast';
import { UserProfileProvider, useUserProfile } from './context/UserProfileContext';
import { AccountSessionProvider } from './context/AccountSessionContext';
import { ApiDocProvider } from './context/ApiDocContext';
import { isTokenValid } from './services/auth';
import { showPermissionToast } from './services/globalToast';
import { LEVEL_LABELS, LEVELS } from './config/permissionsConfig';
import { SERVICE_KEYS, FEATURE_KEYS } from './config/teamsConfig';

// --- Design System ---
// Importante: enquanto a migração rola, montamos apenas <CssVarsBridge /> aqui
// no App. O <PrimeReactOverrides /> NÃO é montado em produção porque ele
// reescreve .p-button, .p-inputtext, etc. globalmente — o que altera a
// aparência de telas legadas (Login, ApiHelper, etc.). Esse override segue
// disponível para o Storybook e para componentes do DS que o consumam
// explicitamente.
import { ThemeProvider as DSThemeProvider } from './design-system/providers/ThemeProvider';
import { GlobalStyles as DSGlobalStyles } from './design-system/global/GlobalStyles';
import { CssVarsBridge as DSCssVarsBridge } from './design-system/global/CssVarsBridge';

// Lazy pages/layout (code-splitting)
const Layout             = lazy(() => import('./components/Layout'));
const Login              = lazy(() => import('./pages/Login'));
const Services           = lazy(() => import('./pages/Services'));
const Changelog          = lazy(() => import('./pages/Changelog'));
const Carregando         = lazy(() => import('./pages/Carregando'));
const HistoricoUsuario   = lazy(() => import('./pages/HistoricoUsuario'));
const PowerBI            = lazy(() => import('./pages/PowerBI'));
const Omie               = lazy(() => import('./pages/Omie'));
const TrocaEmail         = lazy(() => import('./pages/TrocaEmail'));
const QueueDashboard     = lazy(() => import('./pages/QueueDashboard'));
const Importation        = lazy(() => import('./pages/Importation'));
const ApiHelper          = lazy(() => import('./pages/ApiHelper'));
const Jsonx              = lazy(() => import('./pages/Jsonx'));
const FieldExplorer      = lazy(() => import('./pages/FieldExplorer'));
const Sankhya               = lazy(() => import('./pages/Sankhya'));
const SankhyaConsultasItens = lazy(() => import('./pages/SankhyaConsultasItens'));
const SankhyaLoginRapido    = lazy(() => import('./pages/SankhyaLoginRapido'));
const SankhyaTrocaToken     = lazy(() => import('./pages/SankhyaTrocaToken'));
const SankhyaItemCorrompido = lazy(() => import('./pages/SankhyaItemCorrompido'));
const GerenciarUsuarios     = lazy(() => import('./pages/GerenciarUsuarios'));
const EntityMerge           = lazy(() => import('./pages/EntityMerge'));
const N1Copilot             = lazy(() => import('./pages/N1Copilot'));
const DocumentadorForm      = lazy(() => import('./pages/DocumentadorForm'));
const DocumentadorLoading   = lazy(() => import('./pages/DocumentadorLoading'));
const AccountExportForm     = lazy(() => import('./pages/AccountExportForm'));
const AccountExportLoading  = lazy(() => import('./pages/AccountExportLoading'));
const IntercomTags          = lazy(() => import('./pages/IntercomTags'));
const IntercomChurnSearch   = lazy(() => import('./pages/IntercomChurnSearch'));
const IntercomDashboard     = lazy(() => import('./pages/IntercomDashboard'));
const PloomesTicketsSearch  = lazy(() => import('./pages/PloomesTicketsSearch'));
const PloomesAutomacoes     = lazy(() => import('./pages/PloomesAutomacoes'));
const FunilTecnico          = lazy(() => import('./pages/FunilTecnico'));
const CentralN1             = lazy(() => import('./pages/CentralN1'));
const ResumoDaily           = lazy(() => import('./pages/ResumoDaily'));
const AuditoriaIA           = lazy(() => import('./pages/AuditoriaIA'));
const DocumentationPage     = lazy(() => import('./pages/DocumentationPage'));
const ProcessImplementer    = lazy(() => import('./pages/ProcessImplementer/index'));
const AuditoriaUsuarios     = lazy(() => import('./pages/AuditoriaUsuarios'));
const CompiladorConhecimento = lazy(() => import('./pages/CompiladorConhecimento'));

// Redireciona /home conforme acesso: quem tem Copilot vai p/ /copilot, senão /services
function HomeRedirect() {
  if (!isTokenValid()) return <Navigate to="/" replace />;
  const { canService } = useUserProfile();
  return (
    <Navigate
      to={canService(SERVICE_KEYS.COPILOT) ? '/copilot' : '/services'}
      replace
    />
  );
}

/**
 * Helper para redirect com toast de permissão.
 * O Navigate é renderizado imediatamente; o toast aparece em paralelo.
 */
function DeniedRedirect({ message }) {
  useEffect(() => {
    showPermissionToast(message);
  }, [message]);
  return <Navigate to="/services" replace />;
}

// Protege rota exclusiva de ADM; não-ADM vai para /services
function RotaProtegidaAdmin({ children }) {
  const { isAdmin } = useUserProfile();
  if (!isTokenValid()) return <Navigate to="/" replace />;
  if (!isAdmin) {
    return (
      <DeniedRedirect message="Esta área é exclusiva para administradores." />
    );
  }
  return children;
}

/**
 * Protege rota verificando se a team do usuário tem acesso ao serviço informado.
 * Opcionalmente também exige um nível mínimo (para sub-rotas mais restritivas).
 */
function RotaProtegidaServico({ serviceKey, minLevel, feature, children }) {
  const { canService, can, canDo } = useUserProfile();
  if (!isTokenValid()) return <Navigate to="/" replace />;
  if (!canService(serviceKey)) {
    return (
      <DeniedRedirect message="Sua equipe não tem acesso a este serviço." />
    );
  }
  // Sub-rota gated por feature (segue a matriz: team + nível por feature).
  if (feature != null && !canDo(serviceKey, feature)) {
    return (
      <DeniedRedirect message="Você não tem permissão para esta funcionalidade." />
    );
  }
  if (minLevel != null && !can(minLevel)) {
    const levelLabel = LEVEL_LABELS[minLevel] ?? 'um nível superior';
    return (
      <DeniedRedirect
        message={`Esta funcionalidade exige acesso "${levelLabel}" ou superior.`}
      />
    );
  }
  return children;
}

/**
 * Acesso à tela de Gerenciar Usuários:
 * - Admin (full management)
 * - Gestor (apenas visualização da própria equipe — filtro feito na página)
 */
function RotaProtegidaGerenciaUsuarios({ children }) {
  const { isAdmin, isGestor } = useUserProfile();
  if (!isTokenValid()) return <Navigate to="/" replace />;
  if (!isAdmin && !isGestor) {
    return (
      <DeniedRedirect message="Apenas administradores e gestores podem acessar esta tela." />
    );
  }
  return children;
}

function AppContent() {
  return (
    <>
      <GlobalToast />
      <TeamSelectionModal />

      <Suspense fallback={<div style={{ padding: 20 }}>Carregando…</div>}>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/home" element={<HomeRedirect />} />
            <Route
              path="/copilot"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.COPILOT}>
                  <N1Copilot />
                </RotaProtegidaServico>
              }
            />
            {/* Documentador de Contas — agora serviço próprio na store */}
            <Route
              path="/account-documenter"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.ACCOUNT_DOCUMENTER}>
                  <DocumentadorForm />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/account-documenter/loading"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.ACCOUNT_DOCUMENTER}>
                  <DocumentadorLoading />
                </RotaProtegidaServico>
              }
            />
            {/* Redirects de compat das rotas antigas dentro do Copilot */}
            <Route path="/copilot/documentador" element={<Navigate to="/account-documenter" replace />} />
            <Route path="/copilot/documentador/loading" element={<Navigate to="/account-documenter" replace />} />

            {/* Exportação de Base — novo serviço (adminOnly via teamsConfig) */}
            <Route
              path="/account-export"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.ACCOUNT_EXPORT}>
                  <AccountExportForm />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/account-export/loading"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.ACCOUNT_EXPORT}>
                  <AccountExportLoading />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/services"
              element={<RotaProtegida><Services /></RotaProtegida>}
            />
            <Route
              path="/changelog"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.CHANGELOG}>
                  <Changelog />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/auditoria-usuarios"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.USER_AUDIT}>
                  <AuditoriaUsuarios />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/powerbi"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.POWERBI}>
                  <PowerBI />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/omie"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.OMIE}>
                  <Omie />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/carregando"
              element={<RotaProtegida><Carregando /></RotaProtegida>}
            />
            <Route
              path="/historico"
              element={<RotaProtegida><HistoricoUsuario /></RotaProtegida>}
            />
            <Route
              path="/emailfix"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.EMAILFIX}>
                  <TrocaEmail />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/queues"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.QUEUES}>
                  <QueueDashboard />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/importation"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.IMPORTATION}>
                  <Importation />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/apihub"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.APIHUB}>
                  <ApiHelper />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/jsonx"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.JSONX}>
                  <Jsonx />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/field-explorer"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.FIELD_EXPLORER}>
                  <FieldExplorer />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/sankhya"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.SANKHYA}>
                  <Sankhya />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/sankhya/consultas-itens"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.SANKHYA}>
                  <SankhyaConsultasItens />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/sankhya/login-rapido"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.SANKHYA}>
                  <SankhyaLoginRapido />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/sankhya/troca-token"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.SANKHYA} feature={FEATURE_KEYS.SANKHYA_TOKEN_SWAP}>
                  <SankhyaTrocaToken />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/sankhya/item-corrompido"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.SANKHYA}>
                  <SankhyaItemCorrompido />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <RotaProtegidaGerenciaUsuarios>
                  <GerenciarUsuarios />
                </RotaProtegidaGerenciaUsuarios>
              }
            />
            <Route
              path="/services/entity-merge"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.ENTITY_MERGE}>
                  <EntityMerge />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/services/knowledge-compiler"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.KNOWLEDGE_COMPILER}>
                  <CompiladorConhecimento />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/intercom-tags"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.INTERCOM_TAGS}>
                  <IntercomTags />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/intercom-churn"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.INTERCOM_CHURN}>
                  <IntercomChurnSearch />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/intercom-dashboard"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.INTERCOM_DASHBOARD} minLevel={LEVELS.GESTOR}>
                  <IntercomDashboard />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/ajuda"
              element={<Navigate to="/ajuda/n1app" replace />}
            />
            <Route
              path="/ajuda/:section"
              element={<RotaProtegida><DocumentationPage /></RotaProtegida>}
            />
            <Route
              path="/ploomes-automacoes"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.PLOOMES_AUTOMACOES}>
                  <PloomesAutomacoes />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/ploomes-tickets"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.PLOOMES_TICKETS}>
                  <PloomesTicketsSearch />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/central-n1"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.CENTRAL_N1}>
                  <CentralN1 />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/central-n1/funil-tecnico"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.PLOOMES_KANBAN}>
                  <FunilTecnico />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/central-n1/resumo-daily"
              element={<RotaProtegidaAdmin><ResumoDaily /></RotaProtegidaAdmin>}
            />
            <Route
              path="/central-n1/auditoria-ia"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.AUDITORIA_IA}>
                  <AuditoriaIA />
                </RotaProtegidaServico>
              }
            />
            {/* Compat: rota antiga do Funil → Central N1 (o Funil é um card lá dentro) */}
            <Route
              path="/ploomes-kanban"
              element={<Navigate to="/central-n1" replace />}
            />
            <Route
              path="/process-implementer"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.PROCESS_IMPLEMENTER}>
                  <ProcessImplementer />
                </RotaProtegidaServico>
              }
            />
            <Route
              path="/process-implementer/:slug"
              element={
                <RotaProtegidaServico serviceKey={SERVICE_KEYS.PROCESS_IMPLEMENTER}>
                  <ProcessImplementer />
                </RotaProtegidaServico>
              }
            />
            {/* Compat: rota antiga do Resumo da Daily → novo card na Central N1 */}
            <Route
              path="/copilot/daily-resume"
              element={<Navigate to="/central-n1/resumo-daily" replace />}
            />
            <Route path="*" element={<HomeRedirect />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

// App raiz: DS por fora, legado por dentro
export default function App() {
  return (
    <BrowserRouter>
      <DSThemeProvider defaultMode="system">
        <DSGlobalStyles />
        <DSCssVarsBridge />

        <DarkModeProvider>
          <UserProfileProvider>
            <AccountSessionProvider>
              <ApiDocProvider>
                <AppContent />
              </ApiDocProvider>
            </AccountSessionProvider>
          </UserProfileProvider>
        </DarkModeProvider>
      </DSThemeProvider>
    </BrowserRouter>
  );
}