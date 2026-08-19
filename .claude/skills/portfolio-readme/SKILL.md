---
name: portfolio-readme
description: Escreve ou atualiza o README.md deste portfólio como vitrine profissional para recrutadores e desenvolvedores. Use ao criar o README do zero, depois de adicionar/alterar um projeto em destaque, mudar contato/links, ou quando o README divergir do que está realmente no index.html.
---

# Portfolio README

Um README de portfólio serve dois leitores ao mesmo tempo: quem decide em
20-30 segundos se vale a pena continuar lendo (recrutador, visitante) e quem
vai rodar o projeto localmente (outro dev). Otimize para o primeiro sem
mentir para o segundo.

## Regra fundamental: nada de inventado

Nunca escreva no README uma tecnologia, métrica, funcionalidade, link ou
screenshot que não exista de fato no código ou no site publicado. Antes de
escrever qualquer seção, confira contra a fonte real:

- **Conteúdo das seções (Sobre/Skills/Projetos/Contato):** leia
  `index.html` diretamente — não resuma de memória, os textos e métricas
  exibidos são literais (ex.: badges de status "Em desenvolvimento", métricas
  como "95% Precisão"). Se um card de projeto não tem link de repositório ou
  demo, **não invente um** — declare o status honestamente.
- **Estrutura/stack:** rode a skill `architecture-audit` (ou leia
  `documents/ARCHITECTURE.md`) antes de descrever a árvore de arquivos ou a
  arquitetura — o projeto já mudou de forma antes (ver histórico) e um README
  desatualizado é pior que nenhum.
- **Produção:** confira a URL publicada (WebFetch ou navegador) bate com o
  que o código descreve. Se divergir, o código é a fonte da verdade — investigue
  antes de documentar.
- **Screenshots:** só use imagem se ela existir de fato em `assets/images/`
  ou equivalente. Sem capacidade de gerar uma nesta sessão, prefira omitir a
  seção de preview a colocar um placeholder quebrado ou uma imagem que não é
  do site.

## Estrutura recomendada (adapte, não empilhe)

Nem toda seção abaixo é obrigatória — inclua só o que existe de verdade.
Ordem sugerida, vitrine primeiro, profundidade técnica depois:

1. Título + tagline curta + badges **verificáveis** (licença, hospedagem,
   "zero dependências" — nunca badge de build/coverage se não há CI real) +
   link de produção em destaque logo abaixo do título.
2. **Sobre o projeto** — 2-3 frases: o quê + para quem + stack principal.
   Sem keyword stuffing.
3. **Demonstração** — link de produção. Screenshot só se existir de fato.
4. **Projetos/funcionalidades em destaque** — o que está realmente no site,
   com status honesto (não fingir link "Ver projeto" que não existe).
5. **Skills/tecnologias demonstradas** — como aparecem no site, não uma
   lista genérica de currículo.
6. **Stack do site** — tecnologia → função, tabela curta.
7. **Estrutura do projeto** — árvore resumida, não listagem de cada arquivo.
8. **Rodando localmente** — comandos testados de verdade (sem `npm install`
   se não há `package.json`).
9. **Deploy** — resumo curto (workflow, branch, source). Detalhe extenso vai
   para `documents/ARCHITECTURE.md`, não duplicado aqui.
10. **Aprofundamento técnico** — parágrafo curto + link para
    `documents/ARCHITECTURE.md` e `documents/QA-CHECKLIST.md` em vez de
    reescrever o que já está lá. Duplicar as duas fontes é o erro mais comum
    ao atualizar este README — se for adicionar rationale profundo, pergunte
    primeiro se ele já não vive em `ARCHITECTURE.md`.
11. **Autor/Contato** — nome, e-mail, redes, currículo — só os que existem
    de fato na seção de contato do site.
12. **Licença**.

## Tom

Profissional, direto, sem excesso de emoji (um por seção no máximo, se
algum). Frases curtas. Nada de superlativo vazio ("incrível", "revolucionário")
— deixe os números e a demonstração falarem. O teste antes de publicar:
*"um recrutador entenderia o projeto e o autor em 20-30 segundos?"*

## Depois de escrever

- Confira cada link (mailto, redes, PDF, âncoras internas, produção) contra
  o `index.html`/repositório — não contra a memória do que "deveria" estar
  lá.
- Rode `frontend-quality` se a mudança for grande, para pegar o que uma
  auditoria de qualidade transversal capturaria e o README sozinho não.
- Releia a hierarquia de headings (`grep -n "^#" README.md`) — sem saltos de
  nível.
