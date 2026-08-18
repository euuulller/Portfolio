---
name: performance-audit
description: Audita peso, caminho crítico de renderização e custo por frame do portfólio. Use antes de adicionar qualquer recurso, animação ou script, e ao investigar lentidão, consumo de bateria ou Core Web Vitals.
---

# Performance Audit

## Orçamento — medido, não estimado

Medições reais (`gzip -9`, o que o GitHub Pages efetivamente transfere):

| Recurso | Antes | Depois |
|---|---:|---:|
| Three.js r128 (cdnjs) | 149.872 B | **removido** |
| `index.html` | 33.979 B | 33.979 B |
| CSS (18 arquivos) | 20.323 B | 20.323 B |
| JS próprio | ~5.000 B | ~8.000 B |
| **Total** | **~209 KB** | **~62 KB** |

Teto a defender: **≤ 70 KB transferidos**, **zero dependências externas**,
**zero requisições a terceiros**.

Como remedir:

```bash
echo "html gzip: $(gzip -9 -c index.html | wc -c)"
echo "css  gzip: $(cat assets/css/*/*.css | gzip -9 -c | wc -c)"
echo "js   raw : $(cat assets/js/main.js assets/js/*/*.js | wc -c)"
```

## A lição mais importante desta auditoria: meça comprimido

`index.html` tem **144 KB crus mas 34 KB comprimidos**. Dentro dele há 43 KB
de `<path d="…">` literalmente duplicado (os cards de Habilidades aparecem
duas vezes para o loop do marquee).

Converter tudo para `<symbol>` + `<use>` **parece** economizar 43 KB. Não
economiza: o gzip já colapsa quase toda duplicação de texto. O ganho real na
rede seria pequeno, contra um diff que toca 72 SVGs inline.

**Regra: antes de propor otimização de peso, meça o tamanho comprimido.**
Otimizar bytes crus que o gzip já resolve é diff de graça, risco de graça.

## Caminho crítico de renderização

Estado atual:

- 18 `<link rel="stylesheet">` bloqueantes, 20 KB gzipped no total, sobre
  HTTP/2. **Concatenar foi avaliado e reprovado**: exigiria build (proibido)
  ou manutenção manual, e destruiria a legibilidade da ordem de carga — que
  é a arquitetura do CSS. Ver `documents/ARCHITECTURE.md`.
- Zero fonte externa: pilha de fontes do sistema
  (`--font-family-base`). Zero requisição, zero layout shift por troca de
  fonte. **Não introduza Google Fonts.**
- Todo JS é `type="module"` → adiado por padrão, não bloqueia o parser.
- `<img>` da seção Sobre traz `width`/`height` explícitos (718×1166), que
  reservam o espaço e evitam layout shift. Ao trocar a foto por outra
  proporção, atualize os dois atributos **no mesmo commit**.

## Custo por frame

O que roda continuamente na página:

1. **Malha WebGL** (`assets/js/modules/mesh-background.js`) — o único laço
   de `requestAnimationFrame`.
2. **~40 animações CSS infinitas** — marquee de Habilidades, as 3
   ilustrações de Projetos, o heartbeat do rodapé.
3. **20 tags SMIL `<animate>`** na ilustração do card Dashboard.

A malha WebGL é a única que se autorregula, e o padrão dela é o que se
espera de qualquer animação nova aqui:

- desenha **só** enquanto a Hero está visível (`IntersectionObserver`);
- `resize` agrupado em um `requestAnimationFrame` (sem isso, `setSize()`
  realoca o buffer dezenas de vezes por segundo ao arrastar a janela);
- `devicePixelRatio` limitado a **2** (em telas 3x o custo por pixel
  triplicaria sem ganho perceptível numa malha de linhas finas);
- sob movimento reduzido desenha **um** quadro e não agenda outro;
- para no `visibilitychange` e no `webglcontextlost`;
- guarda contra rAF paralelo (`if (frameId !== null) return`) — sem ela, uma
  troca rápida de visibilidade dobraria a velocidade e o consumo de GPU.

**As animações CSS e SMIL não pausam fora da viewport.** Pausá-las daria
ganho real, mas exigiria JS novo sobre uma camada hoje 100% declarativa.
Registrado como possibilidade futura, não executado.

### Armadilha verificada: `matchMedia` em laço quente

`prefersReducedMotion()` chamava `window.matchMedia()`, que **aloca um novo
`MediaQueryList` a cada chamada** — e era invocada dentro de `renderFrame`,
~60×/segundo. Corrigido içando a `MediaQueryList` para o escopo do módulo:
é um objeto vivo, `.matches` continua atualizando sozinho.

Generalize: **nada que aloque entra num laço de rAF.** Nem `matchMedia`, nem
`querySelector`, nem `getBoundingClientRect` desnecessário, nem literal de
objeto/array por frame.

## Lighthouse aqui é ruidoso — meça com rAF antes de acreditar

Neste ambiente (WebGL por software/SwiftShader + CPU 4× mais lenta), o TBT do
Lighthouse variou **1.030 · 1.230 · 1.530 · 4.100 ms** para o **mesmo build**.
Concluir regressão a partir de uma execução só teria levado a desfazer uma
mudança que, na verdade, melhorou o site.

O sinal confiável é medir o custo por quadro direto, com CPU throttling e
execuções intercaladas entre os dois builds:

```js
let last = performance.now(), total = 0, n = 0;
const tick = () => { const now = performance.now(); total += now - last; last = now;
  if (n++ < 150) requestAnimationFrame(tick); };
requestAnimationFrame(tick);   // total/n = ms por quadro
```

Serve o build antigo numa segunda porta e alterne A/B/A/B. Assim a variância
ficou abaixo de 0,5 ms e a comparação virou conclusiva
(19,2 ms antes → 16,9 ms depois).

## Animação fora da tela: o eixo Y não é o único que conta

Um layout em coluna esconde os elementos de baixo *bem* longe da dobra, e o
navegador já economiza sozinho. Ao trocar por um carrossel horizontal, os 3
cards passaram a ocupar a **mesma faixa vertical** — todos "na tela" no eixo
Y, só deslocados no X — e as três ilustrações animadas passaram a rodar
juntas: 18,8 → 29 ms por quadro.

`content-visibility: auto` (+ `contain-intrinsic-size` para reservar a altura
e manter o CLS em 0) resolve, porque faz o navegador pular a renderização —
e as animações — do que está fora da tela em **qualquer** eixo.

## Antes de adicionar qualquer código, nesta ordem

```
Posso não executar isso?
Posso executar menos vezes?
Posso executar mais tarde?
Posso fazer no CSS?
Posso fazer com uma API nativa?
```

Só então JavaScript.

## Animações

- Anime **apenas** `transform` e `opacity`. Nunca `width`, `height`, `top`,
  `left`, `margin` — forçam layout a cada frame. (Verificado: hoje o projeto
  respeita isso integralmente.)
- Prefira CSS a JS quando o CSS alcança.
- `backdrop-filter: blur(12px)` na navbar é custo contínuo de GPU num
  elemento `fixed`. É aceito por ser central à identidade visual — mas não
  multiplique blurs pela página.

## Não trapaceie no Lighthouse

Leia os problemas e corrija a causa. Nunca remova conteúdo, `alt` ou
funcionalidade para subir nota.
