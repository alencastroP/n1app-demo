// demo/src/mock/boot.js
//
// Módulo de efeito colateral: instala o interceptor de rede no momento em que
// é importado. Imports ES são hoisted e avaliados NA ORDEM em que aparecem —
// por isso este é o primeiro import do main.jsx, garantindo que `window.fetch`
// já esteja substituído antes de qualquer módulo do app ser avaliado.

import { installMockNetwork } from './install';

installMockNetwork();
