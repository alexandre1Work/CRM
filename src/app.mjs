import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import auth from "./middlewares/auth.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bodyParser = require("body-parser");
const gClient = require("../public/assets/js/gzappy.js");
//Models
import Usuario from "./models/UsuarioModel.js";
import Cliente from "./models/ClienteModel.js";
import Mensagem from "./models/MensagemModel.js";
import Tag from "./models/TagModel.js";
import dataAtual from "./functions/date.js";

dotenv.config();
const app = express();

// Express Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));

//Inicialização
mongoose
  .connect(`${process.env.CONNECTION_STRING}`)
  .then(() => {
    app.listen(process.env.PORT);
    console.log("Server rodando: http://localhost:3000");
  })
  .catch((err) => console.log(err));

// Rota para registro de usuário
app.post("/auth/registro", async (req, res) => {
  const { name, email, password, confirmpassword } = req.body;

  // Checagem de campo vazio
  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório!" });
  }
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }
  if (password !== confirmpassword) {
    return res.status(422).json({ msg: "As senhas não coincidem!" });
  }

  //Checagem de usuário existente
  const usuarioExiste = await Usuario.findOne({ email: email });
  if (usuarioExiste) {
    return res.status(422).json({ msg: "Email Já cadastrado!" });
  }

  //Criar senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //Criar Usuario
  const usuario = new Usuario({
    name,
    email,
    password: passwordHash,
  });
  try {
    await usuario.save();
    res.status(201).json({ msg: "Usuário criado!" }).redirect("/login");
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Deu pau no BD" });
  }
});

// Rota para login do usuário
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // Checagem de campo vazio
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" });
  }

  //Checar se o usuário existe
  const usuario = await Usuario.findOne({ email: email });
  if (!usuario) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  //Checar se a senha está correta
  const checkpassword = bcrypt.compare(password, usuario.password);
  if (!checkpassword) {
    return res.status(422).json({ msg: "Senha inválida!" });
  }

  try {
    const token = jwt.sign(
      {
        id: usuario._id,
      },
      process.env.SECRET
    );
    res.status(200).json({ msg: "Autenticação realizada", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Deu pau no BD" });
  }
});

// Rota para obter todos os clientes do usuario logado
app.get("/clientes", auth.checkToken, async (req, res) => {
  const usuarioLogado = req.userId;
  const clientes = await Cliente.find({ usuario: usuarioLogado }).populate("tags");
  res.json(clientes);
});

// Rota para obter os dados de um cliente específico
app.get("/clientes/:id_cliente", auth.checkToken, async (req, res) => {
  const cliente = await Cliente.findById(req.params.id_cliente);
  res.json(cliente);
});

// Rota para criar um novo cliente
app.post("/clientes", auth.checkToken, async (req, res) => {
  const { nome, telefone, email } = req.body;
  const ultimo_contato = dataAtual();
  const usuario = req.userId;

  const cliente = new Cliente({
    nome,
    telefone,
    email,
    ultimo_contato,
    usuario,
  });
  try {
    await cliente.save();
    res.status(201).json({ msg: "Usuário criado!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Deu pau no BD" });
  }
});

// Rota para atualizar um cliente
app.put("/clientes/:id_cliente", auth.checkToken, async (req, res) => {
  const id_cliente = req.params.id_cliente;
  const { nome, telefone, email } = req.body;
  const ultimo_contato = dataAtual();
  const usuario = req.userId;

  try {
    await Cliente.findByIdAndUpdate(id_cliente, {
      nome: nome,
      telefone: telefone,
      email: email,
      ultimo_contato: ultimo_contato,
      usuario: usuario,
    });
    res.status(201).json({ msg: "Cliente editado com sucesso!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Algo deu errado na edição do cliente!" });
  }
});

// Rota para excluir um cliente
app.delete("/clientes/:id_cliente", auth.checkToken, async (req, res) => {
  const id_cliente = req.params.id_cliente;
  try {
    await Cliente.findByIdAndDelete(id_cliente);
    res.status(201).json({ msg: "Cliente deletado com sucesso!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Não foi possivel deletar o cliente!" });
  }
});

