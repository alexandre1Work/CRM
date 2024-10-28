import mysql from "mysql2"
import dotenv from 'dotenv'
dotenv.config()

const client = mysql.createPool(process.env.CONNECTION_STRING)

export async function selectClientes() {
    const results = await client.query("SELECT c.nome_completo, c.telefone, c.email, c.ultimo_contato, GROUP_CONCAT(cat.nome_categoria) AS categorias FROM cliente c LEFT JOIN cliente_categoria cc ON c.id_cliente = cc.id_cliente LEFT JOIN categoria cat ON cc.id_categoria = cat.id_categoria GROUP BY c.id_cliente;")
    return results[0]
}

