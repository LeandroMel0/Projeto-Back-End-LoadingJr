import { sql } from "./app.js"
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Memoria {
    //Lista/Busca elementos
    async list(search = "", PostPerPage = 0, PagNunber = 0){
        let postagens

        //Pesquisa um elemento por id ou titulo
        if(search){
            //Verificador de UUID
            var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            //Verifica se foi fornecido um UUID
            var UUID = uuidRegex.test(search);
            
            //Aqui se fzz a busca por id
            if(UUID){
                postagens = await sql `select * from posts where uuid = ${search}`
            }//Aqui se a busca por titulo
            else{
                postagens = await sql `select * from posts where title ilike ${"%"+search+"%"}`
            }

        //Retona a lista paginada
        }else if(PagNunber > 0 && PostPerPage >0){
            //Calcula a quantidade de posts a serem ignorados
            const IgnoredPosts = (PagNunber - 1) * PostPerPage;

            //Calcula a quantidade de elementos da tabela
            let ElementCont = await sql `SELECT COUNT(*) AS post_count FROM posts`
            ElementCont = Array.from(ElementCont)[0].post_count

            if(ElementCont <= IgnoredPosts){
                //Retorna -1 se já estiver na ultima pagina
                return -1;
            }

            //Busca os dados no intervalo solicitado
            postagens = await sql `SELECT * FROM posts LIMIT ${PostPerPage} OFFSET ${IgnoredPosts};`

        //Impede o retorno da lista de todos os posts em caso de parametros negativos
        }else if(PagNunber < 0 || PostPerPage < 0){
            return -1;

        //Lista todos os elementos
        }else{
            //Aqui lista todos os posts
                postagens = await sql `select * from posts`
        }

        //Retorna o resultado desejado lista de todos os elementos ou lista paginada ou busca
        return postagens
    }

    //Cria um novo elemento
    async create(Postagem){
        
        //Recebe os dados
        const {uuid, title, description, post_date, att_date, post_type, post_by, att_by, imagem, imagem_File} = Postagem
        //Salva a imagem
        await this.saveImg(imagem_File,uuid);
        //Salva os dados no banco
        await sql `insert into posts (uuid,title,description,post_date,att_date,post_type,imagem,post_by,att_by) values (${uuid},${title},${description},${post_date},${att_date},${post_type},${imagem},${post_by},${att_by})`

    }

    //Atualiza um elemnto existente
    async update(id, Postagem){

        //Recebe os dados a serem atualizados
        var {title, description, att_date, post_type,imagem_File,imagem, att_by} = Postagem

        //Atualiza a imagem
        if(imagem_File){
            await this.deleteImg(id)
            await this.saveImg(imagem_File,id)
        
        //Impede a alteração indevida do campo imagem no banco de dados
        }else{
            var imagem = await sql `SELECT imagem FROM posts WHERE uuid = ${id}`
            imagem = Array.from(imagem)[0].imagem
        }

        //Atualiza os dados
        await sql `update posts set title = ${title}, description = ${description}, att_date = ${att_date}, att_by = ${att_by}, post_type = ${post_type}, imagem = ${imagem} WHERE uuid  = ${id}`
    }

    //Deleta um elemento por id
    async delete(id){
        //Deleta a imagem
        await this.deleteImg(id);
        //Deleta o post do banco de dados
        await sql `DELETE FROM posts WHERE uuid = ${id}`
    }

    //Função para deletar a imagem
    async deleteImg(id){
        try{
            //Verifica se o post tem imagem
            var HasImg = await sql `SELECT imagem FROM posts WHERE uuid = ${id}`
            HasImg = Array.from(HasImg)[0].imagem
            

            if(!HasImg){
                return
            }
            //Determina o caminho da imagem
            const caminhoArquivo = __dirname+"/Imagens/"+id+".png";

            //Deleta a imagem
            try{
                fs.unlink(caminhoArquivo, (err) => {
                    if (err) {
                    console.log('Erro ao deletar o arquivo');
                    }
                    });
                }catch{
                    console.log("Erro ao deletar a imagem")
                }
        }catch{
            console.log("Erro ao delatar a imagem")
        }
    }

    //Função para salvar a imagem
    async saveImg(imagem_file,id){

        //Verifica se foi enviada uma imagem e a salva
        if(imagem_file != null){
            await imagem_file.mv(__dirname+"/Imagens/"+id+".png");
        }
    }

    //Função para login
    async login(Username, Password){

        try{
          var UserDate = await sql `SELECT * FROM users WHERE username = ${Username}`
        }catch (error){
           console.log(error)
        }
        if(UserDate == ""){
            return -1
        }else if(await bcrypt.compare(Password , UserDate[0].password)){
            return true
        }else{
            return -2
        }
    }

    //Função para coletar dados do usuário
    async getUserDate(username){
        const retorno = (await sql`SELECT username, permission FROM users WHERE username = ${username}`)[0]
        return retorno
    }

    //Função para listar os usuários
    async ListUsers(){
        const retorno = await sql `SELECT username, permission FROM users`
        return retorno
    }

    //Função para editar usuário
    async updateUser(oldUsername,username,permission){
        if((await this.getUserDate(username))){
            await sql `update users set username=${username}, permission = ${permission} where username = ${oldUsername}`
        }else{
            return -1
        }

    }

    //Função para criar usuário
    async createUser(username,password,permission){

        //Gerando senha
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password,salt)


        if((await this.getUserDate(username))){
            return (-1)
        }else{
            if(permission){
               await sql `insert into users (username, password, permission) values (${username}, ${passwordHash}, ${permission})`
            }else{
               await sql `insert into users (username, password) values (${username}, ${passwordHash})`
            }
            return (true)
        }         

    }

    //Função para deletar usuário
    async deleteUser(username){
        try{
            if(await this.getUserDate(username)){
                await sql `delete from users where username = ${username}`
                return true
            }else{
                return -1
            }
        }catch{
            return
        }
    }

}