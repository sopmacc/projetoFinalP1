# Projeto prático: Login e Galeria de Fotos

Desenvolvimento Web III | Fatec Franco da Rocha

SPA em HTML, CSS e JavaScript puro (com Bootstrap 5 via CDN). Consome duas APIs da JSONPlaceholder:

- `https://jsonplaceholder.typicode.com/users` (login)
- `https://jsonplaceholder.typicode.com/photos` (galeria)

## Como executar

1. Baixe ou clone a pasta do projeto.
2. Abra o arquivo `index.html` no navegador (duplo clique) ou use uma extensão como Live Server no VS Code.
3. É preciso ter conexão com a internet.

## Dados de teste

- Usuário: `Bret`
- Senha: `Sincere@april.biz`

O campo `email` da API é usado como senha apenas para fins didáticos. A JSONPlaceholder não tem autenticação real, e esse mecanismo não deve ser usado em produção.

## Fluxo

Login → Lista de fotos (título + miniatura 32 × 32) → Clique → Foto ampliada com título → Voltar à lista.

## Estrutura

- `index.html`: contêiner da SPA e carregamento dos scripts
- `style.css`: estilos
- `app.js`: rotas (`#/login`, `#/galeria`, `#/foto/:id`), login, lista e visualização

## Observações

- A lista mostra 50 fotos por vez, com botão "Carregar mais".
- A sessão fica no `sessionStorage`; o botão "Sair" volta ao login.
- Rotas da galeria são protegidas: sem login, o acesso redireciona para a tela de login.
- Se o serviço de imagens usado pela API estiver fora do ar, a aplicação mostra um quadrado colorido no lugar da imagem.

## Integrante(s)

- Nome completo: ______________________
