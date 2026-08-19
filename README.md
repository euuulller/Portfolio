# Euller Duarte — Portfólio de Data Analyst

Site pessoal de página única para apresentar projetos de análise de dados,
dashboards de BI e modelos preditivos. Estático, sem framework e sem etapa
de build — o que está no repositório é exatamente o que vai para o ar.

[![Licença](https://img.shields.io/github/license/euuulller/Portfolio?color=blue)](LICENSE)
[![Deploy](https://img.shields.io/github/deployments/euuulller/Portfolio/github-pages?label=deploy)](https://github.com/euuulller/Portfolio/deployments)
![Dependências](https://img.shields.io/badge/depend%C3%AAncias-0-brightgreen)

**🔗 Produção:** **<https://euuulller.github.io/Portfolio/>**

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Demonstração](#demonstração)
- [Projetos em destaque](#projetos-em-destaque)
- [Habilidades demonstradas](#habilidades-demonstradas)
- [Stack do site](#stack-do-site)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Rodando localmente](#rodando-localmente)
- [Deploy](#deploy)
- [Aprofundamento técnico](#aprofundamento-técnico)
- [Autor](#autor)
- [Licença](#licença)

---

## Sobre o projeto

Um portfólio de página única construído para carregar rápido e funcionar em
qualquer dispositivo sem depender de bibliotecas externas: HTML semântico,
CSS modular com tokens de design e três módulos de JavaScript nativo (ES
Modules), incluindo uma malha 3D em WebGL puro na Hero. Publicado via GitHub
Actions no GitHub Pages.

## Demonstração

A versão publicada é a fonte da verdade — não há build separado entre o que
está aqui e o que está no ar:

**<https://euuulller.github.io/Portfolio/>**

## Projetos em destaque

Estudos de caso apresentados na seção **Projetos** do site, todos marcados
como **em desenvolvimento**:

| Projeto | Categoria | Stack | Destaques |
| --- | --- | --- | --- |
| **Segmentação de Clientes (RFM)** — análise de clusterização para classificar clientes por Recência, Frequência e Valor Monetário | Analytics | Python · Pandas · Power BI | 1.5k registros · 5 segmentos |
| **Dashboard de Vendas** — painel interativo para KPIs de vendas, análise geográfica e tendências mensais | Dashboards | Power BI · Excel · PostgreSQL | KPIs em tempo real |
| **Detecção de Fraudes (ML)** — modelo de Machine Learning para identificar transações fraudulentas | Machine Learning | Python · NumPy · Jupyter | 95% de precisão · 2% de falsos positivos |

## Habilidades demonstradas

As 18 ferramentas exibidas na seção **Habilidades** do site:

| Área | Ferramentas |
| --- | --- |
| Análise de dados | Python, Pandas, NumPy, Matplotlib, Jupyter |
| Banco de dados | PostgreSQL |
| Visualização e relatórios | Power BI, Excel |
| Desenvolvimento | HTML, CSS, Git, GitHub, Docker, VSCode, Figma, LaTeX, UV |
| Assistência de IA | Claude |

## Stack do site

| Camada | Escolha | Por quê |
| --- | --- | --- |
| Marcação | HTML5 semântico | Landmarks reais (`header`/`main`/`section`/`footer`), sem `div` genérica onde existe elemento próprio. |
| Estilo | CSS puro, tokens em custom properties | `var()`, `clamp()` e `:has()` cobrem o que se usaria de Sass, nativamente e sem build. |
| Script | JavaScript ES Modules | Escopo isolado, modo estrito e execução adiada de graça, sem bundler. |
| Tipografia | Pilha de fontes do sistema | Zero requisição de fonte, zero *layout shift* por troca de fonte. |
| 3D | WebGL puro (sem biblioteca) | A malha do Hero é ~200 linhas de WebGL com shaders próprios. |
| Hospedagem | GitHub Pages | Estático, gratuito, HTTPS e HTTP/2. |

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
│   ├── js/
│   │   ├── main.js               # ponto de entrada
│   │   ├── modules/               # scroll-spy, reduced-motion, mesh-background
│   │   └── utils/                 # utilitário compartilhado (detecção de movimento reduzido)
│   ├── icons/                    # favicon SVG + PNGs (iOS e PWA)
│   ├── images/                   # foto de perfil
│   └── documents/                # currículo em PDF
│
└── .github/workflows/deploy.yml  # publicação automática
```

## Rodando localmente

Não há `package.json` nem etapa de build — o site é servido como está. Os
módulos ES exigem HTTP (abrir `index.html` direto do disco falha por
CORS), então suba um servidor estático na raiz:

```bash
git clone git@github.com:euuulller/Portfolio.git
cd Portfolio
python3 -m http.server 8000
# ou: npx serve .
```

Depois acesse <http://localhost:8000>.

## Deploy

`.github/workflows/deploy.yml` publica automaticamente a cada push na
branch `main`: empacota a raiz do repositório (sem instalar dependências
nem gerar artefato intermediário) e sobe via `actions/deploy-pages`.
Pré-requisito no repositório: **Settings › Pages › Source = "GitHub
Actions"**.

## Aprofundamento técnico

Este README cobre a vitrine; o raciocínio de engenharia completo —
arquitetura CSS/JS por camadas, decisões de acessibilidade, remoção da
dependência de Three.js, o porquê da ordem dos 18 `<link>` de CSS no
`<head>` — está documentado separadamente para não duplicar conteúdo:

- [`documents/ARCHITECTURE.md`](documents/ARCHITECTURE.md) — arquitetura e decisões técnicas.
- [`documents/QA-CHECKLIST.md`](documents/QA-CHECKLIST.md) — resultados medidos de auditoria (performance, acessibilidade, responsividade, segurança).

## Autor

**Euller dos Santos Rodrigues Duarte** — graduando em Engenharia Elétrica
pelo Instituto Federal do Maranhão (IFMA), direcionando a formação para
Análise de Dados e Business Intelligence.

- 📧 [euller.santos.duarte@gmail.com](mailto:euller.santos.duarte@gmail.com)
- 💼 [LinkedIn](https://www.linkedin.com/in/eullerduarte/)
- 🐙 [GitHub](https://github.com/euuulller)
- ✍️ [Medium](https://medium.com/@euuulller)
- 📄 [Currículo (PDF)](assets/documents/curriculo-euller-duarte.pdf)

## Licença

[MIT](LICENSE) para o código deste repositório. Ícones de terceiros, marcas,
foto pessoal e currículo têm condições próprias — listadas no fim do
arquivo `LICENSE`.
