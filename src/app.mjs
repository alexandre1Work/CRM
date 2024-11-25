import express from "express";
import path from "path";
import jwt from "jsonwebtoken";
import auth from "./middlewares/auth.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mysql from "mysql2";
import { createRequire } from "module";
const bodyParser = require("body-parser");
const require = createRequire(import.meta.url);
const gClient = require("../public/assets/js/gzappy.js");
//Models
import User from "./models/UsuarioModel.js";
import Cliente from "./models/ClienteModel.js";
import Mensagem from "./models/MensagemModel.js";
import Tag from "./models/TagModel.js";

dotenv.config();
const db = mysql.createPool(process.env.CONNECTION_STRING);

const app = express();

// Express Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));

//Inicialização
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2qpyc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    app.listen(process.env.PORT);
    console.log("Server rodando: http://localhost:3000");
  })
  .catch((err) => console.log(err));

// Rota para registro de usuário
app.post("/auth/register", async (req, res) => {
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
  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res.status(422).json({ msg: "Email Já cadastrado!" });
  }

  //Criar senha
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  //Criar Usuario
  const user = new User({
    name,
    email,
    password: passwordHash,
  });
  try {
    await user.save();
    res.status(201).json({ msg: "Usuário criado!" });
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
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" });
  }

  //Checar se a senha está correta
  const checkpassword = await bcrypt.compare(password, user.password);
  if (!checkpassword) {
    return res.status(422).json({ msg: "Senha inválida!" });
  }

  try {
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.SECRET
    );
    res.status(200).json({ msg: "Autenticação realizada", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Deu pau no BD" });
  }
});

// Rota para obter todos os clientes
app.get("/clientes", auth.checkToken, async (req, res) => {});

// Rota para obter os dados de um cliente específico
app.get("/clientes/:id_cliente", auth.checkToken, async (req, res) => {});

// Rota para criar um novo cliente
app.post("/clientes", auth.checkToken, async (req, res) => {});

// Rota para atualizar um cliente
app.put("/clientes/:id_cliente", auth.checkToken, async (req, res) => {});

// Rota para excluir um cliente
app.delete("/clientes/:id_cliente", auth.checkToken, async (req, res) => {});

// Rota para listar todas as tags
app.get("/tags", auth.checkToken, async (req, res) => {});

// Rota para adicionar uma nova tag
app.post("/tags", auth.checkToken, async (req, res) => {});

// Rota para verificar se uma tag ja está atribuida
app.get("/clientes/:clienteId/tags/:tagId", auth.checkToken, async (req, res) => {});

// Rota para desatribuir uma tag de um cliente
app.delete("/clientes/:clienteId/tags/:tagId", auth.checkToken, async (req, res) => {});

// Rota para atribuir uma tag a um cliente
app.post("/clientes/:id_cliente/tags", auth.checkToken, async (req, res) => {});

// Rota para listar todos os templates de mensagem
app.get("/mensagens", auth.checkToken, async (req, res) => {});

// Rota para criar uma nova mensagem
app.post("/mensagens", auth.checkToken, async (req, res) => {});

// Rota para enviar mensagens para os clientes selecionados
app.post("/mensagens/enviar", auth.checkToken, async (req, res) => {});

//Paginas
app.get("/", (request, response, next) => {
  const page = path.join(path.resolve(), "public", "views", "index.html");
  response.sendFile(page);
});
