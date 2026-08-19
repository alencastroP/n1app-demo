// src/components/intercom-dashboard/ReportErrorBoundary.jsx
//
// ErrorBoundary local do conteúdo do relatório: qualquer exceção de render
// vira um card amigável (com detalhes técnicos colapsados) em vez de
// desmontar o app inteiro (tela preta). Class component por exigência da
// API de error boundary do React — dark mode chega via prop `dm`.
import { Component } from 'react';
import styled from 'styled-components';
import { Button } from 'primereact/button';

const ErrorCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
  background: ${({ $dm }) => ($dm ? 'rgba(239,68,68,0.1)' : '#fef2f2')};
  border: 1px solid ${({ $dm }) => ($dm ? '#ef4444' : '#fca5a5')};

  > i.icon-main {
    flex-shrink: 0;
    margin-top: 0.15rem;
    font-size: 1.2rem;
    color: ${({ $dm }) => ($dm ? '#f87171' : '#dc2626')};
  }
`;

const ErrorBody = styled.div`
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 0.92rem;
    color: ${({ $dm }) => ($dm ? '#fca5a5' : '#b91c1c')};
    margin-bottom: 0.35rem;
  }

  p {
    margin: 0;
    font-size: 0.84rem;
    line-height: 1.55;
    color: ${({ $dm }) => ($dm ? '#f0a8a8' : '#dc2626')};
    word-break: break-word;
  }
`;

const TechDetails = styled.details`
  margin-top: 0.6rem;

  summary {
    cursor: pointer;
    font-size: 0.78rem;
    color: ${({ $dm }) => ($dm ? '#f0a8a8' : '#dc2626')};
    user-select: none;
  }

  pre {
    margin: 0.5rem 0 0;
    padding: 0.6rem 0.75rem;
    max-height: 220px;
    overflow: auto;
    border-radius: 8px;
    font-size: 0.72rem;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
    background: ${({ $dm }) => ($dm ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)')};
    color: ${({ $dm }) => ($dm ? '#fca5a5' : '#991b1b')};
  }
`;

export default class ReportErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Intercom Dashboard] erro de render no relatório:', error, info?.componentStack);
    this.setState({ info });
  }

  handleRetry = () => {
    this.setState({ error: null, info: null });
    this.props.onRetry?.();
  };

  render() {
    const { error, info } = this.state;
    const { dm, children } = this.props;

    if (!error) return children;

    return (
      <ErrorCard $dm={dm}>
        <i className="pi pi-exclamation-triangle icon-main" />
        <ErrorBody $dm={dm}>
          <strong>Não foi possível renderizar o relatório</strong>
          <p>Ocorreu um erro inesperado ao exibir os dados. Tente gerar o relatório novamente.</p>
          <TechDetails $dm={dm}>
            <summary>Detalhes técnicos</summary>
            <pre>{`${error?.message || String(error)}${info?.componentStack ? `\n${info.componentStack}` : ''}`}</pre>
          </TechDetails>
        </ErrorBody>
        <Button
          label="Tentar novamente"
          icon="pi pi-refresh"
          size="small"
          outlined
          onClick={this.handleRetry}
          style={{
            flexShrink: 0,
            alignSelf: 'center',
            borderColor: dm ? '#ef4444' : '#fca5a5',
            color: dm ? '#f87171' : '#dc2626',
          }}
        />
      </ErrorCard>
    );
  }
}
