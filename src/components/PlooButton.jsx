import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import styled from 'styled-components';

const FloatingAIButton = styled(Button)`
  position: fixed;
  display: flex !important;
  align-items: center;
  justify-content: center;
  bottom: 2rem;
  right: 2rem;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #7443f6 0%, #46049c 100%);
  color: white;
  font-size: 1.45rem;
  box-shadow: 0 4px 18px rgba(116, 67, 246, 0.55);
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover {
    transform: scale(1.12);
    box-shadow: 0 6px 24px rgba(116, 67, 246, 0.72);
    background: linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%);
  }

  &:active {
    transform: scale(0.97);
  }
`;

export default function Ploo() {
  const navigate = useNavigate();

  return (
    <FloatingAIButton
      aria-label="Falar com Copilot"
      title="Falar com Copilot"
      onClick={() => navigate('/copilot')}
    >
      <i className="pi pi-sparkles" />
    </FloatingAIButton>
  );
}
