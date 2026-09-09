const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname)));

// 1. Conexão com o Banco de Dados Gratuito (A URL vem de uma Variável de Ambiente no Render)
const MONGO_URI = process.env.MONGO_URI || "sua_string_de_conexao_local";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// 2. Definindo o "Molde" dos dados que vamos salvar
const AlunoSchema = new mongoose.Schema({
    nome: String,
    texto: String,
    data: { type: Date, default: Date.now }
});

const AlunoModel = mongoose.model("AlunoTexto", AlunoSchema);

// 3. Rota para receber os dados do site e salvar na nuvem
app.post("/api/salvar-txt", async (req, res) => {
    try {
        const { nome, texto } = req.body;

        if (!nome || !texto) {
            return res.status(400).json({ erro: "Nome e texto são obrigatórios." });
        }

        // Salva permanentemente no banco de dados do MongoDB Atlas
        const novoRegistro = new AlunoModel({ nome, texto });
        await novoRegistro.save();

        console.log(`Texto salvo no MongoDB para o aluno: ${nome}`);

        res.json({
            sucesso: true,
            mensagem: `Texto de "${nome}" salvo com segurança na nuvem!`
        });

    } catch (erro) {
        console.error("Erro ao salvar no banco de dados:", erro);
        res.status(500).json({ erro: "Não foi possível salvar os dados." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
