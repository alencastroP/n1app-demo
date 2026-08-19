// src/components/ServiceHeader.jsx
// Header padronizado de página de serviço: logo(s) de plataforma + título +
// subtítulo + slot de ações. Substitui os headers ad-hoc das páginas.
//
//   <ServiceHeader
//     title="Extração de Changelog"
//     subtitle="Extraia o histórico de alterações da conta."
//     platforms={['ploomes']}                 // ou ['ploomes','sankhya'] p/ integrações
//     actions={<Button ... />}                // opcional, alinhado à direita
//     variant="standalone"                    // ou "band" (banda interna de Card)
//   />
//
// - `platforms` renderiza as logos reais de frontend/src/assets (par claro/
//   escuro quando existe — hoje só Ploomes). Múltiplas plataformas ganham o
//   conector visual pi-arrow-right-arrow-left (padrão já usado no app).
//   Plataforma sem logo mapeada cai em fallback tipográfico (não quebra).
// - `icon` (pi pi-*) é o fallback para serviço sem plataforma (ex.: Jsonx).
// - `variant="band"`: banda de topo interna a um Card (fundo próprio +
//   border-bottom, sem raio próprio) — o Card pai deve ter overflow: hidden.
// - Dark mode via useTheme() do DS; estilos via tokens do theme.

import { Fragment } from 'react';
import styled from 'styled-components';
import { useTheme } from '../design-system';
import { useAccountControlSlot } from '../context/AccountControlSlotContext';

import ploomesLight from '../assets/horizontal_colorido.png';
import ploomesDark from '../assets/ploomes_logo.png';
import sankhyaLogo from '../assets/sankhya texto png logo.png';
import omieLogo from '../assets/omie.png';
import intercomLogo from '../assets/intercom-logo.png';
import cloudhumanLogo from '../assets/cloudhuman logo.png';
import powerbiLogo from '../assets/power-bi-icon.png';
import claudeLogo from '../assets/claude-logo.png';

// Assets reais inventariados (Fase 0). `dark` só onde existe variante.
const PLATFORM_LOGOS = {
  ploomes:    { alt: 'Ploomes',    light: ploomesLight,   dark: ploomesDark, height: 22 },
  sankhya:    { alt: 'Sankhya',    light: sankhyaLogo,    height: 42 },
  omie:       { alt: 'Omie',       light: omieLogo,       height: 26 },
  intercom:   { alt: 'Intercom',   light: intercomLogo,   height: 24 },
  cloudhuman: { alt: 'CloudHuman', light: cloudhumanLogo, height: 30 },
  powerbi:    { alt: 'Power BI',   light: powerbiLogo,    height: 38 },
  claude:     { alt: 'Claude',     light: claudeLogo,     height: 24 },
};

const Wrap = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  font-family: ${({ theme }) => theme.typography.fonts.sans};

  ${({ $variant, theme }) =>
    $variant === 'band'
      ? `
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        background: ${theme.colors.bg.sunken};
        border-bottom: 1px solid ${theme.colors.border.subtle};
      `
      : `
        padding: 0 0 ${theme.spacing.md} 0;
        border-bottom: 1px solid ${theme.colors.border.subtle};
        margin-bottom: ${theme.spacing.lg};
      `}
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`;

const Logo = styled.img`
  display: block;
  height: ${({ $h }) => $h}px;
  object-fit: contain;
`;

const Connector = styled.i`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
`;

// Fallback tipográfico para plataforma sem logo em assets (não inventar SVG).
const PlatformFallback = styled.span`
  padding: 2px ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: capitalize;
  white-space: nowrap;
`;

const IconBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
  i { font-size: 1rem; }
`;

const Divider = styled.span`
  width: 1px;
  height: 28px;
  background: ${({ theme }) => theme.colors.border.default};
  flex-shrink: 0;
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 220px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme, $variant }) =>
    $variant === 'band' ? theme.typography.sizes.lg : theme.typography.sizes['2xl']};
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.snug};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-left: auto;
`;

// Destino do controle de sessão. Fica vazio (e sem ocupar espaço) enquanto o
// Layout não portar o widget para cá.
const AccountControlSlot = styled.div`
  display: flex;
  align-items: center;
  &:empty { display: none; }
`;

export function ServiceHeader({
  title,
  subtitle,
  platforms = ['ploomes'],
  icon,
  actions,
  variant = 'standalone',
  // O controle de sessão é portado para cá pelo Layout (ver
  // AccountControlSlotContext) e ocupa a mesma linha do título. Passe `false`
  // numa tela que não deva exibi-lo.
  accountControl = true,
  'data-testid': dataTestId,
  ...rest
}) {
  const { isDark } = useTheme();
  const { registerSlot } = useAccountControlSlot();

  const logos = (platforms ?? []).map((key) => ({ key, def: PLATFORM_LOGOS[key] }));
  const hasLogos = logos.length > 0;

  return (
    <Wrap $variant={variant} data-testid={dataTestId} {...rest}>
      {hasLogos ? (
        <>
          <LogoRow>
            {logos.map(({ key, def }, i) => (
              <Fragment key={key}>
                {i > 0 && <Connector className="pi pi-arrow-right-arrow-left" aria-hidden="true" />}
                {def ? (
                  <Logo
                    src={isDark && def.dark ? def.dark : def.light}
                    alt={def.alt}
                    $h={def.height}
                  />
                ) : (
                  <PlatformFallback>{key}</PlatformFallback>
                )}
              </Fragment>
            ))}
          </LogoRow>
          <Divider aria-hidden="true" />
        </>
      ) : (
        icon && (
          <IconBadge aria-hidden="true">
            <i className={icon} />
          </IconBadge>
        )
      )}

      <TextBlock>
        <Title $variant={variant}>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TextBlock>

      {(actions || accountControl) && (
        <Actions>
          {actions}
          {accountControl && <AccountControlSlot ref={registerSlot} />}
        </Actions>
      )}
    </Wrap>
  );
}

export default ServiceHeader;
