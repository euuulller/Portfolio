# Arquitetura

Documento de referência do portfólio: como o projeto é montado, e **por que**
cada decisão foi tomada. O `README.md` explica como usar; este explica como
pensar antes de mexer.

---

## Visão geral

Site estático de página única. Sem framework, sem bundler, sem etapa de
build, sem backend e **sem nenhuma dependência**. O conteúdo do repositório é
literalmente o que vai ao ar — o workflow de deploy só empacota a raiz.

Princípio que governa tudo:

```text
HTML semântico → CSS → Web API → JavaScript → (biblioteca) → (framework)
```

Quanto mais abaixo na lista, maior a justificativa exigida. Hoje o projeto
para no JavaScript: tema, tooltips e o carrossel de habilidades são
resolvidos sem uma linha de script.

---

## Estrutura

```text
index.html            documento único: estrutura, conteúdo e SVGs inline
assets/css/           base/ → utilities/ → components/  (18 arquivos)
assets/js/            main.js + modules/ + utils/  (ES Modules)
assets/icons/         favicon SVG + PNGs (iOS e PWA)
assets/images/        foto de perfil          ← fornecida pelo autor
assets/documents/     currículo em PDF        ← fornecido pelo autor
.github/workflows/    deploy no GitHub Pages
documents/            este documento, baseline e checklist de QA
.claude/skills/       governança para trabalho assistido por IA
```

---

## HTML

Documento único e semântico: `header` → `nav` → `main` → 5 `section` →
`footer`. Um `<h1>`, quatro `<h2>`, três `<h3>`, sem pular nível. Cada
`section` e cada `.project-card` têm `aria-labelledby` apontando para o
próprio heading.

**Por que continua sendo um arquivo só:** não há template engine nem build.
Dividir a marcação exigiria JavaScript montando a página em tempo de
execução — custaria conteúdo indexável, tempo de primeira pintura e uma
dependência nova, em troca de nenhuma vantagem de manutenção que os
comentários de seção já não deem.

Os 72 SVGs são inline por decisão: nenhum request extra, e cada ícone herda
`currentColor`, acompanhando o tema sem código.

---

## CSS

Três camadas, uma peça da interface por arquivo:

| Camada | Papel |
| --- | --- |
| `base/` | reset, tokens de design, estilos de `html`/`body` |
| `utilities/` | classes genéricas, fonte única de `@keyframes`, acessibilidade |
| `components/` | um arquivo por componente, nomeado como o bloco BEM |

### A ordem no `<head>` é a arquitetura

Os 18 `<link>` carregam numa sequência exata, e ela é significativa:
`accessibility.css` é o **último** de propósito, porque precisa vencer
qualquer componente já estilizado. É a ordem de carga — não `!important` —
que dá essa vitória. Trocar duas linhas de lugar muda o resultado
renderizado.

### Tokens

Todo valor repetido vira custom property em `base/tokens.css`. Nenhum valor
mágico deve aparecer solto num componente.

### Tema: o toggle inverte o sistema operacional

Claro/escuro é **100% CSS**, sem JavaScript. Um `<input type="checkbox">`
oculto é lido por `:has()`, e a paleta inteira troca via `light-dark()`.

| SO | checkbox | resultado |
| --- | --- | --- |
| claro / sem preferência | desmarcado | claro |
| claro / sem preferência | marcado | escuro |
| SO escuro | desmarcado | **escuro** |
| SO escuro | marcado | claro |

Antes, o `:root` era sempre claro e só o checkbox levava ao escuro — quem
usava o sistema no modo escuro recebia uma página branca na primeira visita.
Agora o checkbox significa "o contrário do que o sistema pediu".

Como cada par de cores já está declarado em `light-dark()`, o mecanismo de
troca não repete nenhuma cor: mexe só em `color-scheme`, em quatro regras
curtas. `color-scheme` ainda faz barras de rolagem e controles nativos
acompanharem o tema — algo que trocar variáveis sozinho não alcança.

**Degradação graciosa, em duas camadas independentes:** sem `:has()`, as
regras do toggle não aplicam e a página apenas segue o sistema; sem
`light-dark()`, valem as declarações literais claras que precedem cada token
e a página fica sempre clara. Por isso cada token é declarado duas vezes.

