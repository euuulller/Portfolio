# QA Checklist

Resultados **medidos**, não presumidos. Verificação feita em Chrome 151
headless, dirigido por DevTools Protocol, sobre servidor HTTP local.

Data: 2026-08-18 · Comparação contra o snapshot pré-refatoração.

---

## Como reproduzir

```bash
python -m http.server 8000     # ES modules exigem HTTP — file:// falha por CORS
```

---

## Console e rede

| Verificação | Resultado |
| --- | --- |
| Erros de JavaScript | **0** |
| Rejeições de promise não tratadas | **0** |
| CSS 404 | **0** (18/18 em 200) |
| JS 404 | **0** |
| Ícones / manifest 404 | **0** |
| Requisições a domínios externos | **0** ← antes: 1 (cdnjs) |
| Assets 404 | **0** ← resolvido em 18/08 |

**Console 100% limpo.**

---

## Foto e currículo — RESOLVIDO

Os dois arquivos foram adicionados. Estavam no disco com nomes que o
`index.html` não procurava (`Profile.jpeg` e `curriculo.pdf`), o que mantinha
os 404; renomeados para os nomes esperados, sem alterar uma linha de HTML.

| Arquivo | Estado |
| --- | --- |
| `assets/images/profile.jpg` | 200 · 640 × 853 · 48 KB |
| `assets/documents/curriculo-euller-duarte.pdf` | 200 · 84 KB |

A foto foi redimensionada de 1200 × 1600 / 114 KB para 640 × 853 / 48 KB
(**−58%**), sem perda visível. O original está preservado em
`assets/images/profile-original.jpeg` (não referenciado pelo site).

Nomes em minúsculas de propósito: o GitHub Pages roda em Linux, que é
*case-sensitive* — um `P` maiúsculo funcionaria no Windows e daria 404 em
produção.

Verificado: foto carrega no círculo sem distorção (`object-fit: cover`),
badge do GitHub no lugar, currículo baixando pelo botão da navbar, **CLS
continua 0**.

---

## Peso

| Recurso | Antes | Depois |
| --- | ---: | ---: |
| Three.js r128 (cdnjs) | 149.872 B | **0** |
| `index.html` | 33.979 B | 33.820 B |
| CSS (18 arquivos) | 20.323 B | 21.728 B |
| JS próprio | ~5.000 B | 10.007 B |
| **Total (gzip)** | **~209 KB** | **~65 KB** |

**Redução de 69%.** Orçamento (≤ 70 KB) — atendido.

A foto (48 KB) é `loading="lazy"` e fica abaixo da dobra: não entra no
carregamento inicial nem no LCP.

---

## Lighthouse

| Categoria | Nota |
| --- | --- |
| Performance | 63–69 (instável — ver abaixo) |
| Accessibility | **100** |
| Best Practices | **100** |
| SEO | **100** |

| Métrica | Valor |
| --- | --- |
| Cumulative Layout Shift | **0** |
| Largest Contentful Paint | 2,4–2,8 s |
| Total Blocking Time | 1.030–4.100 ms (**não confiável aqui**) |

⚠️ **A nota de Performance deste ambiente não serve para julgar regressão.**
O mesmo build, sem nenhuma alteração entre execuções, produziu TBT de
**1.030, 1.230, 1.530 e 4.100 ms**. A causa é o ambiente: WebGL emulado por
software (SwiftShader) somado ao *CPU throttling* 4× que o Lighthouse aplica
por padrão no perfil mobile.

Para decidir se algo regrediu, use o A/B controlado de ms por quadro descrito
mais abaixo — variância abaixo de 0,5 ms, e por ele o build atual é **mais
rápido** que o anterior.

As três categorias que não dependem de tempo (Accessibility, Best Practices,
SEO) continuam estáveis em 100 e permanecem confiáveis.

Além do ruído, a medição roda sobre `python -m http.server`, que não comprime
nem envia cabeçalhos de cache. Três das falhas de performance são artefatos
disso:

