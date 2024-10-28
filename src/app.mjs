import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import mysql from "mysql2"

dotenv.config()
const db = mysql.createPool(process.env.CONNECTION_STRING)

const app = express()
app.use(express.json())

app.use(express.static(path.join(path.resolve(), 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/clientes', (req, res) => {
    const query = `
      SELECT 
        c.id_cliente,
        c.nome_completo, 
        c.telefone, 
        c.email, 
        c.ultimo_contato, 
        GROUP_CONCAT(cat.nome_categoria) AS categorias
      FROM 
        cliente c
      LEFT JOIN 
        cliente_categoria cc ON c.id_cliente = cc.id_cliente
      LEFT JOIN 
        categoria cat ON cc.id_categoria = cat.id_categoria
      GROUP BY 
        c.id_cliente;
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).send(err);
      }
      res.json(results);
    });
  });


// Rota para listar todas as tags
app.get('/tags', (req, res) => {
  const query = 'SELECT * FROM categoria';
  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.json(results);
  });
});

// Rota para adicionar uma nova tag
app.post('/tags', (req, res) => {
  const { nome_categoria } = req.body;
  const query = 'INSERT INTO categoria (nome_categoria) VALUES (?)';
  db.query(query, [nome_categoria], (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.status(201).json({ id_categoria: results.insertId, nome_categoria });
  });
});

// Rota para atribuir uma tag a um cliente
app.post('/clientes/:id_cliente/tags', (req, res) => {
  const { id_cliente } = req.params;
  const { id_categoria } = req.body; // Espera o ID da categoria a ser associada
  const query = 'INSERT INTO cliente_categoria (id_cliente, id_categoria) VALUES (?, ?)';
  db.query(query, [id_cliente, id_categoria], (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.status(201).json({ message: 'Tag atribuída com sucesso!' });
  });
});

//Paginas
app.get("/", (request, response, next) => {
    const page = path.join(path.resolve(), 'public', 'views' ,'index.html')
    response.sendFile(page)
});

app.listen(process.env.PORT, () =>(
    console.log('Rodando!')
));