**Limitação assumida:** `<meta name="theme-color">` tem variantes por
`prefers-color-scheme` e descreve corretamente o estado inicial, mas volta a
divergir depois que o usuário inverte o tema manualmente. Sincronizar
exigiria JavaScript, e o toggle é deliberadamente declarativo.

---

## JavaScript

ES Modules, sem bundler. `main.js` é um índice **sem lógica**: ler aquele
arquivo deve bastar para saber tudo o que o site executa.

| Módulo | Por que existe |
| --- | --- |
| `scroll-spy.js` | nada em HTML/CSS observa qual seção está visível durante a rolagem (`:target` reage a clique/URL, não a scroll). Usa `IntersectionObserver`, sem listener de `scroll`. |
| `reduced-motion.js` | SMIL (`<animate>`) é um sistema de animação separado, que **nenhuma media query CSS alcança**. `pauseAnimations()` é a única via. |
| `mesh-background.js` | a ondulação vem de ruído simplex calculado por vértice em um vertex shader — não há equivalente em CSS. |
| `utils/motion.js` | dois módulos independentes precisam da mesma resposta sobre movimento reduzido. Esse é o critério para criar um util: **dois consumidores**, não um. |

Cada módulo faz *early return* quando seu alvo não existe no DOM, então
falha em silêncio em vez de sujar o console.

### A malha do Hero é WebGL puro

Rodava sobre Three.js r128 via CDN: **150 KB comprimidos, mais que o dobro
do site inteiro somado**, para desenhar um plano em wireframe. O módulo usava
oito primitivas da biblioteca, e os shaders GLSL já eram escritos à mão — o
que a Three.js entregava era matriz de projeção, uma grade de vértices e o
boilerplate de WebGL. Hoje isso são ~200 linhas próprias, com **os mesmos
shaders**, o que é o que garante paridade visual.

Três detalhes decidem essa paridade, e estão comentados no módulo:

- a câmera da Three.js com `position` definido mas sem `lookAt()` **não**
  olha para a origem — continua olhando para `-Z`;
- `wireframe: true` desenha as 3 arestas de cada triângulo com deduplicação,
  o que produz uma **diagonal por quadrado**;
- `premultipliedAlpha: true` + `blendFunc(ONE, ONE_MINUS_SRC_ALPHA)` é o par
  que define o brilho das linhas. Trocar um sem o outro muda a aparência.

---

## Performance

Peso transferido (`gzip -9`):

| | Antes | Depois |
| --- | ---: | ---: |
| Three.js (CDN) | 149.872 B | — |
| `index.html` | 33.979 B | 33.820 B |
| CSS | 20.323 B | 21.728 B |
| JS | ~5.000 B | 10.007 B |
| **Total** | **~209 KB** | **~65 KB** (−69%) |

Orçamento a defender: **≤ 70 KB**, **zero dependências**, **zero requisições
a terceiros**.

O que roda continuamente: a malha WebGL, ~40 animações CSS infinitas e 20
tags SMIL. Só a malha se autorregula — pausa fora da viewport
(`IntersectionObserver`), agrupa `resize` em um `requestAnimationFrame`,
limita `devicePixelRatio` a 2, desenha um único quadro sob movimento
reduzido, e para em `visibilitychange` e `webglcontextlost`.

**Regra aprendida nesta refatoração: meça comprimido.** O `index.html` tem
144 KB crus e 34 KB comprimidos; os 43 KB de `<path d>` duplicado que
*parecem* desperdício são quase todos colapsados pelo gzip.

Nada que aloque memória entra num laço de `requestAnimationFrame`.
`prefersReducedMotion()` criava um `MediaQueryList` por chamada e era
consultada ~60×/segundo — hoje a instância é única e viva.

---

## Acessibilidade

- Landmarks reais, hierarquia de headings correta, `.skip-link` como
  primeiro tabulável.
- Ícones sem texto visível: `aria-label` no link + `aria-hidden` +
  `focusable="false"` no SVG. O mesmo `aria-label` vira o tooltip via
  `content: attr(aria-label)` — o texto existe uma vez só, então **mudar o
  rótulo muda o tooltip**.