- `uses-text-compression` — o GitHub Pages serve gzip/brotli;
- `uses-long-cache-ttl` — o Pages envia `Cache-Control`;
- parte do TBT vem de rasterizar a malha em CPU, não em GPU.

Falha legítima e conhecida: `render-blocking-resources`, os 18 CSS (390 ms
estimados). É uma escolha consciente — ver "Avaliadas e recusadas" em
`ARCHITECTURE.md`.

---

## Tema — as quatro combinações

Testadas com `prefers-color-scheme` emulado, lendo estilo computado real.

| SO | Toggle | `color-scheme` | Fundo | Ícone | ✓ |
| --- | --- | --- | --- | --- | :-: |
| claro | desmarcado | `light` | `#ffffff` | sol | ✓ |
| claro | marcado | `dark` | `#111111` | lua | ✓ |
| escuro | desmarcado | `dark` | `#111111` | lua | ✓ |
| escuro | marcado | `light` | `#ffffff` | sol | ✓ |

**Regressão corrigida:** antes, "SO escuro + desmarcado" entregava página
**branca** com ícone de sol — o modo escuro do sistema era ignorado por
completo. Confirmado por captura de tela do snapshot.

Limitação assumida: `theme-color` diverge após inversão manual (ver
`ARCHITECTURE.md`).

---

## Responsividade

`scrollWidth − clientWidth` medido em cada largura:

| Largura | Overflow X | Canvas |
| ---: | :-: | :-: |
| 320 px | **0** | ✓ |
| 375 px | **0** | ✓ |
| 390 px | **0** | ✓ |
| 414 px | **0** | ✓ |
| 768 px | **0** | ✓ |
| 1024 px | **0** | ✓ |
| 1280 px | **0** | ✓ |
| 1440 px | **0** | ✓ |
| 1920 px | **0** | ✓ |

**Bug corrigido (pré-existente):** havia 8 px de scroll horizontal em
desktop. Causa: `.mesh-bg-container` usava `width: 100vw`, que **inclui a
barra de rolagem clássica** — a malha ficava mais larga que a área visível.
Trocado por `width: 100%` + `left: 0`, que mede a área de conteúdo real.
Estava presente também no snapshot original, ou seja, não foi introduzido
pela refatoração.

Nota: `.navbar__bar` reporta ~7 px de `scrollWidth` extra em desktop. É o
`<input>` `.visually-hidden` (1 px, `margin: -1px`), não um transbordo real —
todos os filhos visíveis cabem exatamente na pill (544–881 de 544–881).

---

## Regressão visual

Comparação de capturas antes/depois, nos dois temas:

| Superfície | Resultado |
| --- | --- |
| Malha do Hero (ângulo, densidade, diagonais, dissolução) | idêntica |
| Cor da malha por tema (preta no claro, branca no escuro) | idêntica |
| Navbar (vidro, blur, divisor, link ativo, ícones) | idêntica |
| Headline em 2 linhas + glifo | idêntico |
| Marquee de Habilidades (2 trilhas, sentidos opostos, máscara) | idêntico |
| Cards de Projetos (badges, rodapés, estrutura) | idênticos |
| Projetos no mobile | **carrossel** — mudança pedida, ver abaixo |
| Contato + rodapé | **malha 3D nova** — ver abaixo |
| Ilustrações dos cards (linhas de fundo) | **alteradas de propósito** — ver abaixo |
| Grade de Contato | idêntica |
| Rodapé | idêntico |

A paridade da malha é sustentada por manter os shaders GLSL literalmente
inalterados; só a camada de geometria e matrizes foi reescrita.

### Ilustrações dos cards — mudança intencional

As linhas de fundo estavam praticamente invisíveis no tema claro. Causa: a
arte usava `var(--color-border)`, que **inverte com o tema**, sobre um
header de card que é **fixo claro**. O mesmo elemento decorativo rendia
~1,09:1 no claro e ~3,05:1 no escuro.

Corrigido com um token fixo `--project-line: #94a3b8` e opacidades maiores:

