---
name: project-guardian
description: Camada de proteção obrigatória antes de qualquer edição no portfólio. Use SEMPRE antes de modificar HTML, CSS ou JS deste projeto — registra os invariantes que quebram em silêncio e o protocolo de backup (o projeto NÃO é um repositório Git).
---

# Project Guardian

Primeira skill a rodar. Nenhuma edição neste projeto começa sem passar por aqui.

## 1. Não há Git neste diretório

Verificado: `git status` retorna `fatal: not a git repository`. Todo o
protocolo de segurança baseado em `git status` / `git diff` / `git stash`
**não se aplica** — e não adianta tentar.

A proteção vem de outro lugar:

```bash
# Antes da primeira edição de uma sessão, snapshot completo no scratchpad:
cp -r . "$SCRATCH/baseline-snapshot/"
```

Regras que substituem o Git aqui:

- **Nunca apague um arquivo.** Sem histórico, não há como recuperar.
- **Nunca reescreva um arquivo inteiro** quando um `Edit` pontual resolve.
- Diffs pequenos e independentes, um assunto por vez — se um precisar ser
  revertido, os outros continuam de pé.
- Depois de editar, releia o trecho alterado. Não existe `git diff` para
  conferir por você.

## 2. Invariantes — quebram em silêncio, sem erro no console

Cada item abaixo foi verificado em auditoria. Todos parecem redundância ou
descuido para quem chega de fora. **Nenhum é.**

### A ordem dos 18 `<link>` CSS no `<head>` é a arquitetura

`assets/css/utilities/accessibility.css` é o **último** de propósito: é a
ordem de carga, e não `!important`, que dá a ele a vitória na cascata sobre
os componentes. Trocar duas linhas de lugar no `<head>` muda o resultado
renderizado.

A sequência correta: `base/` (reset → tokens → base) → `utilities/`
(utilities → animations) → `components/` (na ordem em que aparecem na
página) → `utilities/accessibility.css`.

### Os cards duplicados de Habilidades não são redundância

`index.html` repete os 8 `.skill-card` com `aria-hidden="true"`. Isso é
exigido por duas coisas ao mesmo tempo:

1. o loop `translateX(-50%)` de `skills-scroll-left/right` só parece
   contínuo porque a trilha tem exatamente o dobro do conteúdo;
2. `accessibility.css` esconde justamente `.skill-card[aria-hidden="true"]`
   sob movimento reduzido, para a trilha virar uma grade estática legível.

Remover as cópias quebra o loop **e** o modo de movimento reduzido.

### `.visually-hidden` nunca pode virar `display: none`

O `<input type="checkbox">` do tema é `.visually-hidden` porque precisa
continuar **focável por teclado** — o clique funciona pelo `<label>`, mas a
navegação por Tab depende do input existir na árvore de foco.
`display: none` o remove de lá e mata o toggle para quem usa teclado.

### O `<br>` em `.hero__headline` é proposital

Garante a composição de duas linhas em telas médias e grandes. Não é
gambiarra de espaçamento.

### SMIL não é alcançado por media query CSS

As 20 tags `<animate>` da ilustração do card "Dashboard de Vendas" são um
sistema de animação separado do CSS. Nenhum
`@media (prefers-reduced-motion)` as atinge — é por isso que
`assets/js/modules/reduced-motion.js` existe e chama `pauseAnimations()`.
Não conclua que aquele módulo é supérfluo.

### O `!important` de `accessibility.css` é obrigatório

Único do projeto. Está num seletor universal (`*`), que tem especificidade
0 e perderia para qualquer `.classe` de componente. Sem ele, a neutralização
de transições sob movimento reduzido não funciona. Não tente "limpar".

## 3. Proibições

Herdadas do prompt do projeto e reforçadas pela auditoria:

- Não introduzir framework (React/Vue/Tailwind/jQuery/GSAP/…).
- Não introduzir bundler, build step ou backend. O que está no repositório
  **é** o site — `.github/workflows/deploy.yml` apenas empacota a raiz.
- Não adicionar dependência externa. O projeto é *dependency-free* desde a
  remoção da Three.js.
- Não alterar design, paleta, tipografia, conteúdo ou layout sem pedido
  explícito.
- Não remover animação sem antes rastrear onde é usada, qual JS a controla
  e se há fallback.
- Não remover arquivo "aparentemente não utilizado" sem busca por
  referências em HTML, CSS, JS **e comentários**.

## 4. Antes de aplicar qualquer mudança, responda

1. Qual problema real isto resolve?
2. Existe solução mais simples na ordem HTML → CSS → Web API → JS?
3. Aumenta a complexidade?
4. Qual o risco de regressão visual?
5. Impacta performance, acessibilidade, SEO ou GitHub Pages?

Benefício pequeno + risco alto = **não faça**.