- O nome acessível da marca começa com o texto visível (`"ED — Início"`),
  como exige o critério 2.5.3 do WCAG: quem navega por voz diz o que lê.
- Contraste aprovado em AA nos dois temas; alvos de toque ≥ 34px.
- Movimento reduzido tratado nos **quatro** sistemas: transições CSS (regra
  universal, o único `!important` do projeto), `@keyframes` (lista explícita),
  SMIL (`pauseAnimations()`) e WebGL (um quadro estático).

A lista de `@keyframes` é explícita, e não um `animation: none` universal,
porque congelar às cegas deixaria elementos no primeiro quadro — que em
várias ilustrações é um estado intencionalmente invisível ou fora de posição.
**Ao criar uma animação nova, adicione o seletor àquela lista.**

---

## GitHub Pages

O site é servido de um subcaminho (`/Portfolio/`), então **todo caminho é
relativo**. Um `/` inicial resolveria para a raiz do domínio: quebraria em
produção e funcionaria em `localhost` — o pior tipo de bug.

Cinco pontos são absolutos de propósito, porque terceiros os consomem fora do
contexto do documento: `canonical`, `og:url`, `og:image`, a linha `Sitemap:`
do `robots.txt` e o `<loc>` do `sitemap.xml`. Ao trocar de domínio ou de nome
de repositório, são esses — e só esses — que mudam.

`.nojekyll` é obrigatório: sem ele o Pages roda o Jekyll, que ignora arquivos
iniciados por `_`.

---

## Decisões arquiteturais

### Adotadas

| Decisão | Motivo |
| --- | --- |
| Zero dependências | a plataforma nativa cobre tudo o que o site faz |
| Ilustrações com tokens fixos (`--project-*`) | o header do card não segue o tema; usar token global nele foi um bug — ver abaixo |
| Pilha de fontes do sistema | zero request, zero layout shift por troca de fonte |
| SVGs inline | zero request, herdam `currentColor` e acompanham o tema |
| Tema em CSS puro | `:has()` + `light-dark()` resolvem sem JavaScript |
| `IntersectionObserver` | API desenhada exatamente para "o que está visível" |
| `main.js` sem lógica | um índice legível do que o site executa |

### Carrossel de Projetos no mobile

Abaixo de 60em os 3 cards viram um carrossel horizontal com `scroll-snap`, e
a **barra de rolagem nativa é escondida** (`scrollbar-width: none` +
`::-webkit-scrollbar`). A affordance passa a ser textual: a mensagem
"← Deslize para ver mais →" (`.projects-hint`, `aria-hidden`), logo acima.
A partir de 60em vira grade de 3 colunas e o hint some.

Duas regras aqui não podem ser removidas sem quebrar algo:

- **`contain: layout paint` no `.projects-track`.** Sem isso, mesmo com
  `overflow-x` cortando visualmente, o Chrome mobile soma os 3 cards ao
  cálculo do viewport de *layout* da página inteira e joga a navbar
  (centralizada com base nele) para fora da tela.
- **`content-visibility: auto` no `.project-card__header`.** É o que paga o
  custo do carrossel. Na pilha vertical anterior os cards 2 e 3 ficavam longe
  da dobra e o navegador já ignorava suas animações sozinho; no carrossel os
  três ocupam a **mesma faixa vertical**, e as três ilustrações passavam a
  animar juntas. Medido com CPU 4× mais lenta: 18,8 → 29 ms por quadro, e de
  volta a 18,4 ms com a regra. O `contain-intrinsic-size: auto 12.5rem`
  reserva a altura exata do header, então o CLS continua 0.

### Malha 3D — duas instâncias, construção adiada

A malha aparece duas vezes: abrindo a página (Hero) e fechando-a (Contato +
rodapé, `--bottom`, mais discreta por ficar atrás de cartões de texto). O
módulo faz `querySelectorAll('[data-mesh-bg]')`, então **um contêiner novo
ganha uma malha sem nenhuma linha de JS**.

