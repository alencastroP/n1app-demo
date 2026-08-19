// src/context/AccountControlSlotContext.jsx
// Onde o controle de sessão (ContaAtivaWidget) deve ser renderizado.
//
// O widget é ÚNICO — uma instância, um estado de sessão — e vive no Layout.
// O problema é de posição, não de quantidade: como faixa própria acima do
// conteúdo ele empurrava o cabeçalho para baixo; como elemento fixo, passava
// por cima dele.
//
// Aqui a página diz onde ela quer o controle: o cabeçalho (ServiceHeader, ou o
// header da Store) monta um slot e o Layout PORTA o widget para dentro dele —
// o controle passa a dividir a linha do título, sem faixa extra e sem
// sobreposição. Página sem slot cai no canto superior direito do conteúdo,
// que é o comportamento anterior.

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const AccountControlSlotContext = createContext(null);

// Fallback para árvores sem o provider (Storybook, testes de componente).
const NO_SLOT = { slotEl: null, registerSlot: () => {} };

export function AccountControlSlotProvider({ children }) {
  const [slotEl, setSlotEl] = useState(null);

  // Callback ref: o React chama com `null` no unmount do cabeçalho, o que já
  // devolve o widget ao fallback sem precisar de limpeza manual.
  const registerSlot = useCallback((el) => setSlotEl(el), []);

  const value = useMemo(() => ({ slotEl, registerSlot }), [slotEl, registerSlot]);

  return (
    <AccountControlSlotContext.Provider value={value}>
      {children}
    </AccountControlSlotContext.Provider>
  );
}

export function useAccountControlSlot() {
  return useContext(AccountControlSlotContext) ?? NO_SLOT;
}
