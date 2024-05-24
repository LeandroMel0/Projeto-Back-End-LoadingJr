import express from 'express';
import fileUpload from 'express-fileupload';
import { Memoria } from "./databaseonline.js";
import { randomUUID } from "node:crypto"
import fs from 'fs/promises';

//Manipulação de data
import moment from 'moment';

//Para autenticação JWT
import 'dotenv/config'
import  JWT  from 'jsonwebtoken';


//Coletando endereço
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { hostname } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//SERVER!!!
const server = express();

//Habilitando recursos
server.use(express.json())
server.use(express.urlencoded({ extended: false }))
server.use(fileUpload())

//Criando instancia do acesso ao banco de dados
const database =  new Memoria();

//Porta do servidor 
const port = process.env.PORT || 3333;
server.listen({
    port: port
})

//### Middlewares
    //Middleware de autenticação JWT
    function CheckToken(request,reply,next){

        const HeaderAuth = request.headers['authorization']
        const Token = HeaderAuth && HeaderAuth.split(" ")[1]

        if(!Token){
            return reply.status(401).json({msg: "Acesso negado!"})
        }
        try{
            const secret =  process.env.SECRET
            JWT.verify(Token,secret)
            const {username, permission} = JWT.decode(Token,secret)
            request.requestUser =  username
            request.requestUserPermission = permission
            next();

        }catch{
            return reply.status(400).json({msg: "Token inválido!"})
        }
    }

    //Middleware para verificar permisão do tipo 1
    function CheckPermType1(request,reply,next){
        if(request.requestUserPermission == 0 || request.requestUserPermission == null){
            return reply.status(401).json({msg: "Acesso negado!"}) 
        }else{
            next()
        }
    }



