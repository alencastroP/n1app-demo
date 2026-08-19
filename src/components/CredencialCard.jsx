// src/components/CredencialCard.jsx
// Seção de credencial (User-Key) unificada dos services — substitui as
// variações página a página (olho mágico, "Validar UK", card da conta).
//
// Comportamento padrão:
//  - Input de UK mascarado (password) com toggle de visibilidade.
//  - Conta ativa: com conta ativa e campo vazio, a UK JÁ VEM PREENCHIDA com
//    um chip "Conta ativa: {Nome} (ID {id})" e ações Confirmar (valida e segue
//    o fluxo normal) e Trocar (limpa e libera digitação manual).
//    Preencher ≠ executar: as validações/confirmações do form continuam.
//  - Botão "Validar UK" chama o validador da página (onValidate) — cada
//    service continua dono da própria validação (§9.4).
//  - Conta validada vira chip com logo, nome e ID; editar a UK limpa a conta
//    validada (comportamento padronizado).
//  - `extra`: slot para campos extras da credencial (ex.: ambiente Sankhya).
//
// Segurança: a UK nunca é logada nem exibida em mensagens de erro.
//
// API (controlada pela página):
//   <CredencialCard
//     uk={uk} onUkChange={setUk}
//     account={account} onAccountChange={setAccount}   // {accountId, accountName, logoUrl}|null
//     onValidate={async (uk) => ({ accountId, accountName, logoUrl })} // opcional; throws Error
//     label="User-Key da conta" placeholder disabled compact
//     prefillContaAtiva={true}     // desligue em linhas extras de multi-key
//     showAccountChip={true}
//     extra={<SeletorDeAmbiente />}
//   />
//
// Validação controlada (ex.: wrapper UserKeyCard do Process Implementer):
//  - se onValidate resolver `undefined`, o componente NÃO mexe em account —
//    a página gerencia o próprio estado de validação;
//  - `validating` e `error` (quando informados) sobrepõem o estado interno.

import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useDarkMode } from '../DarkModeContext';
import { useAccountSession } from '../context/AccountSessionContext';

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ $compact }) => ($compact ? '0.4rem' : '0.6rem')};
  min-width: 0;
`;

const FieldLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
`;

const Row = styled.div`
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
`;

const UkInput = styled.input`
  flex: 1;
  min-width: 180px;
  padding: ${({ $compact }) => ($compact ? '0.5rem 0.75rem' : '0.6rem 0.9rem')};
  border-radius: 10px;
  border: 1.5px solid ${({ $valid, $invalid, $dm }) =>
    $valid ? '#22c55e' : $invalid ? '#ef4444' : ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#130d26' : '#f8f6ff')};
  color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')};
  font-size: 0.88rem;
  font-family: monospace;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: #7443f6; box-shadow: 0 0 0 2px rgba(116, 67, 246, 0.18); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border-radius: 9px;
  border: 1.5px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#251840' : '#f5f2ff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
  &:hover:not(:disabled) { background: ${({ $dm }) => ($dm ? '#2e1f50' : '#ede8ff')}; border-color: #7443f6; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
  i { font-size: 0.75rem; }
`;

const PrimaryBtn = styled(Btn)`
  background: #7443f6;
  border-color: #7443f6;
  color: #fff;
  &:hover:not(:disabled) { background: #6233e0; border-color: #6233e0; }
`;

