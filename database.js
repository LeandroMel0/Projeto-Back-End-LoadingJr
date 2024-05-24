import { randomUUID } from "node:crypto"


export class Memoria {
    
    #postagens = new Map();

    list(){
      return Array.from(this.#postagens.entries()).map((PostagemArray)=>{
        const id = PostagemArray[0]
        const data = PostagemArray[1]

        return {
            id,
            ...data,
        }
      })
    }

    create(Postagem){
        const PostagemId = randomUUID();
        this.#postagens.set(PostagemId,Postagem)
    }

    update(id, Postagem){
        this.#postagens.set(id,Postagem)
    }

    delete(id){
        this.#postagens.delete(id)
    }

}