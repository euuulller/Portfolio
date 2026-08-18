# assets/js/vendor

Pasta reservada a bibliotecas de terceiros que fossem servidas pelo próprio
site, em vez de por CDN.

**Está vazia — e a intenção é que continue assim.**

## O projeto não tem dependências

Nenhuma requisição sai para outro domínio. Todo o comportamento do site é
HTML semântico, CSS moderno e JavaScript nativo em ES Modules.

Até a refatoração de agosto/2026 havia uma exceção: a malha 3D da Hero
rodava sobre **Three.js r128**, carregada do cdnjs. Os números que
motivaram a remoção:

| Recurso | Transferido (gzip) |
| --- | ---: |
| Three.js r128 | **149.872 B** |
| `index.html` | 33.979 B |
| CSS (18 arquivos) | 20.323 B |
| JS próprio | ~5.000 B |

A biblioteca custava **mais que o dobro do site inteiro somado** — para
desenhar um plano em wireframe atrás de um título. Do pacote, o módulo usava
oito primitivas (`Scene`, `PerspectiveCamera`, `WebGLRenderer`,
`ShaderMaterial`, `Mesh`, `PlaneGeometry`, `Color`, `Clock`), e os shaders
GLSL já eram escritos à mão.

Hoje `assets/js/modules/mesh-background.js` é WebGL puro, com **os mesmos
shaders**, em ~200 linhas. Além do peso, a mudança eliminou uma origem
terceira sem `integrity` do caminho crítico.

## Antes de colocar qualquer coisa aqui

A regra do projeto é **HTML → CSS → Web API → JavaScript**, e só então
biblioteca. Uma dependência nova precisa demonstrar que o requisito não é
alcançável com a plataforma nativa — e vir com o custo medido em bytes
comprimidos.

Se algum dia isso se justificar: sirva o arquivo **daqui**, nunca de CDN
(peso, privacidade, CORS e um ponto de falha fora do seu controle). O
`.gitattributes` já marca esta pasta como `linguist-vendored`, para não
contar nas estatísticas de linguagem do GitHub.
