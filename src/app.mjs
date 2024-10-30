import express from "express";
import path from "path";
import dotenv from "dotenv";
import mysql from "mysql2";

dotenv.config();
const db = mysql.createPool(process.env.CONNECTION_STRING);

const app = express();
app.use(express.json());

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));

//=====================================================================================================
//CRUD CLIENTES

// Rota para carregar os clientes
app.get('/clientes', (req, res) => {
  const query = `
    SELECT 
      c.id_cliente,
      c.nome_completo, 
      c.telefone, 
      c.email, 
      c.ultimo_contato, 
      GROUP_CONCAT(cat.id_categoria, '|', cat.nome_categoria) AS categorias
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

// Rota para criar um novo cliente
app.post('/clientes', (req, res) => {
  const { nome_completo, telefone, email } = req.body;
  const query = 'INSERT INTO cliente (nome_completo, telefone, email) VALUES (?, ?, ?)';
  db.query(query, [nome_completo, telefone, email], (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.status(201).json({ id_cliente: results.insertId, nome_completo, telefone, email });
  });
});

// Rota para atualizar um cliente
app.put('/clientes/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;
  const { nome_completo, telefone, email } = req.body;
  const query = 'UPDATE cliente SET nome_completo = ?, telefone = ?, email = ? WHERE id_cliente = ?';
  db.query(query, [nome_completo, telefone, email, id_cliente], (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.status(200).json({ message: 'Cliente atualizado com sucesso!' });
  });
});

// Rota para excluir um cliente
app.delete('/clientes/:id_cliente', (req, res) => {
  const { id_cliente } = req.params;
  const query = 'DELETE FROM cliente WHERE id_cliente = ?';
  db.query(query, [id_cliente], (err, results) => {
      if (err) {
          return res.status(500).send(err);
      }
      res.status(200).json({ message: 'Cliente removido com sucesso!' });
  });
});



// Rota para listar todas as tags
app.get("/tags", (req, res) => {
  const query = "SELECT * FROM categoria";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

// Rota para adicionar uma nova tag
app.post("/tags", (req, res) => {
  const { nome_categoria } = req.body;
  const query = "INSERT INTO categoria (nome_categoria) VALUES (?)";
  db.query(query, [nome_categoria], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).json({ id_categoria: results.insertId, nome_categoria });
  });
});


// Rota para desatribuir uma tag de um cliente
app.delete("/clientes/:clienteId/tags/:tagId", (req, res) => {
  const { clienteId, tagId } = req.params;
  const query = `
      DELETE FROM cliente_categoria 
      WHERE id_cliente = ? AND id_categoria = ?;
    `;

  db.query(query, [clienteId, tagId], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send("Tag removida com sucesso.");
  });
});

// Rota para atribuir uma tag a um cliente
app.post("/clientes/:id_cliente/tags", (req, res) => {
  const { id_cliente } = req.params;
  const { id_categoria } = req.body; // Espera o ID da categoria a ser associada
  const query = 'INSERT IGNORE INTO cliente_categoria (id_cliente, id_categoria) VALUES (?, ?)';
  db.query(query, [id_cliente, id_categoria], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).json({ message: "Tag atribuída com sucesso!" });
  });
});




// Rota para listar todos os templates de mensagem
app.get('/mensagens', (req, res) => {
  const query = 'SELECT * FROM mensagem';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

// Rota para criar uma nova mensagem 
app.post('/mensagens', (req, res) => {
  const { titulo, corpo } = req.body;
  const query = 'INSERT INTO mensagem (titulo, corpo) VALUES (?, ?)';
  db.query(query, [titulo, corpo], (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).json({ id_mensagem: results.insertId, titulo, corpo });
  });
});

// Rota para enviar mensagens para os clientes selecionados
app.post('/mensagens/enviar', async (req, res) => {
  const { clientes, templateId } = req.body;

  try {
    const mensagemQuery = 'SELECT * FROM mensagem WHERE id_mensagem = ?';
    const [template] = await db.promise().query(mensagemQuery, [templateId]);

    const envioPromises = clientes.map(clienteId => {
      const query = 'INSERT INTO envio_mensagem (id_cliente, id_mensagem, data_envio) VALUES (?, ?, CURDATE())';
      return db.promise().query(query, [clienteId, templateId]);
    });

    await Promise.all(envioPromises);
    res.status(200).send("Mensagens enviadas com sucesso!");
  } catch (error) {
    return res.status(500).send(err);
  }
});




//Paginas
app.get("/", (request, response, next) => {
  const page = path.join(path.resolve(), "public", "views", "index.html");
  response.sendFile(page);
});

app.listen(process.env.PORT, () => console.log("Rodando!"));
