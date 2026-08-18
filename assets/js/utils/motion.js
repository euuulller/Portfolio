/**
 * utils/motion.js
 * Leitura da preferência de movimento do sistema operacional.
 *
 * Existe como utilitário — e não repetido em cada módulo — porque dois
 * módulos independentes precisam da mesma resposta (reduced-motion.js, para
 * pausar SMIL; mesh-background.js, para congelar o shader) e a string da
 * media query é exatamente o tipo de valor que, duplicado, sai de sincronia
 * numa futura mudança.
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/* Instância ÚNICA, criada uma vez na carga do módulo. A MediaQueryList é um
   objeto vivo: `.matches` continua refletindo a preferência atual do sistema
   sem precisar ser recriada, e o listener de 'change' continua disparando.

   Por que uma só: window.matchMedia() ALOCA um objeto novo a cada chamada, e
   prefersReducedMotion() é consultada dentro do laço de render da malha
   (mesh-background.js), ou seja ~60 vezes por segundo. A versão anterior
   criava 60 MediaQueryList por segundo — lixo puro para o coletor, num laço
   que deveria alocar zero. */
const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

/** @returns {MediaQueryList} lista viva — permite ouvir mudanças em tempo real. */
export const reducedMotionQuery = () => reducedMotion;

/** @returns {boolean} true se o usuário pediu menos movimento no SO. */
export const prefersReducedMotion = () => reducedMotion.matches;
