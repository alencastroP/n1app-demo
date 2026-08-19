// src/pages/FunilTecnico/components/PlanoAcao.jsx
import styled from 'styled-components';
import { palette, PrimaryBtn, GhostBtn, PLAYBOOK_STEP_ICON } from './ui';
import { PLAYBOOK_STEP } from '../../../config/funilTecnicoPlaybooks';
import PassoDynatrace from './PassoDynatrace';

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const Step = styled.div`
  display: flex;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
  border-radius: 12px;
  background: ${({ $dark }) => palette($dark).panel};
  border: 1px solid ${({ $dark }) => palette($dark).border};
`;

const Num = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 0.74rem;
  font-weight: 800;
  color: ${({ $dark }) => ($dark ? '#ddd6fe' : '#5b21b6')};
  background: ${({ $dark }) => palette($dark).accentBg};
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $dark }) => palette($dark).textStrong};

  i { font-size: 0.8rem; color: ${({ $dark }) => palette($dark).accent}; }
`;

const Desc = styled.p`
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: ${({ $dark }) => palette($dark).muted};
`;

const Gated = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  color: ${({ $dark }) => ($dark ? '#fbbf24' : '#b45309')};
  background: ${({ $dark }) => ($dark ? 'rgba(251,191,36,.12)' : 'rgba(217,119,6,.09)')};
  border: 1px solid ${({ $dark }) => ($dark ? 'rgba(251,191,36,.28)' : 'rgba(217,119,6,.2)')};

  i { font-size: 0.72rem; }
`;

const CtaRow = styled.div`
  margin-top: 0.15rem;
`;

/* CTA de passo que implicaria ESCRITA no Ploomes: desabilitado nesta entrega
   (restrição de escopo — replicação de alterações fica para fase futura). */
const WriteGatedBtn = styled(PrimaryBtn)`
  opacity: 0.55;
  cursor: not-allowed;
`;

/* CTA de IA sem alvo definido no briefing: desabilitado até a triagem apontar
   um identificador do CLIENTE a investigar. */
const NoTargetBtn = styled(PrimaryBtn)`
  opacity: 0.55;
  cursor: not-allowed;
`;

/**
 * Plano de ação de um caso: passos derivados do playbook do CASE_TYPE/categoria.
 *
 * @param {Array<object>} steps          passos do playbook
 * @param {object}        dynatrace      { logs, onChange } estado do passo manual
 * @param {(step)=>void}  onOpenService  abre um serviço N1 (deep-link)
 * @param {(step)=>void}  onRunIa        dispara passo de IA (parent aplica o gate LGPD)
 * @param {boolean}       deepEnabled    se a análise profunda está liberada (backend)
 * @param {boolean}       hasTarget      se o briefing tem identificador do cliente
 *                                       (extractClientTargets → !semAlvo)
 * @param {(msg)=>void}   onToast
 */
export default function PlanoAcao({
  steps = [],
  dark,
  dynatrace,
  onOpenService,
  onRunIa,
  deepEnabled = false,
  hasTarget = true,
  onToast,
}) {
  if (!steps.length) return null;

  return (
    <List>
      {steps.map((step, i) => {
        const isDeep = step.tipo === PLAYBOOK_STEP.IA && step.iaKind === 'deep';
        const gatedOff = isDeep && !deepEnabled;
        const noTarget = step.requiresTarget && !hasTarget;

        return (
          <Step key={`${step.label}-${i}`} $dark={dark}>
            <Num $dark={dark}>{i + 1}</Num>
            <Body>
              <Top $dark={dark}>
                <i className={`pi ${step.icon || PLAYBOOK_STEP_ICON[step.tipo]}`} />
                {step.label}
              </Top>
              <Desc $dark={dark}>{step.descricao}</Desc>

              {/* Passo manual do Dynatrace: textarea embutido. */}
              {step.tipo === PLAYBOOK_STEP.MANUAL && step.dynatrace && (
                <PassoDynatrace
                  query={step.query}
                  logs={dynatrace?.logs}
                  onChange={dynatrace?.onChange}
                  dark={dark}
                  onCopied={onToast}
                />
              )}

              <CtaRow>
                {step.writeGated && (
                  <WriteGatedBtn type="button" disabled title="Disponível em breve">
                    <i className="pi pi-bolt" /> Aprovar e executar
                  </WriteGatedBtn>
                )}

                {step.tipo === PLAYBOOK_STEP.SERVICE && (
                  <GhostBtn $dark={dark} onClick={() => onOpenService?.(step)} type="button">
                    <i className="pi pi-arrow-up-right" /> Abrir serviço
                  </GhostBtn>
                )}

                {step.tipo === PLAYBOOK_STEP.IA && !gatedOff && noTarget && (
                  <NoTargetBtn
                    type="button"
                    disabled
                    title="Sem alvo definido para investigar — revise a triagem"
                  >
                    <i className="pi pi-sparkles" />
                    {step.iaKind === 'rag' ? 'Consultar base (RAG)' : 'Executar análise'}
                  </NoTargetBtn>
                )}

                {step.tipo === PLAYBOOK_STEP.IA && !gatedOff && !noTarget && (
                  <PrimaryBtn onClick={() => onRunIa?.(step)} type="button">
                    <i className="pi pi-sparkles" />
                    {step.iaKind === 'rag' ? 'Consultar base (RAG)' : 'Executar análise'}
                  </PrimaryBtn>
                )}

                {gatedOff && (
                  <Gated $dark={dark}>
                    <i className="pi pi-lock" />
                    Pendente de aprovação de privacidade (LGPD)
                  </Gated>
                )}
              </CtaRow>
            </Body>
          </Step>
        );
      })}
    </List>
  );
}
