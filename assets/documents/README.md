# assets/documents

| Arquivo | Uso | Peso |
| --- | --- | ---: |
| `curriculo-euller-duarte.pdf` | Botão de currículo na navbar | 84 KB |

O link usa `download` + `target="_blank"`: o navegador baixa o arquivo sem
tirar o visitante da página.

## Ao trocar o PDF

Mantenha **exatamente** o mesmo nome de arquivo — ou atualize o `href` no
`index.html` no mesmo commit.

Nome todo em minúsculas, com hífens: o GitHub Pages roda em Linux, que é
*case-sensitive*. Um arquivo salvo como `Curriculo.pdf` funciona no Windows
e retorna 404 em produção.
