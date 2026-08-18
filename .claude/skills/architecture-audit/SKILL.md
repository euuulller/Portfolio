---
name: architecture-audit
description: Audita a arquitetura de HTML, CSS e JavaScript do portfólio — semântica, cascata, modularidade e acoplamento. Use ao avaliar estrutura, ao adicionar uma seção/componente novo, ou antes de mover arquivos.
---

# Architecture Audit

Estado verificado na auditoria de referência: **HTML válido, CSS sem regras
mortas, JS modular e enxuto**. O papel desta skill é manter isso, não
reconstruir.

## HTML

Estrutura atual — preservar:

- `<header>` → `<nav class="navbar">` → `<main id="main-content">` →
  5 `<section id>` → `<footer class="site-footer">`.
- Exatamente **um `<h1>`** (`.hero__headline`). Quatro `<h2>` (um por
  seção via `.section-intro__title`). Três `<h3>` (títulos dos cards de
  projeto). Nunca pular nível.
- Cada `<section>` tem `aria-labelledby` apontando para o id do seu próprio
  heading. Cada `<article class="project-card">` também.
- `<footer class="site-footer">` fica **fora** de `<main>` e sem `id` — não é
  observado pelo scroll-spy, de propósito.

Ao adicionar uma seção nova:

1. `<section id="x" aria-labelledby="x-heading">`;
2. `<h2 id="x-heading" class="section-intro__title">` dentro de
   `.section-intro`;
3. um `<a class="navbar__link" href="#x" aria-label="X">` na navbar — o
   scroll-spy monta o mapa a partir do próprio DOM e **não precisa ser
   tocado**;
4. um CSS de componente novo, linkado na posição correta do `<head>`.

Verificações rápidas:

```bash
# IDs duplicados (ignorando comentários HTML)
grep -o ' id="[^"]*"' index.html | sort | uniq -d
# Alvos de aria-labelledby que não existem
for t in $(grep -o 'aria-labelledby="[^"]*"' index.html | sed 's/.*="//;s/"//' | sort -u); do
  grep -q "id=\"$t\"" index.html || echo "BROKEN: $t"
done
```

Cuidado: `grep` cru conta ocorrências dentro de comentários HTML. Na
auditoria, `id="contato"` e `<h1` apareceram duplicados **apenas** porque
comentários os citam. Confirme o contexto antes de reportar bug.

## CSS

Arquitetura em três camadas, refletida em `assets/css/`:

| Camada | Papel | Regra |
|---|---|---|
| `base/` | reset, tokens, html/body | nenhum componente aqui |
| `utilities/` | classes genéricas, `@keyframes`, acessibilidade | reutilizável por qualquer componente |
| `components/` | uma peça da interface por arquivo | não conhece outros componentes |

Princípios em vigor — manter:

- **Todo valor repetido vira token** em `base/tokens.css`. Não deixe valor
  mágico solto em componente.
- **Todo `@keyframes` vive em `utilities/animations.css`** (fonte única);
  cada componente é dono apenas da sua declaração `animation:`.
- Especificidade baixa: seletores de uma classe. Sem `#id` em estilo, sem
  aninhamento profundo.
- Um único `!important` no projeto, em `accessibility.css` — ver
  `project-guardian`.
- **Só extraia um componente depois que a duplicação aparecer de fato.**
  `.section-intro` nasceu assim (de `.about__header`), e é o padrão certo:
  não modularize preventivamente.

Detecção de regra morta:

```bash
# @keyframes definidos vs. usados — atenção: `animation:` shorthand pode
# quebrar em várias linhas, então grep por linha gera falso positivo.
grep -rho "@keyframes [a-zA-Z0-9_-]*" assets/css | sed 's/.*@keyframes //' | sort -u
```

## JavaScript

`assets/js/main.js` é ponto de entrada **sem lógica**: só declara quais
módulos sobem e em que ordem. Ler esse arquivo deve bastar para saber tudo o
que o site executa. Mantenha assim.

```
main.js          → só os três init()
modules/         → um comportamento por arquivo, com init() exportado
utils/           → só o que dois ou mais módulos compartilham
```

`utils/motion.js` existe porque dois módulos independentes precisam da mesma
resposta sobre movimento reduzido — esse é o critério para criar um util.
Um consumidor só = mantenha no módulo.

Regras em vigor:

- Nada de estado global; `type="module"` já garante escopo isolado.
- Cada módulo faz *early return* quando seu alvo não existe no DOM
  (`if (!links.length) return;`) — degradação graciosa sem erro no console.
- Web API nativa antes de código próprio: `IntersectionObserver` em vez de
  listener de `scroll`; `matchMedia` em vez de detecção manual.
- **Nunca** `setInterval` para animação — `requestAnimationFrame`.
- Nomes descritivos (`scrollSpy`, `meshBackground`, `reducedMotion`), nunca
  `data`, `obj`, `temp`.

## Ordem de decisão para qualquer requisito novo

```
HTML semântico → CSS → Web API → JavaScript → (biblioteca) → (framework)
```

Quanto mais abaixo, maior a justificativa exigida. Hoje o projeto para no
JavaScript: tema, tooltips e o carrossel de habilidades são resolvidos sem
uma linha de script.
