// pages/N1Copilot.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styled, { keyframes, css } from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import ServiceHeader from '../components/ServiceHeader';
import { useUserProfile } from '../context/UserProfileContext';
import { SERVICE_KEYS, FEATURE_KEYS } from '../config/teamsConfig';
import { validateKeys, startExtraction } from '../services/accountDocumenterService';
import { askRag } from '../services/ragService';

// ---------- localStorage helpers ----------
const STORAGE_KEY = 'copilotChats';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function loadChats() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const now = Date.now();
    return raw.filter((c) => now - c.createdAt < TTL_MS);
  } catch {
    return [];
  }
}

function saveChat(chat) {
  const chats = loadChats();
  const idx = chats.findIndex((c) => c.id === chat.id);
  if (idx >= 0) chats[idx] = chat;
  else chats.unshift(chat);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats.slice(0, 30)));
}

function deleteChat(chatId) {
  const chats = loadChats().filter((c) => c.id !== chatId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function newChatSession() {
  return { id: Date.now(), createdAt: Date.now(), messages: [] };
}

// ---------- documentador helpers ----------
function createDocKey() {
  return { value: '', status: 'idle', accountId: null, accountName: null, error: null };
}

function humanizeLog(msg) {
  if (!msg) return msg;

  // Progresso inline dos paginados (linhas que começam com espaço)
  if (msg.startsWith('  ')) {
    const inner = msg.trim();
    // "+N registros (total=M)" → exibe como detalhe
    const m = inner.match(/\+(\d+) registros \(total=(\d+)\)/);
    if (m) return `   ↳ +${m[1]} itens carregados — ${m[2]} no total`;
    return `   ↳ ${inner}`;
  }

  // Checkmarks de conclusão de entidade com contagem
  if (msg.startsWith('✔')) {
    // "✔ Campos (Fields): 312 registros" → mantém com ícone verde
    return msg.replace('✔', '✅');
  }

  // Detalhes de automações "Automações detalhadas: X/Y"
  if (/Automações detalhadas: \d+\/\d+/.test(msg)) {
    const m = msg.match(/(\d+)\/(\d+)/);
    return m ? `🔍 Detalhando automações — ${m[1]} de ${m[2]}` : '🔍 Detalhando automações...';
  }
  // "Expandindo automações (detalhes)…" ou "Automações detalhadas: total=N"
  if (msg.includes('Expandindo automações') || msg.includes('automações detalhadas')) {
    const m = msg.match(/total=(\d+)/);
    return m ? `🤖 Expandindo detalhes das automações — ${m[1]} no total` : '🤖 Expandindo detalhes das automações...';
  }

  // Detalhes de templates "Templates detalhados: X/Y"
  if (/Templates detalhados: \d+\/\d+/.test(msg)) {
    const m = msg.match(/(\d+)\/(\d+)/);
    return m ? `📄 Detalhando templates — ${m[1]} de ${m[2]}` : '📄 Detalhando templates...';
  }
  if (msg.includes('Expandindo document')) {
    const m = msg.match(/total=(\d+)/);
    return m ? `📄 Expandindo detalhes dos templates — ${m[1]} no total` : '📄 Expandindo detalhes dos templates...';
  }

  // Uso da conta
  if (msg.includes('Coletando dados de uso'))       return '📈 Coletando dados de uso da conta (últimos 2 meses)...';
  if (msg.includes('Deals (uso)'))                  return '💼 Carregando negócios dos últimos 2 meses...';
  if (msg.includes('Propostas (uso)'))              return '📃 Carregando propostas dos últimos 2 meses...';
  if (msg.includes('Pedidos (uso)'))                return '🛒 Carregando pedidos dos últimos 2 meses...';
  if (msg.includes('Documentos (uso)'))             return '📁 Carregando documentos dos últimos 2 meses...';
  if (msg.includes('Tarefas (uso)'))                return '✅ Carregando tarefas dos últimos 2 meses...';
  if (msg.includes('Registros de interação'))       return '💬 Carregando registros de interação...';
  if (msg.includes('Histórico de estágios'))        return '🔄 Carregando histórico de movimentações...';
  if (msg.includes('canonical de uso'))             return '📊 Processando estatísticas de uso...';

  // Entidades base
  if (msg.includes('Iniciando extração'))           return '🔌 Conectando à API Ploomes...';
  if (msg.includes('Entidades (Fields@Entities)'))  return '🏗️ Carregando estrutura de entidades...';
  if (msg.includes('Campos (Fields)'))              return '📋 Mapeando campos personalizados...';
  if (msg.includes('Opções (Fields@OptionsTables')) return '🔤 Carregando opções de seleção...';
  if (msg.includes('Perfis (Users@Profiles)'))      return '👤 Carregando perfis de acesso...';
  if (msg.includes('Equipes (Teams)'))              return '👥 Mapeando equipes da conta...';
  if (msg.includes('Usuários (Users)'))             return '🙋 Carregando usuários do sistema...';
  if (msg.includes('Webhooks'))                     return '🔗 Verificando webhooks configurados...';
  if (msg.includes('Business Rules'))               return '⚙️ Analisando regras de negócio...';
  if (msg.includes('Document Templates (lista)'))   return '📄 Listando templates de documentos...';
  if (msg.includes('Pipelines (Deals@Pipelines)'))  return '🔄 Mapeando pipelines e estágios...';
  if (msg.includes('Checklists'))                   return '✅ Carregando checklists configurados...';
  if (msg.includes('Automações habilitadas'))       return '🤖 Listando automações ativas...';

  // Montagem
  if (msg.includes('JSON canônico'))                return '📦 Compilando dados estruturados...';
  if (msg.includes('relatório de cobertura'))       return '📊 Gerando relatório de cobertura...';
  if (msg.includes('payload IA'))                   return '🧠 Preparando dados para análise por IA...';
  if (msg.includes('Gerando resumo'))               return '📝 Gerando resumo executivo...';
  if (msg.includes('Montando arquivos temáticos'))  return '🗂️ Montando arquivos de saída...';
  if (msg.includes('biblioteca Ploomes'))           return '💾 Salvando na biblioteca Ploomes...';

  // Erros e avisos
  if (msg.startsWith('⚠'))  return msg;
  if (msg.startsWith('Erro') || msg.startsWith('Falha')) return `❌ ${msg}`;

  return msg;
}

function progressFromDocLogs(logs) {
  const steps = [
    'Iniciando extração',
    'Entidades (Fields@Entities)',
    'Campos (Fields)',
    'Opções (Fields@OptionsTables',
    'Perfis (Users@Profiles)',
    'Equipes (Teams)',
    'Usuários (Users)',
    'Webhooks',
    'Business Rules',
    'Document Templates (lista)',
    'Pipelines (Deals@Pipelines)',
    'Checklists',
    'Automações habilitadas',
    'Expandindo automações',
    'Expandindo document',
    'JSON canônico',
    'relatório de cobertura',
    'payload IA',
    'Gerando resumo',
    'Coletando dados de uso',
    'Deals (uso)',
    'Propostas (uso)',
    'Pedidos (uso)',
    'Documentos (uso)',
    'Tarefas (uso)',
    'Registros de interação',
    'Histórico de estágios',
    'Montando arquivos temáticos',
    'biblioteca Ploomes',
  ];
  const matched = steps.filter(s => logs.some(l => l.includes(s)));
  return Math.min(Math.round((matched.length / steps.length) * 95), 95);
}

function downloadJson(data, fileName) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text, fileName) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
}

