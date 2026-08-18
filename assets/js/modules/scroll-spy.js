/**
 * modules/scroll-spy.js
 * Destaca na navbar (classe .navbar__link--active + aria-current="page") o
 * link da seção visível na viewport enquanto o usuário rola a página — não
 * apenas quando ele clica em um link.
 *
 * Por que este JS existe: a navegação por clique já funciona nativamente
 * via <a href="#secao">, mas nada em HTML/CSS observa QUAL seção está
 * visível durante a rolagem manual (:target reage a clique/URL, não a
 * scroll, e não cobre o estado inicial sem hash). IntersectionObserver é a
 * Web API nativa desenhada exatamente para isso — um observer, vários
 * alvos, callback só quando o estado muda; nada de listener de scroll com
 * throttle e cálculo de posição na mão.
 *
 * Degradação graciosa: o link "Início" já vem com .navbar__link--active e
 * aria-current="page" no HTML. Se este módulo não carregar (ou o navegador
 * não suportar IntersectionObserver), esse estado inicial permanece e a
 * navegação por âncora continua 100% funcional.
 */

/* Desloca a "viewport" considerada pelo observer para compensar a navbar
   fixa (body tem padding-top: 6rem) e concentrar o gatilho numa faixa fina
   perto do centro vertical da tela: -45% no topo e -50% embaixo deixam ~5%
   de altura como zona de interseção válida. Sem isso, uma seção ativaria
   cedo ou tarde demais por causa da pill sobreposta. */
const OBSERVER_OPTIONS = {
  root: null,
  rootMargin: '-45% 0px -50% 0px',
  threshold: 0,
};

export function initScrollSpy() {
  const links = document.querySelectorAll('.navbar__link');
  if (!links.length || !('IntersectionObserver' in window)) return;

  /* Mapa href ("#sobre") -> <a>, montado a partir do próprio DOM: se a
     navbar ganhar ou perder um link, este módulo não precisa ser tocado. */
  const linkByHash = new Map();
  links.forEach((link) => {
    const hash = link.getAttribute('href');
    if (hash?.startsWith('#')) linkByHash.set(hash, link);
  });

  const sections = [...linkByHash.keys()]
    .map((hash) => document.querySelector(hash))
    .filter(Boolean);

  if (!sections.length) return;

  /* Limpa todos antes de marcar um: garante exatamente um
     aria-current="page" por vez, como exige a especificação de ARIA. */
  const setActiveLink = (hash) => {
    const active = linkByHash.get(hash);
    if (!active) return;

    links.forEach((link) => {
      link.classList.remove('navbar__link--active');
      link.removeAttribute('aria-current');
    });

    active.classList.add('navbar__link--active');
    active.setAttribute('aria-current', 'page');
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActiveLink(`#${entry.target.id}`);
    });
  }, OBSERVER_OPTIONS);

  sections.forEach((section) => observer.observe(section));
}
