// demo/src/main.jsx
//
// Igual ao main.jsx do app real, com UMA diferença: o primeiro import é
// `./mock/boot`, que substitui `window.fetch` antes de qualquer módulo do app
// ser avaliado. A partir daí todo o código original roda sem alteração —
// só que offline, com retornos fixos.

import './mock/boot';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import DemoBadge from './mock/DemoBadge.jsx'
import './index.css'
import 'primereact/resources/themes/bootstrap4-light-purple/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'
import './config/primeLocale' // registra o locale pt-BR do PrimeReact (Calendar)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <DemoBadge />
  </StrictMode>,
)
