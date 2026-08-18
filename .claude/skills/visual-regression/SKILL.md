---
name: visual-regression
description: Compara o portfólio antes e depois de uma mudança para garantir que nenhuma regressão visual acidental foi introduzida. Use obrigatoriamente após qualquer alteração em CSS, em SVG inline ou na malha da Hero.
---

# Visual Regression

Critério único: **a refatoração não pode produzir regressão visual
acidental.** Código correto não é o mesmo que site correto.

## Procedimento

```bash
# Nunca file:// — quebra ES modules por CORS.
python -m http.server 8000
```

Antes de editar, snapshot de referência no scratchpad
(`cp -r . "$SCRATCH/baseline-snapshot/"`). Sem Git, é a única forma de
comparar depois.

Capture **cada** item da lista abaixo em **claro e escuro**, antes e depois.

## Inventário de superfícies

| Superfície | O que observar |
|---|---|
| Navbar | pill de vidro, blur, divisor, link ativo, tooltip no hover e no `:focus-visible`, ícone sol/lua |
| Hero | malha WebGL (densidade, cor, dissolução na borda inferior), headline em 2 linhas, glifo alinhado ao texto |
| Sobre | foto + badge GitHub, 3 métricas, divisor, quebra para coluna abaixo de 60em |
| Habilidades | duas trilhas em sentidos opostos, loop **sem salto perceptível**, degradê nas bordas laterais |
| Projetos | 3 cards, cada ilustração animada (RFM, Dashboard, Fraude), badges, rodapé do card |
| Contato | grade de 4 cards, ícones, hover |
| Rodapé | heartbeat do coração, ícone de café estático |

## Pontos de maior risco

### Malha da Hero (WebGL)

A malha foi reescrita de Three.js para WebGL puro mantendo os shaders GLSL
**literalmente inalterados**. Se algo divergir visualmente, é da camada de
geometria/matrizes, não do shader. Compare com atenção:

- **densidade das linhas** — a malha tem diagonais, porque o `wireframe` da
  Three.js desenhava as 3 arestas de cada triângulo com deduplicação de
  arestas compartilhadas. Malha visivelmente mais densa ou mais esparsa =
  índices de linha errados;
- **ângulo e enquadramento** — a câmera olha para `-Z`, não para a origem;
- **cor por tema** — preto no claro, branco no escuro;
- **reveal inicial** — dissolve do centro para fora em ~2,5s;
- **rotação lenta** no eixo Z;
- **dissolução na borda inferior** (`mask-image`), sem corte reto.

### Loop do marquee

Um salto perceptível no ponto de emenda significa que a trilha deixou de
ter exatamente o dobro do conteúdo — provavelmente um card duplicado foi
removido ou adicionado só de um lado.

### Ilustrações dos cards — não seguem o tema

O **header** de cada card de Projetos é fixo claro; só o **corpo** é
theme-aware. Por isso a arte usa `--project-*` (fixo) e nunca `--color-*`.

Ao mexer nelas, capture nos dois temas e confirme que as linhas ficam
**idênticas**. Divergência = algum `--color-*` voltou a vazar para dentro
do SVG. Foi exatamente esse bug que deixou as linhas com ~1,09:1 no claro e
~3,05:1 no escuro.

Cuidado com opacidade animada: `.project-card__grid-line` roda
`project-grid-shimmer`, e **os keyframes vencem o `opacity` estático**
enquanto a animação toca. Mudar só a regra não muda nada na tela — mexa na
faixa dos keyframes em `utilities/animations.css`. O valor estático segue
valendo sob movimento reduzido.

### Tema

Alterar `base/tokens.css` afeta **a página inteira**. A navbar tem escala de
cor própria e **inverte** em relação à página. Verifique os dois conjuntos
de tokens, nos dois temas.

Com o tema seguindo o SO, teste as **quatro** combinações:

| SO | checkbox | esperado |
|---|---|---|
| claro | desmarcado | claro |
| claro | marcado | escuro |
| escuro | desmarcado | **escuro** |
| escuro | marcado | claro |

O ícone (sol/lua) precisa concordar com a página nas quatro. Simule o SO
pelo DevTools: *Rendering › Emulate CSS media feature prefers-color-scheme*.

## Estados que não podem ser esquecidos

Regressão costuma se esconder fora do estado de repouso:

- `:hover` em links da navbar, cards de projeto e de contato;
- `:focus-visible` por Tab — inclusive o `.skip-link`, que só aparece aí;
- movimento reduzido — a página vira outra composição: marquee em grade
  estática, ilustrações congeladas, malha em quadro único;
- as 6 larguras de viewport, verificando ausência de scroll horizontal.

## Aprovação

Só aprove com: nenhuma diferença visual não intencional em nenhuma
superfície, nos dois temas, com e sem movimento reduzido, e console limpo
(0 erros, 0 requisições 404).

Divergência encontrada? Reverta **apenas** o item responsável a partir do
snapshot. As mudanças foram feitas em diffs independentes justamente para
isso.