| Elemento | Antes | Depois |
| --- | ---: | ---: |
| `.project-card__grid-line` (keyframes `project-grid-shimmer`) | 0.35 ↔ 0.7 | **0.6 ↔ 0.95** |
| `.project-card__grid-line` (estático, movimento reduzido) | 0.5 | **0.75** |
| `.project-card__topo-line` | 0.6 | **0.75** |
| `.project-card__orbit-path` | 0.35 | **0.55** |
| `.project-card__orbit-spoke` | 0.3 | **0.5** |
| `--project-gray-300` (anéis e nós do card Fraude) | `#d1d5db` | **`#aab4c2`** |

Verificado por estilo computado: a cor da linha agora é `rgb(148,163,184)` e
a opacidade ~0,79 **nos dois temas** — antes divergiam. Capturas dos três
cards em claro e escuro ficaram idênticas entre si.

As três ilustrações são `aria-hidden="true"`: são decorativas, então o
critério 1.4.11 do WCAG (3:1 para não-texto) não se aplica. A mudança é
estética e de consistência.

---

## Carrossel de Projetos no mobile

Abaixo de 60em os 3 cards viram carrossel horizontal com `scroll-snap` e a
barra de rolagem escondida, substituída por "← Deslize para ver mais →".
A partir de 60em volta a ser a grade de 3 colunas de sempre.

| Largura | Overflow da página | Carrossel | Largura do card | Margem | Hint | Navbar centrada |
| ---: | :-: | :-: | ---: | ---: | :-: | :-: |
| 320 px | **0** | sim | 282 px | 19 px | visível | ✓ |
| 375 px | **0** | sim | 330 px | 23 px | visível | ✓ |
| 390 px | **0** | sim | 343 px | 23 px | visível | ✓ |
| 414 px | **0** | sim | 364 px | 25 px | visível | ✓ |
| 478 px | **0** | sim | **380 px** | 49 px | visível | ✓ |
| 768 px | **0** | sim | 380 px | 194 px | visível | ✓ |
| ≥ 960 px | **0** | não (grade) | — | — | escondido | ✓ |

Em 478px o card fica em 380 px com 49 px de margem — exatamente as medidas
do layout de referência. O teto de `88vw` só entra abaixo de ~432px, para o
card não sangrar nas bordas em telas de 320px.

A navbar centralizada em todas as larguras é a verificação que importa: era
o sintoma do bug que `contain: layout paint` previne (o Chrome mobile
inflava o viewport de layout de ~412px para ~1070px).

Snap conferido: com `scrollLeft` no meio do caminho, o carrossel para
centralizado no card 2, com os vizinhos espiando dos dois lados.

---

## Malha 3D em Contato + rodapé

Segunda instância da mesma malha da Hero, fechando a página.

| Verificação | Resultado |
| --- | --- |
| Contêineres com canvas | **2 de 2** |
| Altura da malha inferior | 996 px (100svh + 6rem) |
| Opacidade (mais discreta que a Hero) | 0,55 |
| Clique no cartão de contato atinge | `a.contact-card` (**não** a malha) |
| Clique no rodapé atinge | o `<p>` do rodapé |
| Cor por tema | preta no claro, branca no escuro |
| Construída no carregamento? | **não** — só ao aproximar da tela |
| Overflow horizontal | **0** |

As duas malhas nunca rodam juntas: ~40 rAF/s no topo, ~35 no fim — não a
soma. Sob movimento reduzido, 1 rAF em 1,2 s com os 2 canvas presentes, ou
seja, ambas desenham um quadro estático e param.

---

## Custo por quadro — A/B controlado

O TBT do Lighthouse variou **1.030 · 1.230 · 1.530 · 4.100 ms** para o mesmo
build (WebGL por software + CPU 4×), então não serve para julgar regressão
aqui. A comparação confiável foi medir ms por quadro com CPU 4× mais lenta,
servindo o build antigo numa segunda porta e alternando A/B/A/B:

