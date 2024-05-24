import { sql } from "./app.js"

sql `
CREATE TABLE posts (
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

`.then(() => {console.log("Tabela criada")})

//create table users (username VARCHAR(64) PRIMARY KEY NOT NULL, "password" VARCHAR(255) NOT NULL);