// Chip de pré-seleção da conta ativa (antes de Confirmar/Trocar).
const PrefillChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1.5px dashed ${({ $dm }) => ($dm ? '#3a2a5e' : '#d0c8f0')};
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#f5f2ff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};
  i { flex-shrink: 0; }
  strong { color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')}; }
`;

const PrefillActions = styled.span`
  display: inline-flex;
  gap: 0.4rem;
  margin-left: auto;
`;

// Chip da conta validada (logo, nome, ID).
const AccountChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.8rem;
  border-radius: 10px;
  font-size: 0.85rem;
  border: 1px solid rgba(34, 197, 94, 0.45);
  background: ${({ $dm }) => ($dm ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.07)')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#4a2fa0')};
  min-width: 0;

  strong {
    color: ${({ $dm }) => ($dm ? '#e2d9ff' : '#222')};
    overflow-wrap: anywhere;
  }
  .conta-id {
    font-size: 0.75rem;
    font-weight: 600;
    color: ${({ $dm }) => ($dm ? '#7a6aaa' : '#9580c8')};
    white-space: nowrap;
  }
  .pi-check-circle { color: #22c55e; margin-left: auto; flex-shrink: 0; }
`;

const LogoTile = styled.span`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid ${({ $dm }) => ($dm ? '#3a2a5e' : '#e4e0f5')};
  background: ${({ $dm }) => ($dm ? '#1a1230' : '#fff')};
  color: ${({ $dm }) => ($dm ? '#c4b5fd' : '#5b3ec8')};

  img { width: 100%; height: 100%; object-fit: contain; }
  i { font-size: 0.85rem; }
`;

const ErrorLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: ${({ $dm }) => ($dm ? '#fca5a5' : '#dc2626')};
  i { flex-shrink: 0; }
`;

export default function CredencialCard({
  uk,
  onUkChange,
  account = null,
  onAccountChange,
  onValidate,
  label = 'User-Key da conta',
  placeholder = 'Cole a User-Key da conta aqui…',
  validateLabel = 'Validar UK',
  disabled = false,
  compact = false,
  prefillContaAtiva = true,
  showAccountChip = true,
  extra = null,
  validating: validatingProp,
  error: errorProp,
}) {
  const { darkMode: dm } = useDarkMode();
  const { conta } = useAccountSession();

  const [showUk, setShowUk] = useState(false);
  const [internalValidating, setInternalValidating] = useState(false);
  const [internalError, setInternalError] = useState('');
  const validating = validatingProp ?? internalValidating;
  const errorMsg = errorProp ?? internalError;
  // Pré-seleção pendente: UK preenchida da conta ativa, aguardando Confirmar/Trocar.
  const [prefillPending, setPrefillPending] = useState(false);
  const prefillTriedRef = useRef(false);
  const inputRef = useRef(null);

  // Pré-seleção por padrão: com conta ativa e campo vazio, preenche a UK uma
  // única vez (nunca sobrescreve digitação do usuário nem repete após Trocar).
  useEffect(() => {
    if (!prefillContaAtiva || prefillTriedRef.current) return;
    if (!conta || account || (uk && uk.trim())) {
      // Campo já em uso (ou sem conta ativa): não pré-seleciona nesta montagem.
      if (uk && uk.trim()) prefillTriedRef.current = true;
      return;
    }
    prefillTriedRef.current = true;
    setPrefillPending(true);
    onUkChange?.(conta.uk);
  }, [conta, uk, account, prefillContaAtiva, onUkChange]);

  const clearValidation = () => {
    setInternalError('');
    if (account) onAccountChange?.(null);
  };

  const handleChange = (value) => {
    setPrefillPending(false);
    clearValidation();
    onUkChange?.(value);
  };

  const handleValidate = async () => {
    const trimmed = (uk ?? '').trim();
    // `account` no guard: Enter não revalida credencial já válida (espelha o
    // disabled do botão — revalidar exigiria editar a UK, que limpa a conta).
    if (!trimmed || validating || account) return;
    // Normaliza espaços acidentais no estado da página: o que valida é o que
    // as chamadas subsequentes do form vão usar.
    if (trimmed !== uk) onUkChange?.(trimmed);
    setPrefillPending(false);
    setInternalError('');
    if (!onValidate) return;
    setInternalValidating(true);
    try {
      const result = await onValidate(trimmed);
      // `undefined` = a página gerencia o próprio estado (validação controlada).
      if (result !== undefined) onAccountChange?.(result ?? null);
    } catch (err) {
      onAccountChange?.(null);
      setInternalError(err?.message || 'Não foi possível validar a User-Key.');
    } finally {
      setInternalValidating(false);
    }
  };

  // Trocar: limpa o campo e libera digitação manual.
  const handleTrocar = () => {
    setPrefillPending(false);
    clearValidation();
    onUkChange?.('');
    inputRef.current?.focus();
  };

  const showPrefillChip =
    prefillPending && conta && !account && (uk ?? '').trim() === conta.uk;

  return (
    <Wrap $compact={compact}>
      {!compact && label && <FieldLabel $dm={dm}>{label}</FieldLabel>}

      {showPrefillChip && (
        <PrefillChip $dm={dm}>
          <i className="pi pi-bolt" />
          <span>
            Conta ativa: <strong>{conta.accountName}</strong> (ID {conta.accountId})
          </span>
          <PrefillActions>
            {onValidate ? (
              <PrimaryBtn $dm={dm} type="button" onClick={handleValidate} disabled={disabled || validating}>
                {validating
                  ? (<><i className="pi pi-spin pi-spinner" /> Validando…</>)
                  : (<><i className="pi pi-check" /> Confirmar</>)}
              </PrimaryBtn>
            ) : (
              <PrimaryBtn $dm={dm} type="button" onClick={() => setPrefillPending(false)} disabled={disabled}>
                <i className="pi pi-check" /> Confirmar
              </PrimaryBtn>
            )}
            <Btn $dm={dm} type="button" onClick={handleTrocar} disabled={disabled || validating}>
              <i className="pi pi-sync" /> Trocar
            </Btn>
          </PrefillActions>
        </PrefillChip>
      )}

      <Row>
        {extra}
        <UkInput
          ref={inputRef}
          $dm={dm}
          $compact={compact}
          $valid={!!account}
          $invalid={!!errorMsg}
          type={showUk ? 'text' : 'password'}
          placeholder={placeholder}
          value={uk ?? ''}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleValidate(); } }}
          disabled={disabled || validating}
          aria-label={label}
          autoComplete="off"
        />
        <Btn
          $dm={dm}
          type="button"
          onClick={() => setShowUk((v) => !v)}
          title={showUk ? 'Ocultar User-Key' : 'Mostrar User-Key'}
          disabled={disabled}
        >
          <i className={`pi ${showUk ? 'pi-eye-slash' : 'pi-eye'}`} />
        </Btn>
        {onValidate && (
          <Btn
            $dm={dm}
            type="button"
            onClick={handleValidate}
            disabled={disabled || !(uk ?? '').trim() || validating || !!account}
          >
            {validating
              ? (<><i className="pi pi-spin pi-spinner" /> Validando…</>)
              : (account ? (<><i className="pi pi-check" /> Válida</>) : validateLabel)}
          </Btn>
        )}
      </Row>

      {/* Erro nunca convive com conta validada (páginas com auto-validação
          externa, ex. debounce do Changelog, podem setar account por fora). */}
      {errorMsg && !account && (
        <ErrorLine $dm={dm}>
          <i className="pi pi-times-circle" />
          <span>{errorMsg}</span>
        </ErrorLine>
      )}

      {showAccountChip && account && (
        <AccountChip $dm={dm}>
          <LogoTile $dm={dm}>
            {account.logoUrl
              ? <img src={account.logoUrl} alt="" />
              : <i className="pi pi-building" />}
          </LogoTile>
          <span>
            <strong>{account.accountName ?? 'Conta sem nome'}</strong>{' '}
            {account.accountId != null && (
              <span className="conta-id">ID {account.accountId}</span>
            )}
          </span>
          <i className="pi pi-check-circle" />
        </AccountChip>
      )}
    </Wrap>
  );
}