// ---------- animations ----------
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%            { opacity: 1;   transform: scale(1); }
`;

const slideLeft = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

// ---------- layout ----------
const PageWrapper = styled.div`
  display: flex;
  height: calc(100vh - 4rem);
  max-height: calc(100vh - 4rem);
  overflow: hidden;
  gap: 1rem;
`;

const ChatColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// ---------- header ----------
// Impede o ServiceHeader de ser comprimido pelo flex do ChatColumn (o header
// manual antigo tinha flex-shrink: 0; a MessagesArea abaixo é flex:1).
const HeaderSlot = styled.div`
  flex-shrink: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
`;

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1.5px solid ${({ darkMode, active }) =>
    active ? '#7443f6' : (darkMode ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ darkMode, active }) =>
    active
      ? (darkMode ? 'rgba(116,67,246,0.22)' : 'rgba(116,67,246,0.08)')
      : 'transparent'};
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  i { font-size: 0.85rem; }
  &:hover {
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116,67,246,0.22)' : 'rgba(116,67,246,0.08)'};
    border-color: #7443f6;
  }
`;

const AssistantIcon = styled.i`
  font-size: 1.2rem;
  color: #7443f6;
  align-self: flex-end;
  margin-bottom: 0.6rem;
  flex-shrink: 0;
`;

// ---------- messages area ----------
const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-behavior: smooth;

  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.35) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.35); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(116,67,246,0.6); }
`;

// ---------- empty state ----------
const EmptyIcon = styled.i`
  font-size: 3rem;
  color: #7443f6;
  opacity: 0.4;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2rem;
  animation: ${fadeIn} 0.4s ease;
  @media (max-width: 600px) { gap: 1rem; padding: 1rem; }
`;

const EmptyTitle = styled.p`
  font-size: 1.05rem;
  color: ${({ darkMode }) => (darkMode ? '#9580c8' : '#7a6aaa')};
  text-align: center;
  margin: 0;
