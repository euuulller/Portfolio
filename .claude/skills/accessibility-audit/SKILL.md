---
name: accessibility-audit
description: Audita acessibilidade do portfólio segundo WCAG — teclado, foco, contraste, ARIA, movimento reduzido. Use ao adicionar qualquer elemento interativo, ícone sem texto visível ou animação.
---

# Accessibility Audit

Estado verificado: estrutura, ARIA e contraste **corretos**. Esta skill
documenta *por que* estão corretos, para que não sejam desfeitos por
engano.

## Estrutura — já correta

- `<html lang="pt-BR">`, `<title>` descritivo.
- Landmarks reais: `header` / `nav` / `main` / `section` / `article` /
  `footer`.
- Um `<h1>`, quatro `<h2>`, três `<h3>`. Sem pular nível.
- Todo `<section>` e todo `.project-card` têm `aria-labelledby` resolvendo
  para um heading existente.
- `.skip-link` é o primeiro elemento tabulável, aponta para `#main-content`.

## Teclado

Tudo que é interativo funciona por teclado hoje. Ao adicionar algo novo,
confirme: Tab, Shift+Tab, Enter, Space, Escape, ordem de foco, foco visível.

Dois pontos sutis já resolvidos — não desfaça:

- **O checkbox do tema é `.visually-hidden`, não `display: none`**, para
  continuar na árvore de foco. O clique acontece pelo `<label>`, mas a
  navegação por Tab depende do input existir.
- **O anel de foco é propagado por seletor de irmão**:
  `.navbar__theme-input:focus-visible + .navbar__theme-toggle`. O elemento
  que recebe foco (input) é diferente do que aparece (label) — sem essa
  regra, o foco ficaria invisível.

`accessibility.css` dá `a:focus-visible { outline: 2px solid var(--color-focus-ring) }`
para todo link. Ao introduzir `<button>` (hoje não há nenhum), estenda o
seletor — a regra atual cobre só `a`.

## Ícones sem texto visível

A navbar é inteiramente de ícones. O padrão em vigor, que resolve três
problemas de uma vez:

```html
<a class="navbar__link" href="#sobre" aria-label="Sobre">
  <svg … aria-hidden="true" focusable="false">…</svg>
</a>
```

1. `aria-label` dá o nome acessível ao link;
2. `aria-hidden` + `focusable="false"` tiram o SVG decorativo da árvore de
   acessibilidade e da ordem de tabulação (IE/Edge antigos tabulavam em SVG);
3. o **mesmo** `aria-label` vira o tooltip visual via
   `content: attr(aria-label)` em `navbar.css` — o texto existe uma vez só.

Consequência a lembrar: **mudar o `aria-label` muda o tooltip visível.** Não
são independentes.

## Imagens

- `.about__avatar` tem `alt="Euller Duarte"` (informativa) e `width`/`height`
  explícitos.
- Todo SVG decorativo leva `aria-hidden="true"` + `focusable="false"`.
  Inclui o glifo da Hero, os ícones dos cards, o coração e o café do rodapé —
  em todos, o texto ao redor já comunica o conteúdo.

## Cards duplicados de Habilidades

Os 8 cards aparecem 2× no HTML para o loop do marquee. As cópias levam
`aria-hidden="true"` **no próprio card** (não só no SVG), para cada
tecnologia ser anunciada uma única vez por leitor de tela. Ao mexer no
marquee, preserve isso — e note que `accessibility.css` também depende
desse atributo para esconder as cópias sob movimento reduzido.

## Contraste — conferido

| Combinação | Razão | Exigido |
|---|---:|---|
| `--color-text-muted` #4b5563 sobre #ffffff | 7,5:1 | 4,5:1 ✓ |
| `--color-text-muted` #9ca3af sobre #111111 (escuro) | 7,5:1 | 4,5:1 ✓ |
| Ícone navbar #9ca3af sobre a pill (claro) | 4,9:1 | 3:1 ✓ |
| Ícone navbar #4b5563 sobre a pill (escuro) | 5,1:1 | 3:1 ✓ |

Ao alterar **qualquer** token de cor em `base/tokens.css`, refaça esta
tabela nos dois temas. A navbar tem escala de cor própria e inverte em
relação à página — verifique os dois conjuntos, não só `--color-*`.

Alvos de toque: 2,35rem (37,6px), 2,15rem (34,4px) no mobile. Acima do
mínimo de 24px do WCAG 2.2 AA. Não reduza.

## Movimento reduzido

Três sistemas de animação, **três mecanismos distintos** — media query CSS
cobre só o primeiro:

| Sistema | Onde | Como é neutralizado |
|---|---|---|
| Transições CSS | página inteira | regra universal em `accessibility.css` (o único `!important`) |
| `@keyframes` CSS | marquee, ilustrações, heartbeat | lista **explícita** de seletores |
| SMIL `<animate>` | card Dashboard (20 tags) | `pauseAnimations()` em `reduced-motion.js` |
| WebGL | malha da Hero | desenha 1 quadro e para o laço |

Por que a lista de `@keyframes` é explícita e não universal: um
`animation: none` cego congelaria elementos no primeiro quadro, que em
várias ilustrações é um estado **intencionalmente invisível ou fora de
posição** (o nó de fraude nasce em `translateX(-20px)` com `opacity: 0`).
Cada seletor da lista foi verificado para parar numa composição estática
legível.

**Ao criar uma animação nova com `@keyframes`, adicione o seletor a essa
lista e confirme que o estado congelado é legível.** É o único ponto do
projeto que não se mantém sozinho.

O marquee recebe tratamento especial: só remover `animation` deixaria os
cards duplicados ocupando espaço em `width: max-content`, virando uma barra
horizontal gigante — pior que a animação. Por isso as cópias somem e a
trilha quebra linha (`flex-wrap: wrap; width: auto`).