// Rota para listar todas as tags
app.get("/tags", auth.checkToken, async (req, res) => {
  const usuarioLogado = req.userId;
  const tags = await Tag.find({ usuario: usuarioLogado });

  res.json(tags);
});

// Rota para criar uma nova tag
app.post("/tags", auth.checkToken, async (req, res) => {
  const nome_tag = req.body.nome_tag;
  const usuario = req.userId;

  const tag = new Tag({
    nome_tag,
    usuario,
  });
  try {
    await tag.save();
    res.status(201).json({ msg: "Tag criada com sucesso!" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Falha ao criar a tag!" });
  }
});

// Rota para desatribuir uma tag de um cliente
app.delete("/tag/:clienteId/:tagId", auth.checkToken, async (req, res) => {
  const { clienteId, tagId } = req.params;

  try {
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) return res.status(404).send("Cliente não encontrado.");

    cliente.tags = cliente.tags.filter((tag) => tag.toString() !== tagId);
    await cliente.save();

    res.status(200).send("Tag removida com sucesso!");
  } catch (error) {
    console.error("Erro ao remover tag:", error);
    res.status(500).send("Erro ao remover tag.");
  }
});

// Rota para atribuir uma tag a um cliente
app.post("/tag/:clienteId", auth.checkToken, async (req, res) => {
  const { clienteId } = req.params;
  const { tagId } = req.body;

  try {
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) return res.status(404).send("Cliente não encontrado.");

    if (cliente.tags.includes(tagId)) {
      return res.status(409).send("Tag já atribuída ao cliente.");
    }

    cliente.tags.push(tagId);
    await cliente.save();
    res.status(200).send("Tag atribuída com sucesso!");
  } catch (error) {
    console.error("Erro ao atribuir tag:", error);
    res.status(500).send("Erro ao atribuir tag.");
  }
});

// Rota para listar todos os templates de mensagem
app.get("/mensagens", auth.checkToken, async (req, res) => {
  const usuarioLogado = req.userId;
  try {
    const mensagens = await Mensagem.find({ usuario: usuarioLogado });
    res.status(200).json(mensagens);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Erro ao buscar as mensagens!" });
  }
});

// Rota para criar uma nova mensagem
app.post("/mensagens", auth.checkToken, async (req, res) => {
  const usuario = req.userId;
  try {
    const { titulo, corpo } = req.body;
    const mensagem = new Mensagem({
      titulo,
      corpo,
      usuario,
    });
    await mensagem.save();
    res.status(200).json({ msg: "Template criado com sucesso!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Erro ao criar a mensagem!" });
  }
});

// Rota para enviar mensagens para os clientes selecionados
app.post("/mensagens/enviar", auth.checkToken, async (req, res) => {
  const { mensagemId, clientesIds } = req.body;

  try {
    // Busca o template da mensagem
    const mensagem = await Mensagem.findById(mensagemId);
    if (!mensagem) {
      return res.status(404).send("Template de mensagem não encontrado.");
    }

    // Busca os clientes selecionados
    const clientes = await Cliente.find({ _id: { $in: clientesIds } }).select("telefone nome");
    if (!clientes.length) {
      return res.status(404).send("Nenhum cliente válido encontrado.");
    }

    // Lista de telefones no formato necessário
    const telefones = clientes.map((cliente) => cliente.telefone);

    // Envia a mensagem pelo Gzappy
    await gClient.sendMessage([mensagem.corpo], telefones);

    const ultimo_contato = dataAtual();
    await Cliente.updateMany({ _id: { $in: clientesIds } }, { $set: { ultimo_contato } });
    res.status(200).send("Mensagens enviadas com sucesso.");
  } catch (error) {
    console.error("Erro ao enviar mensagens:", error);
    res.status(500).send("Erro ao processar o envio de mensagens.");
  }
});
//Atualiza o ultimo contato dos clientes

//Paginas
app.get("/dashboard", (request, response, next) => {
  const page = path.join(path.resolve(), "public", "views", "index.html");
  response.sendFile(page);
});
app.get("/", (request, response, next) => {
  const page = path.join(path.resolve(), "public", "views", "login.html");
  response.sendFile(page);
});
app.get("/registro", (request, response, next) => {
  const page = path.join(path.resolve(), "public", "views", "registro.html");
  response.sendFile(page);
});
