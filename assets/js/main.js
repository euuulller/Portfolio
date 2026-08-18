/**
 * main.js
 * Ponto de entrada único do JavaScript do site. Não contém lógica: apenas
 * declara quais módulos existem e em que ordem sobem. Toda regra de negócio
 * vive no módulo correspondente — ler este arquivo deve bastar para saber
 * tudo o que o site executa.
 *
 * Carregado com <script type="module">, o que traz de graça:
 *  - execução adiada (equivale a defer): não bloqueia o parser e roda com o
 *    DOM já montado, sem precisar de listener de DOMContentLoaded;
 *  - escopo próprio: nenhuma variável vaza para window, ao contrário do
 *    JavaScript inline anterior, que declarava globais (navLinks, observer,
 *    sections…) passíveis de colisão;
 *  - modo estrito por padrão.
 *
 * Regra do projeto: JavaScript é o último recurso, nesta ordem — HTML
 * nativo → CSS → Web API → JS. Tema, tooltips e o carrossel de habilidades
 * são resolvidos sem uma linha daqui; o que sobrou são três casos em que
 * nenhuma camada anterior alcança o problema.
 */

import { initScrollSpy } from './modules/scroll-spy.js';
import { initReducedMotion } from './modules/reduced-motion.js';
import { initMeshBackground } from './modules/mesh-background.js';

initScrollSpy();
initReducedMotion();
initMeshBackground();