O que exigiu mudança no JS foi o custo de *construção*: `createMesh()` cria o
contexto WebGL, compila os shaders e sobe os buffers — caro mesmo sem
desenhar quadro nenhum. Construir as duas na carga pesava no thread
principal. Hoje `initMeshBackground()` observa os contêineres com
`rootMargin: 200px` e só constrói cada malha quando ela se aproxima da tela:
a da Hero nasce visível e é construída na hora; a do rodapé sai por completo
do carregamento inicial.

Cada malha continua desenhando só enquanto está visível, então as duas nunca
rodam juntas — medido: ~40 rAF/s no topo, ~35 no fim, e não a soma.

### Token de tema em fundo que não segue o tema

O corpo do card **é** theme-aware (`background-color: var(--color-bg)`), mas
o **header é fixo claro** — os dois gradientes não têm variante de tema
nenhuma. Enquanto as linhas de fundo das ilustrações usavam
`var(--color-border)`, que inverte com o tema (#e5e7eb ↔ #27272a), o mesmo
elemento decorativo rendia:

| Tema | Cor da linha | Fundo | Contraste |
| --- | --- | --- | ---: |
| Claro | `#e5e7eb` | idêntico | ~1,09:1 (invisível) |
| Escuro | `#27272a` | idêntico | ~3,05:1 (marcado) |

Corrigido com `--project-line: #94a3b8`, fixo, ao lado dos demais
`--project-*` em `.projects-track`. Hoje a cor computada é a mesma nos dois
temas.

**Regra que fica:** arte desenhada sobre o header do card usa `--project-*`;
`--color-*` pertence ao corpo do card. Não misture camadas com regras de
tema diferentes.

Detalhe que custou um ciclo de depuração: `.project-card__grid-line` tem
`animation: project-grid-shimmer`, cujos keyframes declaram `opacity`.
**Uma animação em curso sobrepõe a declaração normal da mesma
propriedade** — subir o `opacity` estático na regra não teve efeito algum
até a faixa dos keyframes subir junto (`utilities/animations.css`). O valor
estático continua valendo sob `prefers-reduced-motion`, quando a animação
é desligada.

### Avaliadas e recusadas

Registrar a recusa é parte do trabalho — evita que a ideia volte todo mês.

- **Sprite SVG (`<symbol>` + `<use>`).** Há 43 KB de `<path d>` duplicado
  (30% do HTML cru). Mas o HTML comprime de 144 KB para 34 KB: o gzip já
  colapsa quase toda a duplicação, e a economia real na rede não paga um
  diff que toca 72 SVGs inline.
- **Concatenar os 18 CSS.** São ~21 KB comprimidos sobre HTTP/2. Concatenar
  exigiria build (proibido) ou manutenção manual, e destruiria a
  legibilidade da ordem de carga — que É a arquitetura do CSS. Continua
  sendo o maior item em aberto de performance: reavaliar se o número de
  arquivos crescer muito.
- **Pausar as ~40 animações CSS fora da viewport.** Ganho real, mas exigiria
  JavaScript novo sobre uma camada hoje 100% declarativa. Candidata natural
  a `animation-timeline: view()` quando o suporte amadurecer.
- **Persistir o tema em `localStorage`.** Exigiria JavaScript e um script
  inline bloqueante para evitar flash. Seguir o sistema operacional resolve
  o problema real (primeira visita) sem nenhum dos dois.

---

## Manutenção

O teste: alguém que abre `index.html` pela primeira vez consegue localizar
estrutura, estilo, comportamento e assets, e modificar **uma** seção sem
entender o projeto inteiro?

O que sustenta isso: comentários que explicam **por quê** (não o quê),
sobretudo nas decisões contraintuitivas — a ordem do `<head>`, os cards
duplicados do marquee, o `<br>` do Hero, o `!important` único.

**Ao mudar um comportamento, atualize o comentário no mesmo passo.** Deriva
de documentação corrói a confiança em todos os outros comentários.

Para trabalho assistido por IA, `.claude/skills/` traz sete skills
específicas deste projeto — comece sempre por `project-guardian`, que
registra os invariantes que quebram em silêncio.
