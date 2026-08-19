// components/changelog/ClickableField.jsx
import styled from 'styled-components';

const FieldContainer = styled.div`
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid ${({ darkMode }) => (darkMode ? '#2A2A3D' : '#e0dde2')};
  background: ${({ darkMode }) => (darkMode ? '#302549' : '#f8f8f8')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ darkMode }) => (darkMode ? '#7f658b88' : '#9d36cc')};
  }
`;

const FieldText = styled.span`
  color: ${({ isPlaceholder, darkMode }) =>
    isPlaceholder ? (darkMode ? '#bbb' : '#999') : (darkMode ? '#fff' : '#000')};
`;

export default function ClickableField({ darkMode, onClick, text }) {
  const isPlaceholder = !text || text.toLowerCase().includes('selecionar');

  return (
    <FieldContainer
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      darkMode={darkMode}
    >
      <FieldText isPlaceholder={isPlaceholder} darkMode={darkMode}>
        {text}
      </FieldText>
    </FieldContainer>
  );
}