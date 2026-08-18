# Euller Duarte — Portfólio de Data Analyst

Site pessoal de página única, estático, sem framework e sem etapa de build.
HTML semântico, CSS modular e três módulos JavaScript. O que está no
repositório é exatamente o que vai para o ar.

**Produção:** <https://euuulller.github.io/Portfolio/>

---

## Sumário

- [Stack](#stack)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Arquitetura CSS](#arquitetura-css)
- [Arquitetura JavaScript](#arquitetura-javascript)
- [Animações](#animações)
- [Acessibilidade](#acessibilidade)
- [Dependências](#dependências)
- [Rodando localmente](#rodando-localmente)
- [Publicando no GitHub Pages](#publicando-no-github-pages)
- [Convenções para continuar o projeto](#convenções-para-continuar-o-projeto)
- [Licença](#licença)

---

## Stack

| Camada     | Escolha                                    | Por quê |
| ---------- | ------------------------------------------ | ------- |
| Marcação   | HTML5 semântico                            | Landmarks reais (`header`/`main`/`section`/`footer`), sem `div` genérica onde existe elemento próprio. |
| Estilo     | CSS puro, tokens em custom properties      | Sem pré-processador: `var()`, `clamp()` e `:has()` cobrem o que se usaria de Sass aqui, nativamente e sem build. |
| Script     | JavaScript ES Modules                      | Escopo isolado, modo estrito e execução adiada de graça, sem bundler. |
| Tipografia | Pilha de fontes do sistema                 | Zero requisição de fonte, zero *layout shift* por troca de fonte. |
| 3D         | WebGL puro (sem biblioteca)                | A malha do Hero é ~200 linhas de WebGL com shaders próprios — ver [Dependências](#dependências). |
| Hospedagem | GitHub Pages                               | Estático, gratuito, HTTPS e HTTP/2. |

---

## Estrutura do projeto

```text
.
├── index.html                    # documento único: estrutura, conteúdo e SVGs inline
├── site.webmanifest              # instalação como app (ícones, cores, nome)
├── robots.txt / sitemap.xml      # indexação
├── .nojekyll                     # desliga o Jekyll no GitHub Pages
│
├── assets/
│   ├── css/
│   │   ├── base/                 # reset, tokens, estilos de html/body
│   │   ├── utilities/            # classes genéricas, @keyframes, acessibilidade
│   │   └── components/           # um arquivo por peça da interface
│   │
│   ├── js/
│   │   ├── main.js               # ponto de entrada: só declara o que sobe
│   │   ├── modules/              # um arquivo por comportamento
│   │   ├── utils/                # o que dois módulos compartilham
│   │   └── vendor/               # vazia — o projeto não tem dependências
│   │
│   ├── icons/                    # favicon SVG + PNGs (iOS e PWA)
│   ├── images/                   # foto de perfil  (ver README de lá)
│   └── documents/                # currículo em PDF (ver README de lá)
│
└── .github/workflows/deploy.yml  # publicação automática
```

Por que o `index.html` continua sendo um arquivo só: não há template engine
nem build. Dividir a marcação exigiria JavaScript montando a página em
tempo de execução — o que custaria conteúdo indexável, tempo de primeira
pintura e uma dependência nova, em troca de nenhuma vantagem de manutenção
que os comentários de seção já não deem.

---

## Arquitetura CSS

Sem bundler, **a ordem dos `<link>` no `<head>` é a arquitetura**. São
quatro camadas, e cada uma existe porque precisa vencer a anterior:

1. **`base/`** — `reset.css` neutraliza o navegador, `tokens.css` define
   todas as custom properties (incluindo o tema escuro), `base.css`
   estiliza `html`/`body`/`section[id]`.
2. **`utilities/utilities.css` + `animations.css`** — `.visually-hidden`,
   `.skip-link` e a fonte única de `@keyframes`.
3. **`components/`** — um arquivo por componente, na ordem em que aparecem
   na página. Nomenclatura BEM (`.bloco__elemento--modificador`).
4. **`utilities/accessibility.css`** — por último, de propósito: é a camada
   que precisa se sobrepor a qualquer componente (foco visível,
   `prefers-reduced-motion`). É a ordem, não `!important`, que dá essa
   vitória.

**Sobre requisições:** são 18 arquivos CSS. Sob HTTP/2 (que o GitHub Pages
serve), eles são multiplexados numa única conexão já aberta e somam ~60 KB
antes da compressão — o custo real é marginal, e em troca não existe etapa
de build entre editar e ver o resultado. Se algum dia o volume justificar,
o caminho é concatenar em ordem no deploy, sem tocar nos arquivos-fonte.

**Regras de convivência**

- Nenhum valor mágico repetido: se aparece duas vezes ou representa uma
  escala, vira token em `base/tokens.css`.
- Tokens de um componente só (cores de badge, easing de card) ficam
  escopados no próprio componente, não no `:root` global.
- Componente novo = arquivo novo + `<link>` na posição correta.
- Um único `!important` no projeto, em `accessibility.css`, e o comentário
  ao lado explica por que ele é inevitável ali.

---

## Arquitetura JavaScript

A regra é **JavaScript por último**, nesta ordem: HTML nativo → CSS → Web
API → JS. Por isso o tema (checkbox + `:has()`), os tooltips
(`content: attr(aria-label)`) e o carrossel de habilidades (`@keyframes`)
não têm uma linha de script. Sobraram três casos:

| Módulo                       | Problema que resolve | Web API |
| ---------------------------- | -------------------- | ------- |
| `modules/scroll-spy.js`      | Nada em CSS observa *qual* seção está visível durante a rolagem — `:target` reage a clique, não a scroll. | `IntersectionObserver` |
| `modules/reduced-motion.js`  | Media query CSS não alcança animação SMIL (`<animate>`), usada no card Dashboard. | `matchMedia` + `SVGSVGElement.pauseAnimations()` |
| `modules/mesh-background.js` | A ondulação da malha vem de ruído simplex calculado por vértice a cada quadro. Não há equivalente em CSS. | WebGL + `requestAnimationFrame` |

Todos degradam em silêncio: se um módulo falhar, o site continua navegável,
legível e com o tema funcionando — nenhum deles é pré-requisito de conteúdo.

---

## Animações

Todos os `@keyframes` do projeto vivem em
`assets/css/utilities/animations.css`. `@keyframes` é resolvido por **nome**,
em escopo global, então centralizá-los não altera cascata nenhuma — muda o
custo de manutenção: o movimento inteiro do site é lido de uma vez e um nome
duplicado (que sobrescreveria outro silenciosamente) fica evidente.

Cada componente continua dono da sua declaração `animation:` — duração,
easing e delay ficam junto do elemento que se move; em `animations.css`
ficam só as trajetórias.

São quatro camadas de movimento, todas desligadas sob
`prefers-reduced-motion`:

| # | Camada             | Onde                                        | Quantidade |
| - | ------------------ | ------------------------------------------- | ---------- |
| 1 | CSS `@keyframes`   | `utilities/animations.css`                   | 21 |
| 2 | CSS `transition`   | arquivos de componente (hover/foco)          | — |
| 3 | SVG SMIL `<animate>` | inline no `index.html` (card Dashboard)    | 19 |
| 4 | WebGL              | `modules/mesh-background.js`                 | 1 laço |

A camada 3 é inline por necessidade, não por descuido: não existe
equivalente em CSS para animar o atributo `points` de uma `<polyline>`, e os
valores das barras são inseparáveis da geometria do SVG.

---

## Acessibilidade

- **Teclado:** `.skip-link` como primeiro elemento tabulável; anel de foco
  visível em todo link (`:focus-visible`); o `<input>` oculto do tema usa
  `.visually-hidden` (não `display: none`), então continua focável, e
  propaga o anel de foco para o `<label>` visível.
- **Leitores de tela:** landmarks reais, hierarquia `h1 → h2 → h3` sem
  saltos, `aria-labelledby` ligando cada seção ao seu título, exatamente um
  `aria-current="page"` por vez, cards duplicados do marquee marcados com
  `aria-hidden="true"` para não serem anunciados duas vezes, ícones
  decorativos com `aria-hidden` + `focusable="false"`.
- **Movimento reduzido:** transições zeradas por regra universal (cobre
  componentes futuros sem manutenção) e animações desligadas por lista
  explícita — desligar animação às cegas congelaria elementos no primeiro
  quadro, que em várias ilustrações é um estado invisível ou fora de
  posição. A malha WebGL desenha um quadro estático e encerra o laço.
- **Layout shift:** `width`/`height` na `<img>` de perfil reservam o espaço
  antes do download; zero fonte externa, logo zero troca de fonte.

---

## Dependências

**Nenhuma.** Nenhuma requisição sai para outro domínio: sem CDN, sem fonte
externa, sem analytics, sem embed.

Até agosto/2026 havia uma exceção — a malha 3D do Hero rodava sobre
**Three.js r128**, via cdnjs. Os números que motivaram a remoção:

| Recurso | Transferido (gzip) |
| --- | ---: |
| Three.js r128 | **149.872 B** |
| `index.html` | ~34.000 B |
| CSS (18 arquivos) | ~21.000 B |
| JS próprio | ~10.000 B |

A biblioteca custava **mais que o dobro do site inteiro somado**, para
desenhar um plano em wireframe atrás de um título. Do pacote, o módulo usava
oito primitivas, e os shaders GLSL já eram escritos à mão — o que a Three.js
de fato entregava era matriz de projeção, uma grade de vértices e o
boilerplate de WebGL.

Hoje [`assets/js/modules/mesh-background.js`](assets/js/modules/mesh-background.js)
é WebGL puro com **os mesmos shaders**, em ~200 linhas. O total transferido
caiu de ~209 KB para ~65 KB (**-69%**), e o caminho crítico perdeu uma
origem terceira que era carregada sem `integrity`.

Se o WebGL não estiver disponível, o Hero aparece sem a malha — o contêiner
é absoluto e `aria-hidden`, então não deixa buraco no layout nem erro no
console.

Antes de adicionar qualquer dependência, veja
[`assets/js/vendor/README.md`](assets/js/vendor/README.md).

---

## Rodando localmente

Os módulos ES exigem HTTP — abrir `index.html` direto do disco (`file://`)
falha na política de mesma origem. Suba um servidor estático na raiz:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

Depois acesse <http://localhost:8000>.

**Checklist antes de dar push**

1. Console do navegador sem erros e sem 404.
2. Alternar o tema: navbar, textos, bordas e a cor da malha acompanham.
3. Redimensionar de 320 px a 1920 px sem rolagem horizontal em nenhum ponto.
4. Navegar a página inteira só com `Tab`, conferindo o foco visível.
5. Ligar "reduzir movimento" no sistema e recarregar: nada deve se mexer.

---

## Publicando no GitHub Pages

O workflow em `.github/workflows/deploy.yml` publica a cada push na `main`.
Antes do primeiro uso: **Settings › Pages › Source = "GitHub Actions"**.

Cuidados que o projeto já respeita e que precisam continuar valendo:

- **Todos os caminhos são relativos** (`assets/…`, nunca `/assets/…`). O
  site vive sob o subcaminho `/Portfolio/`, e uma barra inicial
  apontaria para a raiz do domínio `euuulller.github.io`, quebrando todos os
  arquivos. A única URL absoluta do projeto é a `canonical` (e as metas Open
  Graph), que exigem URL completa por especificação.
- **`.nojekyll` na raiz.** Sem ele, o GitHub processa o site com Jekyll, que
  ignora pastas e arquivos iniciados por `_`. É uma armadilha silenciosa
  para qualquer arquivo futuro nesse formato.
- **Nada de servidor.** Sem backend, sem rota de servidor, sem `fetch` de
  API própria: o site é 100% estático por construção.

---

## Convenções para continuar o projeto

- **Seção nova:** `<section id="…" aria-labelledby="…">` dentro do `<main>`
  + `<link>` do CSS na posição correta + link na navbar (o scroll-spy monta
  o mapa a partir do próprio DOM, então não precisa ser tocado).
- **Componente novo:** um arquivo em `components/`, BEM, tokens do
  `:root` para tudo que já existe na escala.
- **Animação nova:** `@keyframes` em `utilities/animations.css`, declaração
  `animation:` no componente, e o seletor incluído na lista de
  `prefers-reduced-motion` em `accessibility.css`.
- **Comentário:** só quando explica *por quê*, nunca *o quê*. O código já
  diz o que faz; o comentário existe para a decisão que não é óbvia daqui a
  seis meses.

---

## Licença

[MIT](LICENSE). A licença cobre o código deste repositório — ícones de
terceiros, marcas, foto pessoal e currículo têm condições próprias, listadas
no fim do arquivo `LICENSE`.
