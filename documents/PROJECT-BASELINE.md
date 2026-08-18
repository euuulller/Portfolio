# Project Baseline

Estado do projeto **antes** da refatoração, registrado a partir de leitura
integral do HTML, CSS e JavaScript. Serve como ponto de comparação e como
justificativa das decisões tomadas depois.

Data do levantamento: 2026-08-18.

---

## Inventário

41 arquivos. A estrutura real difere da que o briefing assumia: o
JavaScript vive em `assets/js/` (não `js/`), há 18 arquivos CSS (não 7), e
existe um workflow de deploy.

```text
euller-duarte-portfolio/
├── index.html                      1.146 linhas · 144 KB
├── assets/
│   ├── css/   base/ (3) · utilities/ (3) · components/ (12)   = 18 arquivos
│   ├── js/    main.js · modules/ (3) · utils/ (1) · vendor/ (vazio)
│   ├── icons/     favicon.svg · apple-touch-icon · icon-192 · icon-512
│   ├── images/    (só README — profile.jpg AUSENTE)
│   └── documents/ (só README — curriculo-…pdf AUSENTE)
├── .github/workflows/deploy.yml
├── site.webmanifest · robots.txt · sitemap.xml · .nojekyll
└── README.md · LICENSE · .editorconfig · .gitattributes · .gitignore
```

**Não é um repositório Git.** `git status` retorna
`fatal: not a git repository`. Todo protocolo de segurança baseado em
`git diff` / `git stash` é inaplicável; a proteção passou a ser snapshot no
scratchpad + diffs pequenos e independentes + nenhuma remoção de arquivo.

---

## Arquitetura

**HTML** — documento único, 5 seções. Landmarks reais, um `<h1>`, quatro
`<h2>`, três `<h3>`. 72 SVGs inline. 20 tags SMIL `<animate>`.

**CSS** — três camadas (`base` → `utilities` → `components`), uma peça da
interface por arquivo. A **ordem dos 18 `<link>` no `<head>` é a
arquitetura**: `accessibility.css` carrega por último para vencer os
componentes pela cascata, não por `!important`.

**JavaScript** — ES Modules, sem bundler. `main.js` é índice sem lógica;
três módulos (`scroll-spy`, `reduced-motion`, `mesh-background`) e um util
(`motion`) compartilhado por dois deles.

**Tema** — claro/escuro por *checkbox hack*:
`:root:has(#navbar-theme-toggle:checked)` troca os tokens de cor. Zero JS.

---

## Peso — medido com `gzip -9`

| Recurso | Transferido | Fatia |
|---|---:|---:|
| **Three.js r128 (cdnjs)** | **149.872 B** | **~72%** |
| `index.html` | 33.979 B | 16% |
| CSS (18 arquivos) | 20.323 B | 10% |
| JS próprio | ~5.000 B | 2% |
| **Total** | **~209 KB** | |

A dependência externa custava **mais que o dobro do site inteiro somado**,
para uma malha decorativa atrás do headline.

Detalhe que mudou a priorização: `index.html` tem **144 KB crus mas 34 KB
comprimidos**. Há 43 KB de `<path d>` duplicado (30% do arquivo cru), mas o
gzip já colapsa quase tudo — a economia real de um sprite SVG seria pequena
diante de um diff que toca 72 SVGs. Reprovado pela regra do menor diff.

---

## O que já estava correto

Verificado, não presumido. Nada aqui precisava ser tocado:

- **Zero CSS morto.** Nenhuma classe declarada sem uso no HTML; nenhum
  `@keyframes` órfão (os 21 são usados).
- **Um único `!important`** em todo o projeto, com justificativa correta:
  seletor universal tem especificidade 0 e perderia para qualquer classe.
- IDs únicos, hierarquia de headings correta, todos os alvos de
  `aria-labelledby` resolvem.
- Contraste aprovado em AA nos dois temas; alvos de toque acima de 24px.
- `scroll-spy.js` já usa `IntersectionObserver` — sem listener de `scroll`.
- `mesh-background.js` já pausava fora da viewport, agrupava `resize` em
  rAF, limitava DPR a 2, tratava `webglcontextlost` e guardava contra rAF
  paralelo.
- Movimento reduzido tratado nos **três** sistemas de animação (CSS, SMIL,
  WebGL).
- Todos os caminhos relativos → seguros sob `/Data-Analysis/`.
- Zero fonte externa; zero `innerHTML`/`eval`/`new Function`; todo
  `target="_blank"` com `rel="noopener noreferrer"`.

---

## Problemas encontrados

### Bloqueantes em produção — dependem do usuário

| Arquivo ausente | Impacto |
|---|---|
| `assets/images/profile.jpg` | `<img>` quebrada na seção Sobre **e** prévia social quebrada (é o `og:image`) |
| `assets/documents/curriculo-euller-duarte.pdf` | 404 no botão de currículo da navbar |

Os READMEs das pastas indicam que ambos "vêm do repositório original".
Por decisão do usuário, **nenhuma referência foi alterada** — pendência
registrada no QA.

### Performance

1. **Three.js: 150 KB gzipped de origem terceira, sem `integrity`,** para
   uma malha decorativa. O módulo usava só 8 primitivas da biblioteca e os
   shaders GLSL já eram escritos à mão.
2. **`matchMedia()` dentro do laço de render.** `prefersReducedMotion()`
   criava um novo `MediaQueryList` a cada chamada e era invocada em
   `renderFrame` — ~60×/segundo.
3. ~40 animações CSS infinitas + 20 SMIL rodam continuamente,
   independentemente da viewport. Só a malha WebGL se autorregulava.
4. 18 folhas de estilo bloqueantes (20 KB gzipped) sobre HTTP/2.

### Tema

O toggle CSS-only não persistia entre recarregamentos, **ignorava
`prefers-color-scheme`** (visitante com SO escuro recebia página branca), e
`<meta name="theme-color">` estava fixo em `#ffffff`.

### Resiliência

`LOCAL_THREE_URL` apontava para `assets/js/vendor/three.min.js`, que não
existe: se o CDN falhasse, o fallback gerava um 404 no console.

### Deriva de documentação

9 comentários apontando para arquivos inexistentes — 5 citando um
`CLAUDE.md` que não está no projeto, 4 citando `assets/js/navbar.js` e
`assets/js/reduced-motion.js` (caminhos reais:
`assets/js/modules/scroll-spy.js` e `assets/js/modules/reduced-motion.js`).
Mais uma frase em `accessibility.css` afirmando que o balanço do café é
neutralizado — o café nunca animou.

---

## Riscos da refatoração

| Risco | Mitigação |
|---|---|
| Malha WebGL divergir visualmente da versão Three.js | Shaders GLSL mantidos literalmente; verificação visual nos dois temas antes de prosseguir; snapshot para reverter só esse item |
| Inversão do tema pelo SO contradizer o ícone sol/lua | Mesma inversão aplicada aos ícones em `navbar.css`; as 4 combinações testadas |
| Ausência de Git impedir recuperação | Snapshot completo no scratchpad antes da primeira edição |

## Arquivos críticos

`index.html` · `assets/css/base/tokens.css` ·
`assets/css/utilities/accessibility.css` ·
`assets/js/modules/mesh-background.js` · `assets/js/utils/motion.js`
