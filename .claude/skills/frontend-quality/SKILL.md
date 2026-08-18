---
name: frontend-quality
description: Revisão transversal de qualidade do portfólio — responsividade, UX/UI, SEO, segurança e manutenibilidade. Use como checagem final antes de considerar uma mudança pronta.
---

# Frontend Quality

Revisão de fechamento. As skills específicas (`architecture-audit`,
`performance-audit`, `accessibility-audit`, `github-pages`) cobrem cada
domínio a fundo; esta cobre o que sobra e o que atravessa.

## Responsividade

Larguras a verificar: **320 · 375 · 768 · 1024 · 1440 · 1920**.

O layout muda de estrutura em apenas três pontos — não há mais breakpoints
escondidos:

| Breakpoint | Arquivo | O que muda |
|---|---|---|
| `max-width: 43.75em` | `navbar.css` | pill vira largura total; alvos 2,35→2,15rem; tooltip some |
| `min-width: 48em` | grid de contato | colunas |
| `min-width: 60em` (×2) | `about.css`, `projects.css` | foto e texto lado a lado |

Todo o resto escala por `clamp()` fluido, sem media query. Ao adicionar
tamanho novo, prefira `clamp()` a um breakpoint — é o padrão da casa.

### O tooltip some no mobile de propósito

`.navbar__link::after { display: none }` abaixo de 43.75em: não existe
`:hover` persistente em touch, e o texto ficaria "grudado" após o toque. O
`aria-label` continua lá para leitor de tela.

### Overflow horizontal — ponto de atenção conhecido

`.mesh-bg-container` usa `width: 100vw` com `left: 50%` +
`translateX(-50%)` para sangrar de ponta a ponta. `100vw` **inclui a largura
da barra de rolagem clássica**, causa clássica de scroll lateral no desktop.

Verifique sempre que mexer na Hero:

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

Deve ser `false` em todas as larguras.

## UX/UI — preservar, não redesenhar

Durante refatoração, a função é **preservar o design existente enquanto
melhora a implementação**.

Pode corrigir sem perguntar: bug, quebra de responsividade, problema de
acessibilidade, desalinhamento claramente acidental, estado impossível.

**Não** altere sem pedido explícito: identidade visual, layout, paleta,
tipografia, conteúdo textual, composição, animações características.

## SEO técnico

Presentes e corretos: `<title>`, `<meta name="description">`, `canonical`,
Open Graph completo, `twitter:card`, `lang`, favicon, manifest, `robots.txt`,
`sitemap.xml`.

- Metadados devem **descrever fielmente** o conteúdo. Nada de palavra-chave
  inflada.
- `og:image` aponta para `assets/images/profile.jpg`, hoje ausente — a
  prévia social está quebrada até o arquivo existir. O `README` de
  `assets/images/` sugere criar um `og-image.jpg` 1200×630 horizontal, já
  que a foto de perfil é vertical e será recortada pelas redes.
- Ao mudar a URL de produção, sincronize os cinco pontos absolutos listados
  na skill `github-pages`.

## Segurança

Auditado — **nenhuma ocorrência** de `innerHTML`, `eval`, `new Function` ou
`document.write` no projeto. Todo `target="_blank"` já traz
`rel="noopener noreferrer"`. Nenhum script inline. Zero recursos de
terceiros (a Three.js foi removida).

Ao escrever JS novo, prefira `textContent`, `createElement`, `append`,
`classList`, `dataset`. Se algum dia `innerHTML` parecer necessário,
provavelmente o problema é estrutural e pertence ao HTML.

Antes de aceitar **qualquer** recurso externo, responda: é necessário? pode
ser servido localmente? qual o custo de performance e de privacidade? pode
quebrar por CORS ou sob o subcaminho do Pages? A resposta padrão do projeto
é **não adicionar**.

## Manutenibilidade

O teste: alguém que abre `index.html` pela primeira vez consegue localizar
estrutura, estilo, comportamento e assets, e modificar **uma** seção sem
entender o projeto inteiro?

O que sustenta isso hoje e precisa sobreviver:

- comentários que explicam **por quê**, não o quê — sobretudo nas decisões
  contraintuitivas (a ordem do `<head>`, os cards duplicados, o `<br>` da
  Hero, o `!important` único);
- um arquivo CSS por componente, nomeado como o bloco BEM que contém;
- `main.js` sem lógica, servindo de índice do que o site executa.

Ao alterar um comportamento, **atualize o comentário junto**. A auditoria
encontrou 9 comentários apontando para arquivos que não existem mais
(`CLAUDE.md`, `assets/js/navbar.js`) — deriva de documentação corrói a
confiança em todos os outros comentários.