//### ROTAS CRUD DOS POSTS DA API
    //Rota para criação de postagem 
    server.post('/CriarPostagem',CheckToken,CheckPermType1,async( request, reply) =>{
        try{
        //Recebe as variaveis do formulario
        const {title, description, post_type} = request.body
        //Verifica a validade das informações
        if(title == "" || description == "" || post_type == ""){
            return reply.status(422).send({msg: 'Informações obrigatorias não definidas'})
        }   
        
        //Função que cria a postagem
        const PostagemId = randomUUID();
        var HasImg = Boolean(false)
        var imagem = null;
        //Verifica se foi enviado um arquivo 
        if(request.files != null){
            //Verifica se o arquivo enviado é uma imagem
            if (!(/^image\//.test(request.files.imagem.mimetype))){
                return reply.status(422).send({msg:'O arquivo enviado não é uma imagem'})
            } 
            HasImg = Boolean(true)
            imagem = request.files.imagem
        }
    
        //Salva as informações no banco de dados
        await database.create({

            //parametros da postagem
            uuid: PostagemId,
            title: title, //title sort syntax
            description: description,
            post_date: GetDate(),
            att_date: GetDate(),
            post_type: post_type,
            imagem: HasImg,
            imagem_File: imagem,
            post_by: request.requestUser,
            att_by: request.requestUser,

        })
            
            //reposta da API
            return reply.status(200).json({msg: "Postagem criada com sucesso"})
        }catch (error){
            console.log(error)
            return reply.status(204).json({msg: "Erro ao criar o post"})
        }
    })

    //Rota para listar ou buscar postagens
    server.get('/postagens', async (request,reply) =>{
        try{
            //Parametros passados ou não pela url
            const search = request.query.search;
            const pagNumber = request.query.PagNumber;
            const postPerPage = request.query.PostPerPage;

            //lista as postagens
            const postagens = await database.list(search,postPerPage,pagNumber)
            
            //Em caso de erro no range da lista paginada
            if(postagens == -1){
                return reply.status(416).send({ msg: 'Intervalo de dados invalidos' })
            }
            reply.json(postagens)
            
        }catch{
            reply.send("Erro na busca")
        }
    })

    //Rota para editar uma postagem
    server.put('/EditarPostagem/:id',CheckToken,CheckPermType1,async (request,reply) =>{
        try{
            //recebe o id da postagem
            const postagemid = request.params.id
            //pega as informações da postagem
            const {title, description, post_type} = request.body
            //Verifica a validade informações
            if(title == "" || description == "" || post_type == ""){
                return reply.status(400).send({ msg: 'Informações obrigatorias não definidas' })
            }
            
            var imagem = null
            //Verifica se foi enviado um arquivo
            if(request.files != null){
                //Verifica se o arquivo enviado é uma imagem
                if (!(/^image\//.test(request.files.imagem.mimetype))){
                    return reply.status(400).send({msg: 'O arquivo enviado não é uma imagem'})
                }
                var imagem = request.files.imagem
                var HasImg = Boolean(true)

            }else{
            var HasImg = null;
            }
            //Atualiza as informações no banco de dados
            await database.update(postagemid,
                {
                    //parametros da postagem
                    title: title, //title sort syntax
                    description: description,
                    att_date: GetDate(),
                    post_type: post_type,
                    imagem_File: imagem,
                    imagem: HasImg,
                    att_by: request.requestUser,
                })
            return reply.status(201).json({msg: "Post enviado com sucesso!"})
        }catch (error){
            return reply.status(402).send({msg: 'Falha ao editar o post'})
        }

    })

    //Rota para deletar uma postagem
    server.delete('/DeletarPostagem/:id', CheckToken,CheckPermType1, async (request,reply) =>{
        try{
            //recebe o id da postagem
            const postagemid = request.params.id

            //Delata a postagem do banco de dados
            await database.delete(postagemid)

            return reply.status(204).send()
        }catch{
            reply.send({error: 'Falha ao deletar o post'})
            }

    })


//### Rotas de autentificação e gerenciamento de usuários

    //Rota de login
    server.post("/Login", async (request, reply)=>{
        try{

            //Recebe os valores do body
            var{username, password} = request.body
            username = username.toLowerCase();
            password = password.toLowerCase();

            if(username == "" || username == undefined || username == null){
                reply.status(400).json({msg: "Usuário invalido"})
            }
            if(password == "" || password == undefined || password == null){
                reply.status(400).json({msg: "Senha invalida"})
            }

            //Verifica as iformações no banco de dados
            const LoginTry = await database.login(username,password);
            if(LoginTry == -1){
                reply.status(400).json({msg: "Usuário não encontrado"})
            } else
            if(LoginTry == -2){
                reply.status(400).json({msg: "Senha incorreta"})
            } else
            if(LoginTry == true){
                const secret = process.env.SECRET
                const token  = JWT.sign(
                    {
                        username: username,
                        permission: (await (database.getUserDate(username))).permission

                    }, secret, {expiresIn: 30 *60}
                )
                reply.status(200).json({msg: "Autendicado com sucesso", token})
            }else{
                reply.status(301).json({msg: "Erro ao fazer login"})
            }
        }catch (error){
            console.log("Erro ao fazer login", error)
            reply.status(301).json({msg: "Erro ao tentar fazer login"})
        }

    })   

    //Rota pra registrar usuário
    server.post("/Registro", async (request, reply)=>{

        var {username,password,checkPassword} = request.body

        if(checkPassword!=password){
            return reply.status(401).json({msg: "As senhas não são iguais"})
        }
        if(username == "" || username == null || username == undefined){
            return reply.status(401).json({msg: "Nome de usuário invalido"})
        }
        if(password == "" || password == null || password == undefined){
            return reply.status(401).json({msg: "Senha invalida"})
        }

        username = username.toLowerCase();
        password = password.toLowerCase();

        try{
            const response = await database.createUser(username,password)

            if(response == -1){
                return reply.status(401).json({msg: "Nome de usuário em uso"})
            }
            if(response == true){
                return reply.status(200).json({msg: "Novo usuário criado"})
            }
        }catch{
            return reply.status(400).json({msg: "Erro ao cadastrar usuário"})
        }
    }) 

    //Rota para deletar um usuário
    server.delete("/DeleteUser/:username", CheckToken, async (request,reply)=>{

        //Recebe os parametros
        const deleteUser =  request.params.username.toLowerCase();
        const userperm =  request.requestUserPermission

        //Verufuca se o usuário tem permissão de admin
        if(userperm <=1){
            return reply.status(401).json({msg: "Acesso negado!"})
        }//Faz a requisição de delete no banco de dados
        else{
            const retorno = await database.deleteUser(deleteUser)
            if(retorno == -1){
                reply.status(400).json({msg: "Usuário não encontrado"})
            }else 
            if(retorno == true){
                reply.status(201).json({msg: "Deletado com sucesso"})
            }else{
                reply.status(400).json({msg: "Ocorreu um erro ao delatar o usuário"})
            }
        }

    })

    //rota para atualizar um usuário
    server.put("/UserUpdate/:username", CheckToken, async (request,reply)=>{

        //Recebe os parametros
        const updateUser =  request.params.username.toLowerCase();
        const userperm =  request.requestUserPermission

        const updateUserPerm = request.body.permission
        const updateUserNewUsername = request.body.username.toLowerCase();

        //Verifica as permições do usuário que está fazendo a requisição
        if(userperm <=1){
            return reply.status(401).json({msg: "Acesso negado!"})
        }else{
            try{
                const retorno = await database.updateUser(updateUser,updateUserNewUsername,updateUserPerm)
                if(retorno == -1){
                    return reply.status(401).json({msg: "Nome de usuário já ultilizado!"})
                }else{
                    return reply.status(201).json({msg: "Usuário atualizado com sucesso"})
                }
            }catch (error){
                console.log(error)
                return reply.status(401).json({msg: "Erro ao atualizar usuário"})
            }
        }

    })

    //Rota para listar os usuário 
    server.get("/ListUsers", CheckToken, async(request,reply)=>{

        const userperm =  request.requestUserPermission

        if(userperm != 2){
            return reply.status(401).json({msg: "Acesso negado!"})
        }else{

            const retorno =  (await database.ListUsers())
            return reply.json(retorno)
        }   

    })

    //Rota para buscar usuário
    server.get("/User/:username", CheckToken, async(request,reply)=>{

        const userperm =  request.requestUserPermission
        const searchUsername = request.params.username

        if(userperm != 2){
            return reply.status(401).json({msg: "Acesso negado!"})
        }else{

            const retorno =  (await database.getUserDate(searchUsername))
            return reply.json(retorno)
        }   

    })
    


//### ROTAS PARA A RETORNO DE PAGINAS OU ARQUIVOS

    //Rota para a pagina principal (index)
    server.get('/', function (request,reply){
        try{
            reply.sendFile(__dirname+"/FrontEnd/index.html")
 
        }catch (err){
            console.error(err)
            resizeBy.send("Erro na exibixão")
        }
    })

    //Rota para o formulario de criação/cadastro de posts
    server.get('/CadastrarPostagem', function (request,reply){
        try{
            reply.sendFile(__dirname+"/FrontEnd/CadastrarPostagem.html")
        } catch (err){
            console.error(err)
            reply.send("Erro na exibixão")
        }

    })

    //Rota para formulario de editar postagem
    server.get('/EditarPostagem', function (request,reply){
        try{
            reply.sendFile(__dirname+"/FrontEnd/UpdatePost.html")
        }catch{
            reply.send("Erro na exibixão")
        }
    })

    //Rota para formulario de editar usuário
    server.get("/UserUpdate?:username", (request, reply)=>{

        return reply.sendFile(__dirname+"/FrontEnd/UserUpdate.html")

    })
     
    //Rota para o formulario de login
    server.get("/Login", function (request,reply){

        reply.sendFile(__dirname+"/FrontEnd/Login.html")
    })

    //Rota para o formulario de registro
    server.get("/Registro", async (request, reply)=>{
        reply.sendFile(__dirname+"/FrontEnd/Registro.html")
    })

    //Rota para tabela de usuários
    server.get("/UsersTable", (request,reply)=>{

        reply.sendFile(__dirname+"/FrontEnd/UserTable.html")
    
    })

    //Retorna o arquivo css da pagina
    server.get('/style.css', function (request,reply){
        try{
            reply.sendFile(__dirname+"/FrontEnd/style.css")
        } catch (err){
            console.error(err)
            resizeBy.send("Erro ao fornecer arquivo style.css")
        }
    })

    //Retorna a imagem socicitada
    server.get('/imagens/:id', async function (request,reply){
        try{
            const imgid = (__dirname+`/Imagens/${request.params.id}`+".png");
            const HasImg = await CheckDirectory(imgid);
            if(HasImg == true){
                reply.sendFile(imgid)
            }else{
                reply.status(404).send({msg: "Imagem não encontrada"})
            }
        }catch{
            reply.status(401).json({msg: "Erro ao fornecer a imagem"})
        }
    })


//### FUNÇÕES 
    //Verifica se o diretorio da imagem é valido
    async function CheckDirectory(ImgDirect) {
        try {
            await fs.access(ImgDirect);
            return true;
        } catch (error) {
            return false;
        }
    }

    //Forma a data no formato DD/MM/YYYY HH:mm
    function GetDate(){

        // Obter a data atual
        const dataAtual = moment();

        // Formatar a data e hora
        const dataHoraFormatada = dataAtual.format('DD-MM-YYYY HH:mm');

        return dataHoraFormatada;

    }