| Build | Execuções | Média |
| --- | --- | ---: |
| Antes (pilha vertical, 1 malha) | 19,2 · 19,3 · 19,0 | **19,2 ms** |
| Depois (carrossel, 2 malhas) | 17,1 · 17,0 · 16,7 | **16,9 ms** |

O build novo é **mais rápido** que o anterior, apesar de ter mais coisa. Duas
mudanças pagam a conta: `content-visibility: auto` no header do card (o
carrossel sozinho custava 29 ms/quadro) e a construção adiada da malha do
rodapé.

---

## Acessibilidade

| Verificação | Resultado |
| --- | --- |
| Lighthouse Accessibility | **100** |
| `.skip-link` primeiro no Tab | ✓ |
| Foco visível em links e no toggle de tema | ✓ |
| Toggle acionável por teclado (input focável, não `display:none`) | ✓ |
| Tooltips visíveis em `:focus-visible` | ✓ |
| Contraste AA nos dois temas | ✓ |
| Alvos de toque ≥ 24 px (34–38 px reais) | ✓ |
| IDs únicos, headings sem pular nível | ✓ |
| Todos os `aria-labelledby` resolvem | ✓ |

**Corrigido:** WCAG 2.5.3 (*Label in Name*). A marca exibia "ED" mas tinha
nome acessível "Início" — comando de voz "clicar ED" não encontrava o alvo.
Agora `aria-label="ED — Início"`. Reauditado: **PASS**.

---

## Movimento reduzido

Com `prefers-reduced-motion: reduce` emulado:

| Sistema | Esperado | Medido |
| --- | --- | --- |
| Transições CSS | ~0 | `1e-05s` ✓ |
| Marquee | parado, em grade | `animation: none`, `flex-wrap: wrap` ✓ |
| Cards duplicados do marquee | fora do layout | `display: none` ✓ |
| `@keyframes` das ilustrações | parados | `animation: none` ✓ |
| Heartbeat do rodapé | parado | `animation: none` ✓ |
| SMIL (20 `<animate>`) | pausado | `animationsPaused() === true` ✓ |
| Malha WebGL | 1 quadro estático | canvas presente, laço encerrado ✓ |
| Overflow horizontal nesse modo | 0 | **0** ✓ |

Os quatro sistemas de animação respondem. Confirma que içar a
`MediaQueryList` em `utils/motion.js` não quebrou `reduced-motion.js`.

---

## GitHub Pages

| Verificação | Resultado |
| --- | --- |
| Caminhos absolutos indevidos (`/…`) | **0** |
| `.nojekyll` presente | ✓ |
| Workflow sem build, publicando a raiz | ✓ |
| `site.webmanifest` com `start_url`/`scope` relativos | ✓ |
| `robots.txt` e `sitemap.xml` válidos | ✓ |
| URLs absolutas apenas nos 5 pontos legítimos | ✓ |

Lembrete: exige **Settings › Pages › Source = "GitHub Actions"**.

---

## Segurança

| Verificação | Resultado |
| --- | --- |
| `innerHTML` / `eval` / `new Function` / `document.write` | **0 ocorrências** |
| Scripts inline | **0** |
| Recursos de terceiros | **0** ← antes: 1 sem `integrity` |
| `target="_blank"` sem `rel="noopener noreferrer"` | **0** |
| Conteúdo HTTP em página HTTPS | **0** |

---

## Antes de publicar

- [x] ~~Adicionar `assets/images/profile.jpg`~~ — 640 × 853, 48 KB
- [x] ~~Adicionar `assets/documents/curriculo-euller-duarte.pdf`~~ — 84 KB
- [x] ~~Console 100% limpo e *Best Practices* em 100~~ — confirmado
- [ ] Confirmar `Settings › Pages › Source = GitHub Actions` **(ação fora do código)**
- [ ] Atualizar `<lastmod>` no `sitemap.xml` na data da publicação
- [ ] Opcional: `og-image.jpg` 1200 × 630 — hoje a prévia social usa a foto
      vertical e as redes recortam (ver `assets/images/README.md`)

Nenhum item bloqueia a publicação. O site está pronto para ir ao ar.