`;

const SuggestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 560px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const SuggestionCard = styled.button`
  background: ${({ darkMode }) => (darkMode ? '#1a1230' : '#f5f2ff')};
  border: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a5e' : '#d8cfff')};
  border-radius: 12px;
  padding: 0.85rem 1rem;
  text-align: left;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
  &:hover:not(:disabled) {
    background: ${({ darkMode }) => (darkMode ? '#251840' : '#ede8ff')};
    border-color: #7443f6;
    transform: translateY(-2px);
  }
  &:focus { outline: none; box-shadow: 0 0 0 2px #7443f666; }
`;

const SuggestionIcon = styled.span`
  display: block;
  font-size: 1.2rem;
  margin-bottom: 0.3rem;
`;

// ---------- message bubbles ----------
const MessageRow = styled.div`
  display: flex;
  justify-content: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  align-items: flex-end;
  gap: 0.5rem;
  animation: ${fadeIn} 0.25s ease;
`;

const Bubble = styled.div`
  max-width: 68%;
  padding: 0.75rem 1rem;
  border-radius: ${({ isUser }) => isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  background: ${({ isUser, darkMode }) =>
    isUser ? 'linear-gradient(135deg, #7443f6, #9b67ff)' : (darkMode ? '#1e1535' : '#f0ecff')};
  color: ${({ isUser, darkMode }) =>
    isUser ? '#fff' : (darkMode ? '#d4c8ff' : '#3d2a80')};
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: ${({ isUser }) =>
    isUser ? '0 2px 8px rgba(116,67,246,0.35)' : '0 1px 4px rgba(0,0,0,0.08)'};
`;

// Renderiza o markdown das respostas do assistente (RAG e mensagens do fluxo
// documentador) dentro do balão — sem isso, ##, **, listas e links aparecem
// como texto puro.
const MarkdownBody = styled.div`
  p { margin: 0 0 0.5em 0; }
  p:last-child { margin-bottom: 0; }

  ul, ol { margin: 0 0 0.5em 1.2em; padding: 0; }
  li { margin-bottom: 0.2em; }
  li:last-child { margin-bottom: 0; }
  /* listas "loose" (itens separados por linha em branco) embrulham cada item
     num <p> — sem isso a margem de parágrafo soma com a do <li> e explode o
     espaçamento entre itens. */
  li > p { margin: 0; }
  blockquote > p { margin: 0; }

  h1, h2, h3, h4 {
    margin: 0.6em 0 0.3em 0;
    line-height: 1.3;
  }
  h1:first-child, h2:first-child, h3:first-child, h4:first-child { margin-top: 0; }
  h1 { font-size: 1.15em; }
  h2 { font-size: 1.1em; }
  h3 { font-size: 1.05em; }
  h4 { font-size: 1em; }

  a {
    color: ${({ darkMode }) => (darkMode ? '#b79bff' : '#7443f6')};
    text-decoration: underline;
    word-break: break-all;
  }

  code {
    background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
    border-radius: 4px;
    padding: 0.1em 0.35em;
    font-size: 0.88em;
  }
  pre {
    background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')};
    border-radius: 8px;
    padding: 0.6em 0.8em;
    overflow-x: auto;
    margin: 0 0 0.6em 0;
  }
  pre code { background: none; padding: 0; }

  blockquote {
    margin: 0 0 0.6em 0;
    padding-left: 0.75em;
    border-left: 3px solid ${({ darkMode }) => (darkMode ? '#5b3ec8' : '#b8a6f0')};
    opacity: 0.9;
  }

  hr {
    border: none;
    border-top: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a5e' : '#d8cfff')};
    margin: 0.6em 0;
  }

  table {
    border-collapse: collapse;
    margin-bottom: 0.6em;
    font-size: 0.9em;
  }
  th, td {
    border: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a5e' : '#d8cfff')};
    padding: 0.3em 0.6em;
  }
`;

// ---------- typing indicator ----------
const TypingDot = styled.span`
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #7443f6;
  margin: 0 2px;
  animation: ${pulse} 1.2s infinite ease-in-out;
  animation-delay: ${({ delay }) => delay};
`;

function TypingIndicator({ darkMode }) {
  return (
    <MessageRow isUser={false}>
      <AssistantIcon className="pi pi-sparkles" />
      <Bubble isUser={false} darkMode={darkMode}
        style={{ padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: 2 }}>
        <TypingDot delay="0s" />
        <TypingDot delay="0.2s" />
        <TypingDot delay="0.4s" />
      </Bubble>
    </MessageRow>
  );
}

// ---------- input area ----------
const InputArea = styled.div`
  flex-shrink: 0;
  padding: 1rem 0 0 0;
  border-top: 1px solid ${({ darkMode }) => (darkMode ? '#2d2a3e' : '#e4e0f5')};
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
`;

const ReadOnlyNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.95rem;
  margin-bottom: 0.75rem;
  border-radius: 12px;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#3a2a5e' : '#d8cfff')};
  background: ${({ darkMode }) => (darkMode ? 'rgba(116,67,246,0.12)' : '#f5f2ff')};
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.85rem;
  line-height: 1.45;
  i { color: #7443f6; font-size: 1rem; flex-shrink: 0; }
`;

const StyledTextarea = styled(InputTextarea)`
  flex: 1;
  resize: none;
  border-radius: 12px !important;
  font-size: 0.95rem !important;
  padding: 0.75rem 1rem !important;
  line-height: 1.5 !important;
  min-height: 48px !important;
  max-height: 140px !important;
  overflow-y: auto !important;
  background: ${({ darkMode }) => (darkMode ? '#1a1230' : '#f8f6ff')} !important;
  border-color: ${({ darkMode }) => (darkMode ? '#3a2a5e' : '#d0c8f0')} !important;
  color: ${({ darkMode }) => (darkMode ? '#e2d9ff' : '#222')} !important;
  transition: border-color 0.2s ease !important;
  &:focus {
    border-color: #7443f6 !important;
    box-shadow: 0 0 0 2px rgba(116,67,246,0.2) !important;
  }
  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.5) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.45); border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(116,67,246,0.75); }
`;

const SendButton = styled(Button)`
  width: 44px !important;
  height: 44px !important;
  border-radius: 12px !important;
  flex-shrink: 0;
  background: linear-gradient(135deg, #7443f6, #9b67ff) !important;
  border: none !important;
  transition: opacity 0.2s ease, transform 0.15s ease !important;
  &:hover:not(:disabled) { transform: scale(1.06) !important; opacity: 0.92 !important; }
  &:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
`;

// ---------- history panel ----------
const HistoryPanel = styled.div`
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid ${({ darkMode }) => (darkMode ? '#2d2a3e' : '#e4e0f5')};
  padding-left: 1rem;
  animation: ${slideLeft} 0.25s ease;
  overflow: hidden;
  @media (max-width: 768px) { display: none; }
`;

const HistoryTitle = styled.p`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ darkMode }) => (darkMode ? '#6a5a9a' : '#a090cc')};
  margin: 0 0 0.75rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? '#2d2a3e' : '#e4e0f5')};
  flex-shrink: 0;
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(116,67,246,0.3) transparent;
  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(116,67,246,0.3); border-radius: 4px; }
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ darkMode, active }) =>
    active
      ? (darkMode ? 'rgba(116,67,246,0.2)' : 'rgba(116,67,246,0.08)')
      : 'transparent'};
  border: 1px solid ${({ active }) => active ? 'rgba(116,67,246,0.4)' : 'transparent'};
  transition: background 0.15s, border-color 0.15s;
  &:hover {
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(116,67,246,0.15)' : 'rgba(116,67,246,0.06)'};
  }
`;

const HistoryItemContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const HistoryItemTitle = styled.p`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ darkMode }) => (darkMode ? '#c4b5fd' : '#4a2fa0')};
  margin: 0 0 0.15rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HistoryItemDate = styled.p`
  font-size: 0.72rem;
  color: ${({ darkMode }) => (darkMode ? '#6a5a9a' : '#a090cc')};
  margin: 0;
`;

const HistoryDeleteBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${({ darkMode }) => (darkMode ? '#5a4a7a' : '#c0b0e8')};
  font-size: 0.7rem;
  padding: 2px;
  border-radius: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  ${HistoryItem}:hover & { opacity: 1; }
  &:hover { color: #e05050; }
`;

const EmptyHistory = styled.p`
  font-size: 0.8rem;
  color: ${({ darkMode }) => (darkMode ? '#4a3a6a' : '#c0b0e8')};
  text-align: center;
  margin-top: 1rem;
`;

// ---------- documentador inline components ----------
const DocFormWrapper = styled.div`
  margin-left: 1.7rem;
  animation: ${slideUp} 0.3s ease;
`;

const DocFormCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#2d2a3e' : '#e4e0f5')};
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-width: 520px;
`;

const DocAccountBadge = styled.div`
  background: ${({ $dm }) => ($dm ? '#251840' : '#f0ecff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d8cfff')};
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.87rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-weight: 600;
`;

const DocKeyRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const DocKeyInput = styled.input`
  flex: 1;
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  border: 1.5px solid ${({ $valid, $invalid, $dm }) =>
    $valid ? '#22c55e' : $invalid ? '#ef4444' : ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f8f6ff')};
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')};
  font-size: 0.85rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #7443f6; box-shadow: 0 0 0 2px rgba(116,67,246,0.18); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DocValidBtn = styled.button`
  padding: 0.5rem 0.85rem;
  border-radius: 10px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#251840' : '#f5f2ff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  &:hover:not(:disabled) {
    background: ${({ $dm }) => ($dm ? '#2e1f50' : '#ede8ff')};
    border-color: #7443f6;
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const DocStatusLine = styled.div`
  font-size: 0.78rem;
  color: ${({ $ok }) => ($ok ? '#22c55e' : '#ef4444')};
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.2rem;
`;

const DocAddKeyBtn = styled.button`
  align-self: flex-start;
  background: transparent;
  border: 1.5px dashed ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  border-radius: 10px;
  padding: 0.4rem 0.85rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  &:hover { border-color: #7443f6; color: #7443f6; }
`;

const DocErrorBox = styled.div`
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  color: #ef4444;
  font-size: 0.83rem;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
`;

// Extraction progress
const DocExtractionWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  animation: ${fadeIn} 0.25s ease;
`;

const DocExtractionCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#1e1535' : '#f0ecff')};
  border-radius: 18px 18px 18px 4px;
  padding: 1rem 1.1rem;
  max-width: 68%;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
`;

const DocProgressBar = styled.div`
  height: 5px;
  border-radius: 99px;
  background: ${({ $dm }) => ($dm ? '#2d2a3e' : '#ddd8ff')};
  overflow: hidden;
`;

const DocProgressFill = styled.div`
  height: 100%;
  border-radius: 99px;
  width: ${({ $pct }) => $pct}%;
  background: linear-gradient(90deg, #7443f6, #9b67ff, #7443f6);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s infinite linear;
  transition: width 0.5s ease;
`;

const DocLogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const DocLogLine = styled.div`
  font-size: 0.83rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  line-height: 1.4;
  animation: ${slideUp} 0.2s ease;
  opacity: ${({ $active }) => ($active ? 1 : 0.65)};
  ${({ $active }) => $active && css`font-weight: 600;`}
`;

const DocPctLabel = styled.span`
  font-size: 0.72rem;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
  text-align: right;
`;

// Results
const DocResultsWrapper = styled.div`
  margin-left: 1.7rem;
  animation: ${slideUp} 0.3s ease;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DocSectionLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')};
  margin: 0 0 0.4rem 0;
`;

const DocDownloadGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DocDownloadBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: ${({ $dm }) => ($dm ? '#251840' : '#ede8ff')}; border-color: #7443f6; }
`;

const DocPromptCard = styled.div`
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#e4e0f5')};
  border-radius: 12px;
  padding: 0.9rem 1rem;
`;

const DocPromptLabel = styled.p`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #7443f6;
  margin: 0 0 0.35rem 0;
`;

const DocPromptText = styled.p`
  font-size: 0.83rem;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
`;

const DocCopyBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: transparent;
  color: ${({ $dm }) => ($dm ? '#9580c8' : '#7a6aaa')};
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover { background: ${({ $dm }) => ($dm ? '#251840' : '#ede8ff')}; color: #7443f6; }
`;

const DocStorageBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 10px;
  padding: 0.55rem 0.9rem;
  font-size: 0.83rem;
  color: #22c55e;
  font-weight: 600;
`;

// Doc action area (replaces text input during flow)
const DocActionArea = styled.div`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: center;
`;

const DocMainButton = styled.button`
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #7443f6, #9b67ff);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const DocSecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  border-radius: 12px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: transparent;
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  &:hover { background: ${({ $dm }) => ($dm ? '#251840' : '#ede8ff')}; border-color: #7443f6; }
`;

const DocCancelButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  border-radius: 12px;
  border: 1.5px solid rgba(239,68,68,0.5);
  background: transparent;
  color: #ef4444;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: rgba(239,68,68,0.08); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DocHint = styled.p`
  font-size: 0.78rem;
  color: ${({ $dm }) => ($dm ? '#6a5a9a' : '#a090cc')};
  margin: 0.35rem 0 0 0;
  text-align: center;
`;

// ---------- constants ----------
const SUGGESTIONS = [
  // "Documentar uma conta" migrou para o serviço próprio /account-documenter na store.
  { icon: '💬', text: 'Analisar um chat de atendimento' },
  { icon: '🔍', text: 'Tirar dúvida técnica sobre Ploomes' },
];

const PLACEHOLDER_REPLY = 'Em breve poderei executar essa ação para você.';

// Formata a resposta do agente RAG (Q&A) como markdown para o balão do chat:
// resposta + lista de fontes (título + link) + modelo.
function formatRagAnswer(out) {
  let md = (out?.resposta || '').trim();
  const fontes = Array.isArray(out?.fontes) ? out.fontes : [];
  if (fontes.length) {
    md += '\n\n**Fontes:**\n';
    md += fontes
      .map((f, i) => {
        const label = f.titulo || `fonte ${i + 1}`;
        return f.url_central ? `- [${label}](${f.url_central})` : `- ${label}`;
      })
      .join('\n');
  }
  if (out?.modelo) md += `\n\n_modelo: ${out.modelo}_`;
  return md || 'Sem resposta.';
}

const MAX_DOC_KEYS = 5;

// As mensagens do app usam quebra de linha simples (\n) como salto visual
// (ex.: "🏢 conta\n🔑 ID: x"), mas markdown só quebra linha com "\n\n" (novo
// parágrafo) ou espaço duplo antes do "\n" (hard break). Normaliza para isso
// sem precisar de um plugin remark extra.
function withMarkdownBreaks(text) {
  if (!text) return '';
  return text.replace(/\n/g, '  \n');
}

function formatRelative(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'Agora mesmo';
  if (m < 60) return `Há ${m} min`;
  if (h < 24) return `Há ${h}h`;
  return `Há ${d}d`;
}

// ---------- component ----------
export default function N1Copilot() {
  const { darkMode } = useDarkMode();
  const { canDo, isAdmin } = useUserProfile();
  const canDocumenter = canDo(SERVICE_KEYS.COPILOT, FEATURE_KEYS.COPILOT_DOCUMENTER);
  // Visualização liberada a partir do básico (Suporte N1); o USO (envio de
  // mensagens / botões) exige gestor+. Perfis abaixo veem a interface bloqueada.
  const canUse = canDo(SERVICE_KEYS.COPILOT, FEATURE_KEYS.COPILOT_USE);
  const navigate = useNavigate();
  const location = useLocation();

  // Chat session state
  const [session, setSession] = useState(() => newChatSession());
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [chatHistory, setChatHistory] = useState(() => loadChats());

  // Documentador flow state
  const [docPhase, setDocPhase] = useState(null);
  // null | 'awaiting-keys' | 'validating' | 'confirmed' | 'extracting' | 'done' | 'error'
  const [docKeys, setDocKeys] = useState([createDocKey()]);
  const [docGlobalError, setDocGlobalError] = useState('');
  const [docLogs, setDocLogs] = useState([]);
  const [docPct, setDocPct] = useState(0);
  const [docResult, setDocResult] = useState(null);
  const [docAccountInfo, setDocAccountInfo] = useState(null);
  const [docCancelling, setDocCancelling] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const stateTimers = useRef([]);
  const docAbortRef = useRef(null);
  const docAutoStarted = useRef(false);
  const docLogEndRef = useRef(null);

  const clearStateTimers = () => {
    stateTimers.current.forEach(clearTimeout);
    stateTimers.current = [];
  };

  const resetDocState = useCallback(() => {
    setDocPhase(null);
    setDocKeys([createDocKey()]);
    setDocGlobalError('');
    setDocLogs([]);
    setDocPct(0);
    setDocResult(null);
    setDocAccountInfo(null);
    setDocCancelling(false);
    if (docAbortRef.current) { docAbortRef.current(); docAbortRef.current = null; }
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
    return () => clearStateTimers();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isTyping, docPhase, docLogs]);


  useEffect(() => {
    docLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [docLogs]);

  useEffect(() => {
    if (session.messages.length === 0) return;
    saveChat(session);
    setChatHistory(loadChats());
  }, [session.messages]);

  // Auto-start documentador flow when navigating to /copilot/documentador
  useEffect(() => {
    if (location.pathname !== '/copilot/documentador') return;
    if (docAutoStarted.current) return;
    docAutoStarted.current = true;

    const t = setTimeout(() => startDocumentadorFlow(), 400);
    return () => {
      clearTimeout(t);
      docAutoStarted.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const startNewChat = useCallback(() => {
    clearStateTimers();
    resetDocState();
    docAutoStarted.current = false;
    setSession(newChatSession());
    setInputValue('');
    setIsTyping(false);
    navigate('/copilot', { replace: true });
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [resetDocState, navigate]);

  const loadSession = useCallback((chat) => {
    clearStateTimers();
    resetDocState();
    setSession(chat);
    setInputValue('');
    setIsTyping(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [resetDocState]);

  const removeChatFromHistory = useCallback((e, chatId) => {
    e.stopPropagation();
    deleteChat(chatId);
    setChatHistory(loadChats());
    if (chatId === session.id) startNewChat();
  }, [session.id, startNewChat]);

  const addAssistantMessage = useCallback((text, extra = {}) => {
    const msg = { id: Date.now() + 1, role: 'assistant', text, ...extra };
    setSession((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
    return msg;
  }, []);

  const addUserMessage = useCallback((text, extra = {}) => {
    const msg = { id: Date.now(), role: 'user', text, ...extra };
    setSession((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
    return msg;
  }, []);

  const sendMessage = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    // ADMIN: o próprio chat aponta para o RAG (Q&A da base de conhecimento).
    // É a única forma de mensagem — sem painel separado. Gasta token da Anthropic;
    // a trava real é no backend (POST /api/rag/ask exige admin no caminho JWT).
    if (isAdmin) {
      clearStateTimers();
      addUserMessage(trimmed);
      setInputValue('');
      setIsTyping(true);
      (async () => {
        try {
          const out = await askRag(trimmed);
          setIsTyping(false);
          addAssistantMessage(formatRagAnswer(out));
        } catch (err) {
          setIsTyping(false);
          // Erro cru e visível — é o que queremos diagnosticar em produção
          // (rede bloqueada / Anthropic indisponível vs. 403 de permissão).
          const origem = err?.status ? `HTTP ${err.status}` : 'rede';
          addAssistantMessage(`⚠️ **Falha no RAG (${origem}):** ${err?.message || 'erro desconhecido'}`);
        }
      })();
      return;
    }

    // NÃO-ADMIN: comportamento atual, sem apontamento para o RAG.
    if (!canUse) return;
    clearStateTimers();
    addUserMessage(trimmed);
    setInputValue('');
    setIsTyping(true);
    const t1 = setTimeout(() => {
      setIsTyping(false);
      addAssistantMessage(PLACEHOLDER_REPLY);
    }, 1200);
    stateTimers.current = [t1];
  }, [isTyping, isAdmin, canUse, addUserMessage, addAssistantMessage]);

  // ---- Documentador flow functions ----

  function startDocumentadorFlow() {
    if (docPhase !== null) return;
    clearStateTimers();

    addUserMessage('Documentar uma conta');
    setIsTyping(true);

    const t = setTimeout(() => {
      setIsTyping(false);
      addAssistantMessage(
        'Olá! Vou iniciar a documentação completa de uma conta Ploomes para você.\n\nPara isso, preciso das User-Keys de acesso à API. Você pode inserir até 5 User-Keys — todas devem pertencer à mesma conta.\n\nInsira as User-Keys abaixo e clique em "Validar" em cada uma para confirmarmos o acesso.',
        { type: 'uk-form' }
      );
      setDocPhase('awaiting-keys');
    }, 1400);

    stateTimers.current = [t];
  }

  function updateDocKey(idx, patch) {
    setDocKeys(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  async function validateSingleKey(idx) {
    const val = docKeys[idx].value.trim();
    if (!val) return;

    setDocGlobalError('');
    updateDocKey(idx, { status: 'validating', error: null, accountId: null, accountName: null });

    try {
      const result = await validateKeys([val]);
      const info = result.validatedKeys?.[0];

      const currentAccountId = docKeys.find((k, i) => i !== idx && k.accountId)?.accountId ?? null;
      if (currentAccountId && info.accountId !== currentAccountId) {
        updateDocKey(idx, {
          status: 'invalid',
          error: `Pertence à conta ${info.accountId}, mas as demais pertencem à ${currentAccountId}`,
        });
        setDocGlobalError('As User-Keys não pertencem à mesma conta');
        return;
      }

      updateDocKey(idx, {
        status: 'valid',
        accountId: info.accountId,
        accountName: info.accountName,
        error: null,
      });
    } catch (err) {
      updateDocKey(idx, { status: 'invalid', error: err.message });
    }
  }

  function addDocKey() {
    if (docKeys.length >= MAX_DOC_KEYS) return;
    setDocKeys(prev => [...prev, createDocKey()]);
  }

  function removeDocKey(idx) {
    setDocKeys(prev => prev.filter((_, i) => i !== idx));
  }

  function handleDocValidate() {
    const validKeys = docKeys.filter(k => k.status === 'valid');
    if (validKeys.length === 0) return;

    const accountId = validKeys[0].accountId;
    const accountName = validKeys[0].accountName;

    setDocPhase('validating');
    setDocAccountInfo({ accountId, accountName });

    const keyCount = validKeys.length;
    addUserMessage(`Validar UK's`);
    setIsTyping(true);

    const t = setTimeout(() => {
      setIsTyping(false);
      addAssistantMessage(
        `Perfeito! Identifiquei ${keyCount} User-Key${keyCount > 1 ? 's' : ''} válida${keyCount > 1 ? 's' : ''} para a conta:\n\n🏢 ${accountName}\n🔑 ID: ${accountId}\n\nTudo pronto para iniciar a extração completa de dados desta conta. Clique em "Iniciar extração" para prosseguir.`,
        { type: 'confirmed' }
      );
      setDocPhase('confirmed');
    }, 1600);

    stateTimers.current = [t];
  }

  function handleDocStartExtraction() {
    const validKeys = docKeys.filter(k => k.status === 'valid').map(k => k.value.trim());
    const { accountId, accountName } = docAccountInfo;

    addUserMessage('Iniciar extração');
    setDocPhase('extracting');
    setDocLogs([]);
    setDocPct(0);

    const unmounted = { current: false };

    const abort = startExtraction(
      { keys: validKeys, accountId: String(accountId), accountName },
      {
        onProgress: (msg) => {
          if (unmounted.current) return;
          setDocLogs(prev => {
            const next = [...prev, msg];
            setDocPct(progressFromDocLogs(next));
            return next;
          });
        },
        onComplete: (data) => {
          if (unmounted.current) return;
          setDocPct(100);
          setDocResult(data);
          setDocPhase('done');
          addAssistantMessage(
            `Extração concluída com sucesso! 🎉\n\nDocumentei completamente a conta ${accountName}. Os arquivos estão prontos para download abaixo.\n\nComo ainda não tenho análise de IA integrada, sugiro usar um dos prompts gerados em uma ferramenta externa (ChatGPT, Claude, Gemini) para extrair insights sobre a conta documentada.`,
            { type: 'extraction-results' }
          );
        },
        onError: (msg) => {
          if (unmounted.current) return;
          setDocPhase('error');
          addAssistantMessage(
            `Ocorreu um erro durante a extração:\n\n❌ ${msg}\n\nVocê pode tentar novamente clicando em "Nova extração".`,
            { type: 'extraction-error' }
          );
        },
        onCancelled: () => {
          if (unmounted.current) return;
          setDocPhase('error');
          setDocCancelling(false);
          addAssistantMessage('Extração cancelada. Você pode iniciar uma nova extração quando quiser.', { type: 'extraction-error' });
        },
      }
    );

    docAbortRef.current = abort;
    return () => { unmounted.current = true; };
  }

  function handleDocCancel() {
    setDocCancelling(true);
    if (docAbortRef.current) docAbortRef.current();
  }

  function handleDocReset() {
    clearStateTimers();
    if (docAbortRef.current) { docAbortRef.current(); docAbortRef.current = null; }

    // Reset all doc state synchronously
    setDocPhase(null);
    setDocKeys([createDocKey()]);
    setDocGlobalError('');
    setDocLogs([]);
    setDocPct(0);
    setDocResult(null);
    setDocAccountInfo(null);
    setDocCancelling(false);

    // Start a fresh session
    setSession(newChatSession());

    // Use functional updates to restart the flow after state settles
    const t1 = setTimeout(() => {
      const userMsg = { id: Date.now(), role: 'user', text: 'Documentar uma conta' };
      setSession(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));
      setIsTyping(true);

      const t2 = setTimeout(() => {
        setIsTyping(false);
        const assistMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          text: 'Olá! Vou iniciar a documentação completa de uma conta Ploomes para você.\n\nPara isso, preciso das User-Keys de acesso à API. Você pode inserir até 5 User-Keys — todas devem pertencer à mesma conta.\n\nInsira as User-Keys abaixo e clique em "Validar" em cada uma para confirmarmos o acesso.',
          type: 'uk-form',
        };
        setSession(prev => ({ ...prev, messages: [...prev.messages, assistMsg] }));
        setDocPhase('awaiting-keys');
      }, 1400);

      stateTimers.current = [t2];
    }, 80);

    stateTimers.current = [t1];
  }

  function copyPrompt(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPrompt(key);
      setTimeout(() => setCopiedPrompt(null), 1800);
    });
  }


  // ---- Render helpers ----

  function renderDocKeyForm() {
    const accountId = docKeys.find(k => k.accountId)?.accountId ?? null;
    const accountName = docKeys.find(k => k.accountName)?.accountName ?? null;
    const validCount = docKeys.filter(k => k.status === 'valid').length;
    const allValidated = validCount > 0 && docKeys.every(k => !k.value.trim() || k.status === 'valid');
    const anyValidating = docKeys.some(k => k.status === 'validating');

    return (
      <DocFormWrapper>
        <DocFormCard $dm={darkMode}>
          {accountId && (
            <DocAccountBadge $dm={darkMode}>
              <i className="pi pi-building" style={{ color: '#7443f6' }} />
              {accountName} — ID: {accountId}
            </DocAccountBadge>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {docKeys.map((entry, idx) => (
              <div key={idx}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: darkMode ? '#7a6aaa' : '#9580c8', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  User-Key {idx + 1}{idx === 0 ? ' *' : ''}
                </div>
                <DocKeyRow>
                  <DocKeyInput
                    $dm={darkMode}
                    $valid={entry.status === 'valid'}
                    $invalid={entry.status === 'invalid'}
                    value={entry.value}
                    placeholder="Cole a User-Key aqui…"
                    onChange={e => updateDocKey(idx, { value: e.target.value, status: 'idle', error: null })}
                    onKeyDown={e => { if (e.key === 'Enter') validateSingleKey(idx); }}
                    disabled={entry.status === 'validating' || entry.status === 'valid'}
                  />
                  <DocValidBtn
                    $dm={darkMode}
                    onClick={() => validateSingleKey(idx)}
                    disabled={!entry.value.trim() || entry.status === 'validating' || entry.status === 'valid'}
                  >
                    {entry.status === 'validating' ? (
                      <><i className="pi pi-spin pi-spinner" /> Validando…</>
                    ) : entry.status === 'valid' ? (
                      <><i className="pi pi-check" style={{ color: '#22c55e' }} /> Válida</>
                    ) : 'Validar'}
                  </DocValidBtn>
                  {idx > 0 && (
                    <button
                      onClick={() => removeDocKey(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 0.2rem', flexShrink: 0 }}
                      title="Remover"
                    >
                      <i className="pi pi-times" />
                    </button>
                  )}
                </DocKeyRow>
                {entry.status === 'valid' && (
                  <DocStatusLine $ok>
                    <i className="pi pi-check-circle" />
                    {entry.accountName} — ID: {entry.accountId}
                  </DocStatusLine>
                )}
                {entry.status === 'invalid' && (
                  <DocStatusLine>
                    <i className="pi pi-times-circle" />
                    {entry.error}
                  </DocStatusLine>
                )}
              </div>
            ))}
          </div>

          {docKeys.length < MAX_DOC_KEYS && (
            <DocAddKeyBtn $dm={darkMode} onClick={addDocKey}>
              <i className="pi pi-plus" /> Adicionar outra User-Key
            </DocAddKeyBtn>
          )}

          {docGlobalError && (
            <DocErrorBox>
              <i className="pi pi-exclamation-triangle" style={{ marginTop: 1 }} />
              {docGlobalError}
            </DocErrorBox>
          )}
        </DocFormCard>
      </DocFormWrapper>
    );
  }

  function renderDocExtractionProgress() {
    // Converte logs brutos → objetos com tipo (main | sub | check | warn)
    const annotatedLogs = docLogs.map(raw => {
      const friendly = humanizeLog(raw);
      if (!friendly) return null;
      const isSub   = friendly.startsWith('   ↳');
      const isCheck = friendly.startsWith('✅');
      const isWarn  = friendly.startsWith('⚠') || friendly.startsWith('❌');
      return { text: friendly, isSub, isCheck, isWarn };
    }).filter(Boolean);

    // Para a lista exibida: mostra apenas as últimas N linhas principais + a última sub
    const mainLogs = annotatedLogs.filter(l => !l.isSub);
    const lastSub  = [...annotatedLogs].reverse().find(l => l.isSub);
    const displayLogs = [...mainLogs.slice(-10), ...(lastSub ? [lastSub] : [])];

    return (
      <DocExtractionWrapper>
        <AssistantIcon className="pi pi-sparkles" />
        <DocExtractionCard $dm={darkMode}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: darkMode ? '#c4b5fd' : '#4a2fa0' }}>
              {docPhase === 'done' ? '✅ Extração concluída!' : '🔄 Extraindo dados da conta...'}
            </span>
            <DocPctLabel $dm={darkMode}>{docPct}%</DocPctLabel>
          </div>

          <DocProgressBar $dm={darkMode}>
            <DocProgressFill $pct={docPct} />
          </DocProgressBar>

          {displayLogs.length > 0 && (
            <DocLogList>
              {displayLogs.map((entry, i, arr) => (
                <DocLogLine
                  key={i}
                  $dm={darkMode}
                  $active={i === arr.length - 1 && !entry.isSub}
                  style={{
                    fontSize: entry.isSub ? '0.76rem' : undefined,
                    opacity: entry.isSub ? 0.55 : undefined,
                    color: entry.isCheck
                      ? '#22c55e'
                      : entry.isWarn
                        ? '#f59e0b'
                        : undefined,
                  }}
                >
                  {entry.text}
                </DocLogLine>
              ))}
              <div ref={docLogEndRef} />
            </DocLogList>
          )}

          {docPhase === 'extracting' && displayLogs.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TypingDot delay="0s" />
              <TypingDot delay="0.2s" />
              <TypingDot delay="0.4s" />
            </div>
          )}
        </DocExtractionCard>
      </DocExtractionWrapper>
    );
  }

  const SPLIT_META = [
    { key: '01_funis_automacoes', label: '01 Funis & Automações', icon: 'pi-sitemap' },
    { key: '02_modelos_cpq',      label: '02 Modelos CPQ',        icon: 'pi-file' },
    { key: '03_dicionario_campos',label: '03 Dicionário de Campos',icon: 'pi-list' },
    { key: '04_config_geral',     label: '04 Config Geral',       icon: 'pi-cog' },
    { key: '05_uso_da_conta',     label: '05 Uso da Conta',       icon: 'pi-chart-bar' },
  ];

  function renderDocResultsInline() {
    if (!docResult) return null;
    const splits = docResult.splits ?? {};

    return (
      <DocResultsWrapper>
        <DocSectionLabel $dm={darkMode}>Arquivos gerados (temáticos)</DocSectionLabel>
        <DocDownloadGrid>
          {SPLIT_META.map(({ key, label, icon }) =>
            splits[key] ? (
              <DocDownloadBtn key={key} $dm={darkMode} onClick={() => downloadJson(splits[key], `${key}.json`)}>
                <i className={`pi ${icon}`} /> {label}
              </DocDownloadBtn>
            ) : null
          )}
          {docResult.summary && (
            <DocDownloadBtn $dm={darkMode} onClick={() => downloadText(docResult.summary, 'resumo_extracao.txt')}>
              <i className="pi pi-file-edit" /> Resumo (.txt)
            </DocDownloadBtn>
          )}
        </DocDownloadGrid>

        {docResult.storage && (
          <DocStorageBadge>
            <i className="pi pi-check-circle" />
            Arquivos salvos na biblioteca Ploomes — Pasta ID: {docResult.storage.folderId}
          </DocStorageBadge>
        )}

        {docResult.aiPayload?.prompts && (
          <>
            <DocSectionLabel $dm={darkMode} style={{ marginTop: '0.25rem' }}>Prompts sugeridos para IA externa</DocSectionLabel>
            {Object.entries(docResult.aiPayload.prompts).map(([key, text]) => (
              <DocPromptCard key={key} $dm={darkMode}>
                <DocPromptLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</DocPromptLabel>
                <DocPromptText $dm={darkMode}>{text}</DocPromptText>
                <DocCopyBtn $dm={darkMode} onClick={() => copyPrompt(key, text)}>
                  <i className={copiedPrompt === key ? 'pi pi-check' : 'pi pi-copy'} />
                  {copiedPrompt === key ? 'Copiado!' : 'Copiar prompt'}
                </DocCopyBtn>
              </DocPromptCard>
            ))}
          </>
        )}
      </DocResultsWrapper>
    );
  }
  // ---- Derived values ----
  const messages = session.messages;
  const hasMessages = messages.length > 0;
  const lastMsg = messages[messages.length - 1];
  const isDocFlow = docPhase !== null;

  const docValidCount = docKeys.filter(k => k.status === 'valid').length;
  const docAnyValidating = docKeys.some(k => k.status === 'validating');
  const docCanValidate = docValidCount > 0 && !docAnyValidating && docPhase === 'awaiting-keys';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <PageWrapper>
      {/* CHAT COLUMN */}
      <ChatColumn>
        {/* HEADER */}
        <HeaderSlot>
        <ServiceHeader
          platforms={[]}
          icon="pi pi-sparkles"
          title="N1 Copilot"
          subtitle="Assistente de IA do Suporte N1 para dúvidas de Ploomes e procedimentos internos."
          actions={
            <HeaderActions>
              <IconBtn darkMode={darkMode} onClick={startNewChat} title="Iniciar novo chat">
                <i className="pi pi-plus" />
                Novo chat
              </IconBtn>
              <IconBtn
                darkMode={darkMode}
                active={showHistory}
                onClick={() => setShowHistory((v) => !v)}
                title="Histórico de chats"
              >
                <i className="pi pi-history" />
              </IconBtn>
            </HeaderActions>
          }
        />
        </HeaderSlot>

        {/* MESSAGES */}
        <MessagesArea>
          {!hasMessages && !isTyping && !isDocFlow ? (
            /* ---- EMPTY STATE ---- */
            <EmptyState>
              <EmptyIcon className="pi pi-sparkles" />
              <EmptyTitle darkMode={darkMode}>
                Como posso ajudar você hoje?
              </EmptyTitle>
              <SuggestionsGrid>
                {SUGGESTIONS.filter(s => !s.adminOnly || isAdmin).map((s) => {
                  const restricted = (!!s.feature && !canDocumenter) || !canUse;
                  const isDisabled = !!s.disabled || restricted;
                  const title = s.disabled
                    ? 'Em breve disponível por aqui'
                    : !canUse
                      ? 'Disponível apenas para perfil gestor+ do Suporte N1'
                      : restricted
                        ? 'Disponível para Suporte N1 (perfil geral+) ou perfil gestor'
                        : undefined;
                  return (
                    <SuggestionCard
                      key={s.text}
                      darkMode={darkMode}
                      disabled={isDisabled}
                      title={title}
                      onClick={() => {
                        if (isDisabled) return;
                        if (s.action === 'documentar') {
                          navigate('/copilot/documentador');
                        } else {
                          sendMessage(s.text);
                        }
                      }}
                    >
                      <SuggestionIcon>{s.icon}</SuggestionIcon>
                      {s.text}
                    </SuggestionCard>
                  );
                })}
              </SuggestionsGrid>
            </EmptyState>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <MessageRow isUser={msg.role === 'user'}>
                      {msg.role === 'assistant' && (
                        <AssistantIcon className="pi pi-sparkles" />
                      )}
                      <Bubble isUser={msg.role === 'user'} darkMode={darkMode}>
                        {msg.role === 'user' ? (
                          msg.text
                        ) : (
                          <MarkdownBody darkMode={darkMode}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {withMarkdownBreaks(msg.text)}
                            </ReactMarkdown>
                          </MarkdownBody>
                        )}
                      </Bubble>
                    </MessageRow>

                    {/* Inline doc key form — appears below the uk-form message */}
                    {isLast && msg.role === 'assistant' && msg.type === 'uk-form' && docPhase === 'awaiting-keys' && (
                      renderDocKeyForm()
                    )}

                    {/* Inline results — appears below the extraction-results message */}
                    {isLast && msg.role === 'assistant' && msg.type === 'extraction-results' && docResult && (
                      renderDocResultsInline()
                    )}

                  </div>
                );
              })}

              {isTyping && <TypingIndicator darkMode={darkMode} />}

              {/* Extraction progress — shown while extracting (ephemeral, not in messages) */}
              {(docPhase === 'extracting' || (docPhase === 'done' && !docResult)) && (
                renderDocExtractionProgress()
              )}

            </>
          )}
          <div ref={messagesEndRef} />
        </MessagesArea>

        {/* INPUT / ACTION AREA */}
        <InputArea darkMode={darkMode}>
          {/* Aviso de modo somente-leitura (perfis abaixo de gestor no Suporte N1) */}
          {!canUse && (
            <ReadOnlyNotice darkMode={darkMode}>
              <i className="pi pi-lock" />
              Você pode visualizar o N1 Copilot, mas o uso é exclusivo para perfis gestor+ do Suporte N1.
            </ReadOnlyNotice>
          )}

          {/* Normal chat input */}
          {!isDocFlow && (
            <InputRow>
              <StyledTextarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAdmin
                  ? 'Pergunte à base de conhecimento (RAG)…'
                  : canUse
                    ? 'Descreva o que você deseja automatizar ou analisar...'
                    : 'Uso disponível apenas para perfil gestor+ do Suporte N1'}
                autoResize
                rows={1}
                darkMode={darkMode}
                disabled={!canUse && !isAdmin}
              />
              <SendButton
                icon="pi pi-send"
                disabled={(!canUse && !isAdmin) || !inputValue.trim() || isTyping}
                onClick={() => sendMessage(inputValue)}
                aria-label="Enviar mensagem"
              />
            </InputRow>
          )}

          {/* Doc flow: awaiting keys → "Validar UK's" */}
          {docPhase === 'awaiting-keys' && (
            <>
              <DocActionArea>
                <DocMainButton
                  onClick={handleDocValidate}
                  disabled={!docCanValidate || isTyping}
                >
                  <i className="pi pi-shield" />
                  Validar UK's
                </DocMainButton>
                <DocSecondaryButton $dm={darkMode} onClick={startNewChat}>
                  <i className="pi pi-times" /> Cancelar
                </DocSecondaryButton>
              </DocActionArea>
              <DocHint $dm={darkMode}>
                Valide cada UK individualmente antes de confirmar
              </DocHint>
            </>
          )}

          {/* Doc flow: validating → loading */}
          {docPhase === 'validating' && (
            <DocActionArea style={{ justifyContent: 'center', padding: '0.4rem 0' }}>
              <span style={{ fontSize: '0.88rem', color: darkMode ? '#9580c8' : '#7a6aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="pi pi-spin pi-spinner" style={{ color: '#7443f6' }} />
                Processando validação...
              </span>
            </DocActionArea>
          )}

          {/* Doc flow: confirmed → "Iniciar extração" */}
          {docPhase === 'confirmed' && (
            <>
              <DocActionArea>
                <DocMainButton onClick={handleDocStartExtraction} disabled={isTyping}>
                  <i className="pi pi-play" />
                  Iniciar extração de documentação da conta
                </DocMainButton>
                <DocSecondaryButton $dm={darkMode} onClick={startNewChat}>
                  <i className="pi pi-times" /> Cancelar
                </DocSecondaryButton>
              </DocActionArea>
              {docAccountInfo && (
                <DocHint $dm={darkMode}>
                  Conta: {docAccountInfo.accountName} — ID: {docAccountInfo.accountId}
                </DocHint>
              )}
            </>
          )}

          {/* Doc flow: extracting → cancel */}
          {docPhase === 'extracting' && (
            <DocActionArea>
              <DocCancelButton
                onClick={handleDocCancel}
                disabled={docCancelling}
              >
                <i className={docCancelling ? 'pi pi-spin pi-spinner' : 'pi pi-stop-circle'} />
                {docCancelling ? 'Cancelando...' : 'Cancelar extração'}
              </DocCancelButton>
            </DocActionArea>
          )}

          {/* Doc flow: done | error → nova extração */}
          {(docPhase === 'done' || docPhase === 'error') && (
            <DocActionArea>
              <DocMainButton onClick={handleDocReset}>
                <i className="pi pi-refresh" />
                Nova extração
              </DocMainButton>
              <DocSecondaryButton $dm={darkMode} onClick={() => { resetDocState(); navigate('/copilot'); }}>
                <i className="pi pi-arrow-left" /> Voltar ao Copilot
              </DocSecondaryButton>
            </DocActionArea>
          )}

        </InputArea>
      </ChatColumn>

      {/* HISTORY PANEL */}
      {showHistory && (
        <HistoryPanel darkMode={darkMode}>
          <HistoryTitle darkMode={darkMode}>Chats recentes</HistoryTitle>
          <HistoryList>
            {chatHistory.length === 0 ? (
              <EmptyHistory darkMode={darkMode}>Nenhum chat salvo ainda</EmptyHistory>
            ) : (
              chatHistory.map((chat) => {
                const firstMsg = chat.messages.find((m) => m.role === 'user');
                const title = firstMsg
                  ? firstMsg.text.slice(0, 40) + (firstMsg.text.length > 40 ? '…' : '')
                  : 'Chat sem mensagens';
                return (
                  <HistoryItem
                    key={chat.id}
                    darkMode={darkMode}
                    active={chat.id === session.id}
                    onClick={() => loadSession(chat)}
                  >
                    <HistoryItemContent>
                      <HistoryItemTitle darkMode={darkMode}>{title}</HistoryItemTitle>
                      <HistoryItemDate darkMode={darkMode}>
                        {formatRelative(chat.createdAt)}
                      </HistoryItemDate>
                    </HistoryItemContent>
                    <HistoryDeleteBtn
                      darkMode={darkMode}
                      onClick={(e) => removeChatFromHistory(e, chat.id)}
                      title="Remover"
                    >
                      <i className="pi pi-times" />
                    </HistoryDeleteBtn>
                  </HistoryItem>
                );
              })
            )}
          </HistoryList>
        </HistoryPanel>
      )}
    </PageWrapper>
  );
}
