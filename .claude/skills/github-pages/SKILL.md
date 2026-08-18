---
name: github-pages
description: Garante compatibilidade do portfólio com o GitHub Pages sob o subcaminho /Portfolio/. Use ao mexer em qualquer caminho (href, src, url(), import, manifest, sitemap) ou no workflow de deploy.
---

# GitHub Pages

**Produção:** <https://euuulller.github.io/Portfolio/>

O site é servido de um **subcaminho** (`/Portfolio/`), não da raiz do
domínio. Esse é o fato que governa todas as regras abaixo.

## A regra de caminhos

Um caminho iniciado por `/` resolve para a **raiz do domínio**
(`euuulller.github.io/assets/…`), que não existe. Quebra em produção e
funciona em `localhost` — o pior tipo de bug, porque passa no teste local.

```
✅ assets/css/base/tokens.css      relativo ao documento
✅ ./assets/images/photo.webp
❌ /assets/css/base/tokens.css     resolve para a raiz do domínio
```

Auditado: **todos os caminhos do projeto já são relativos.** Mantenha.

```bash
# Caminhos absolutos indevidos (a única URL absoluta legítima é a canonical)
grep -o '\(href\|src\)="/[^"]*"' index.html
```

Exceções que **devem** permanecer absolutas — são consumidas por
terceiros, fora do contexto do documento:

- `<link rel="canonical">`
- `og:url` e `og:image`
- a linha `Sitemap:` em `robots.txt`
- `<loc>` em `sitemap.xml`

Ao mudar o nome do repositório ou migrar para domínio próprio, esses cinco
pontos são os que precisam ser reescritos — e só eles.

## Caminhos dentro de JavaScript

Módulos ES resolvem `import` relativo ao **próprio módulo**, não à página —
já correto por construção.

Para construir uma URL de recurso em runtime, use `import.meta.url` como
base, nunca uma string montada a partir de `location`:

```js
new URL('../vendor/arquivo.js', import.meta.url)
```

Funciona igual na raiz do domínio e sob `/Portfolio/`.

## Verificação de referências quebradas

Roda em segundos e pega o erro mais caro do projeto:

```bash
grep -o '\(href\|src\)="[^"#][^"]*"' index.html \
  | sed 's/.*="//;s/"$//' \
  | grep -v "^https\?:\|^mailto:\|^#" | sort -u \
  | while read r; do [ -e "$r" ] || echo "MISSING: $r"; done
```

**Pendências conhecidas** (o usuário fornecerá — não altere as referências):

| Arquivo | Impacto se publicar sem ele |
|---|---|
| `assets/images/profile.jpg` | imagem quebrada na seção Sobre **e** prévia social quebrada (é o `og:image`) |
| `assets/documents/curriculo-euller-duarte.pdf` | 404 no botão de currículo da navbar |

## `.nojekyll`

Arquivo vazio na raiz, **obrigatório**. Sem ele o GitHub Pages roda o Jekyll,
que ignora arquivos e pastas iniciados por `_` e pode reescrever conteúdo.
Não remova.

## Deploy

`.github/workflows/deploy.yml` publica via GitHub Actions: `checkout` →
`configure-pages` → `upload-pages-artifact` com `path: .` → `deploy-pages`.

Não há instalação de dependências nem build — **o conteúdo do repositório é
o site**. Permissões mínimas (`contents: read`, `pages: write`,
`id-token: write`).

Exige, uma vez: **Settings › Pages › Source = "GitHub Actions"**.

Consequência prática: qualquer arquivo na raiz vai ao ar. Não deixe rascunho,
backup ou `.bak` no diretório — `.gitignore` cobre os padrões comuns.

## Manifest, robots, sitemap

- `site.webmanifest` usa `"start_url": "./"` e `"scope": "./"` — relativos,
  corretos sob subcaminho. Ícones idem.
- `sitemap.xml` tem uma única `<loc>`: é página única, e fragmentos
  (`#sobre`, `#projetos`) **não** são URLs indexáveis separadas. Não os
  adicione.
- Ao mudar conteúdo relevante, atualize `<lastmod>`.

## O que não fazer

- Não introduzir backend, SSR, PHP ou API — o Pages serve apenas estático.
- Não adicionar recurso externo por CDN. Além do peso e da privacidade, é um
  ponto de falha e um risco de CORS que o Pages não controla.
- Não confiar em teste via `file://`: ES modules quebram por CORS. Sempre
  servidor HTTP local (`python -m http.server`).
