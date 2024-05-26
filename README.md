# API de Postagens

Esta é uma API para gerenciamento de postagens, desenvolvida com Node.js e Express. A API permite a criação, leitura, atualização e exclusão de postagens, e também a autenticação e gerenciamento dos usuários.

## Tecnologias Utilizadas

- **Node.js**
- **Express**
- **JWT**: para autenticação
- **Moment.js**: para manipulação de datas
- **dotenv**: para gerenciamento de variáveis de ambiente
- **express-fileupload**: para upload de arquivos

## Funcionalidades

- **CRUD de Postagens**: Criação, leitura, atualização e exclusão de postagens
- **Upload de Imagens**: Permite anexar imagens às postagens
- **Autenticação de Usuários**: Utiliza JWT para autenticação
- **CRUD de Usuários**: Registro, leitura, atualização e exclusão de usuários
  
## Imagem
- **Pontos relevantes em relação as imagens**: É importante destacar que as imagens não ficam propriamente salvas no banco de dados, este guarda apenas a informação se a imagem existe ou não. Optei por deixar as imagens salvas na pasta "Imagens". O arquivo pode ser acessado por meio da rota "/imagens/{id}", onde id é o UUID do post. O arquivo tem seu nome definido como "UUID.png", onde UUID é o UUID da postagem.

## Autentificação

- **Token JWT**: O servidor retorna um token qunado o request de login é bem sucedido. O token guarda as informações do nome do usuário e o nivel permissão.
- **Nivel de permissão**: Existem 3 níveis de permissão, que são representados e guardados como inteiros [0, 1, 2], os quais são respectivamente User, Writer e Admin. Usuários não têm nenhuma vantagem real podendo acessar as rotas GET como usuários sem token algum, Writers podem utilizar as rotas de edição, criação e deleção de postagens. Os administradores podem acessar todas as rotas da API. Ar rotas GET de listagem e busca de usuários são restritas ao grupo Admin. 

## Banco de dados
### Postagens
- **uuid**: Armazena o UUID da postagem, gerado pela API.
- **title**: Armazena o tirulo da postagem, dado pelo Usuário.
- **description**: Armazena a descrição da postagem, dado pelo Usuário.
- **post_date**: Armazena a data que a postagem foi criada, gerado pela API.
- **att_date**: Armazena a data que a postagem foi atualizada, gerado pela API.
- **att_by**: Armazena o usuário que atualizou a postagem.
- **post_by**: Armazena o isuário que fez a postagem
- **post_type**: Armazena o tipo do post
- **imagem**: Armazena a informação se a postagem tem imagem.
#### Código
-  CREATE TABLE posts (  
    uuid VARCHAR(64) PRIMARY KEY,  
    title VARCHAR(255) NOT NULL,  
    description TEXT,  
    post_date VARCHAR(32),  
    att_date VARCHAR(32),  
    att_by VARCHAR(50),  
    post_by VARCHAR(50),  
    post_type VARCHAR(50) CHECK (post_type IN ('Edital', 'Notícia', 'Divulgação')),  
    imagem BOOLEAN  
);

### Usuários
- **username**: Armazena o nome do usuário
- **password**: Armazena a senha do usuário
- **permission**> Armazena a permissão do usuário

#### Código
- CREATE TABLE users (  
    username VARCHAR(64) PRIMARY KEY NOT NULL,  
    "password" VARCHAR(255) NOT NULL,  
    "permission" int default 0 NOT NULL CHECK (permission IN (0, 1, 2))  
);

## Endpoints
### Documentação Swaggerhub das principais rotas
- https://app.swaggerhub.com/apis-docs/LeandroMelo/Projeto-BackEnd-LoadingJr/1.0
### Autenticação e Gerenciamento de Usuários

- **Registro de Usuário**
  - **URL**: `/Registro`
  - **Método**: `POST`
  - **Descrição**: Registra um novo usuário.

- **Login**
  - **URL**: `/Login`
  - **Método**: `POST`
  - **Descrição**: Faz login de um usuário.


- **Deletar Usuário**
  - **URL**: `/DeleteUser/:username`
  - **Método**: `DELETE`
  - **Descrição**: Deleta um usuário.
  - **Requer Autenticação**: Sim
  - **Permissão**: Admin

- **Atualizar Usuário**
  - **URL**: `/UserUpdate/:username`
  - **Método**: `PUT`
  - **Descrição**: Atualiza os dados de um usuário.
  - **Requer Autenticação**: Sim
  - **Permissão**: Admin

- **Listar Usuários**
  - **URL**: `/ListUsers`
  - **Método**: `GET`
  - **Descrição**: Lista todos os usuários.
  - **Requer Autenticação**: Sim
  - **Permissão**: Admin

### CRUD de Postagens

- **Criar Postagem**
  - **URL**: `/CriarPostagem`
  - **Método**: `POST`
  - **Descrição**: Cria uma nova postagem.
  - **Requer Autenticação**: Sim
  - **Permissão**: Writer ou superior

- **Listar Postagens**
  - **URL**: `/postagens`
  - **Método**: `GET`
  - **Descrição**: Lista todas as postagens.


- **Editar Postagem**
  - **URL**: `/EditarPostagem/:id`
  - **Método**: `PUT`
  - **Descrição**: Edita uma postagem existente.
  - **Requer Autenticação**: Sim
  - **Permissão**: Writer ou superior

- **Deletar Postagem**
  - **URL**: `/DeletarPostagem/:id`
  - **Método**: `DELETE`
  - **Descrição**: Deleta uma postagem.
  - **Requer Autenticação**: Sim
  - **Permissão**: Writer ou superior

### Rotas de Páginas e Arquivos

- **Página Principal**
  - **URL**: `/`
  - **Método**: `GET`
  - **Descrição**: Retorna a página principal.

- **Formulário de Criação de Postagem**
  - **URL**: `/CadastrarPostagem`
  - **Método**: `GET`
  - **Descrição**: Retorna o formulário de criação de postagem.

- **Formulário de Edição de Postagem**
  - **URL**: `/EditarPostagem`
  - **Método**: `GET`
  - **Descrição**: Retorna o formulário de edição de postagem.

- **Formulário de Login**
  - **URL**: `/Login`
  - **Método**: `GET`
  - **Descrição**: Retorna o formulário de login.

- **Formulário de Registro**
  - **URL**: `/Registro`
  - **Método**: `GET`
  - **Descrição**: Retorna o formulário de registro.

- **Tabela de Usuários**
  - **URL**: `/UsersTable`
  - **Método**: `GET`
  - **Descrição**: Retorna a tabela de usuários.

- **Arquivo CSS**
  - **URL**: `/style.css`
  - **Método**: `GET`
  - **Descrição**: Retorna o arquivo CSS.

- **Imagens**
  - **URL**: `/imagens/:id`
  - **Método**: `GET`
  - **Descrição**: Retorna uma imagem pelo ID.

## Middlewares

- **Autenticação JWT**
  - **Descrição**: Verifica se o token JWT é válido.
  - **Uso**: Adicione `CheckToken` como middleware nas rotas que requerem autenticação.

- **Verificação de Permissão**
  - **Descrição**: Verifica se o usuário tem permissão do tipo 1.
  - **Uso**: Adicione `CheckPermType1` como middleware nas rotas que requerem permissão de tipo 1.

## Funções Utilitárias

- **CheckDirectory**
  - **Descrição**: Verifica se um diretório é válido.
  - **Uso**: `await CheckDirectory(ImgDirect)`

- **GetDate**
  - **Descrição**: Retorna a data atual formatada como DD-MM-YYYY HH:mm.
  - **Uso**: `GetDate()`
