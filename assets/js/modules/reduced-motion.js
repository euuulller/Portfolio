/**
 * modules/reduced-motion.js
 * Pausa as animações SMIL (<animate>) da ilustração do card "Dashboard de
 * Vendas" quando o usuário sinaliza, no sistema, que prefere menos
 * movimento.
 *
 * Por que este módulo existe: o bloco @media (prefers-reduced-motion:
 * reduce) em assets/css/utilities/accessibility.css já neutraliza todas as
 * animações e transições CSS do site — mas SMIL é um sistema de animação
 * separado, que NENHUMA media query CSS alcança. pauseAnimations() é um
 * método nativo de SVGSVGElement (não uma biblioteca) e é o único caminho
 * para as 19 animações <animate> inline daquele SVG.
 *
 * Diferente da versão anterior, a preferência passou a ser observada em
 * tempo real: quem liga "reduzir movimento" com a página já aberta vê o
 * efeito imediatamente, sem recarregar — e quem desliga recupera a
 * animação. O custo é um único listener em uma MediaQueryList.
 *
 * Degradação graciosa: se este módulo falhar, as animações CSS seguem
 * neutralizadas pelo CSS; apenas a parte SMIL (decorativa, restrita a um
 * card) continuaria rodando — nada de funcionalidade se perde.
 */

import { reducedMotionQuery } from '../utils/motion.js';

const ILLUSTRATION_SELECTOR = '.project-card__illustration';

export function initReducedMotion() {
  const svgs = document.querySelectorAll(ILLUSTRATION_SELECTOR);
  if (!svgs.length) return;

  const apply = (shouldPause) => {
    svgs.forEach((svg) => {
      const action = shouldPause ? svg.pauseAnimations : svg.unpauseAnimations;
      if (typeof action === 'function') action.call(svg);
    });
  };

  const query = reducedMotionQuery();
  apply(query.matches);

  /* addEventListener em MediaQueryList não existe no Safari < 14, que só
     tem o addListener depreciado — daí o fallback (uma linha, sem polyfill). */
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', (event) => apply(event.matches));
  } else if (typeof query.addListener === 'function') {
    query.addListener((event) => apply(event.matches));
  }
}
