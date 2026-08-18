# assets/images

| Arquivo | Uso | Dimensões | Peso |
| --- | --- | --- | ---: |
| `profile.jpg` | Foto da seção Sobre e imagem Open Graph | 640 × 853 | 48 KB |
| `profile-original.jpeg` | Original sem redimensionar — **não é referenciado pelo site** | 1200 × 1600 | 114 KB |

## Por que a foto tem 640px

Ela é exibida num círculo de no máximo **272 px**
(`.about__avatar`, `clamp(13rem, 24vw, 17rem)` em `components/about.css`).
640 px cobre telas 2x (544 px) com folga para 2,5x, sem carregar pixel que
ninguém vê.

O original de 1200 × 1600 pesava 114 KB — quase o dobro do `index.html`
comprimido, num site que transfere ~65 KB de HTML+CSS+JS somados.
Redimensionado para 640 px em qualidade 0,85, caiu para 48 KB (**−58%**),
sem perda visível: o rosto ocupa a maior parte do recorte circular e
continua nítido.

O Lighthouse ainda sugere ~36 KB de economia em `uses-responsive-images`,
porque calcula o necessário para **DPR 1** (272 px). Seguir isso ao pé da
letra deixaria a foto borrada em qualquer celular ou notebook moderno — é
otimização que piora o produto, e por isso foi recusada.

## Ao trocar a foto

1. Mantenha o nome `profile.jpg`, **em minúsculas**. O GitHub Pages roda em
   Linux, que é *case-sensitive*: um `P` maiúsculo funciona no Windows e
   quebra em produção.
2. Atualize `width` e `height` na `<img>` do `index.html` no mesmo commit.
   Hoje são `640` × `853`.
3. Mantenha o `profile-original.jpeg` (ou o seu próprio original) em algum
   lugar: gerar um `og-image.jpg` de boa qualidade no futuro exige uma
   fonte em alta resolução.

Sobre layout shift: `.about__avatar` força um quadrado nos dois eixos com
`object-fit: cover`, então o CSS ignora a proporção intrínseca e o CLS é 0
independentemente desses atributos. Eles continuam valendo como
documentação fiel do arquivo — e passam a importar de verdade se o CSS do
avatar mudar.

## Pendente — prévia social

A meta `og:image` ainda aponta para `profile.jpg`, que é **vertical**: ao
compartilhar o link no LinkedIn, no X ou no WhatsApp, a imagem é recortada.

O formato ideal é **1200 × 630 (horizontal)**. Ao criar um `og-image.jpg`
nesta pasta, aponte a meta `og:image` do `index.html` para ele — lembrando
que ali a URL é **absoluta**, não relativa (redes sociais leem a meta fora
do contexto do documento).
