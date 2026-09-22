const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de parsers
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da raiz
app.use(express.static(path.join(__dirname)));

// Servir pasta de galeria e a pasta isolada do fórum
app.use("/galeria", express.static(path.join(__dirname, "galeria")));
app.use("/forum", express.static(path.join(__dirname, "forum")));

// Conexão com o MongoDB (Usando a URI do Render ou Local)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));


// ==========================================================
// 1. RECEPTOR ANTIGO DA PÁGINA PRINCIPAL (PROJETO FINAL)
// ==========================================================

// Mapeia os dados diretamente para a coleção 'alunotextos' do MongoDB Atlas
const AlunoTextoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    texto: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

const AlunoTextoModel = mongoose.model("AlunoTexto", AlunoTextoSchema, "alunotextos");

// Endpoint original chamado pelo script.js da página principal
app.post("/api/salvar-txt", async (req, res) => {
    try {
        const { nome, texto } = req.body;

        if (!nome || !texto || !texto.trim()) {
            return res.status(400).json({
                sucesso: false,
                erro: "Nome do arquivo e conteúdo são obrigatórios."
            });
        }

        // Salva diretamente na coleção alunotextos
        const novoRegistro = new AlunoTextoModel({
            nome: nome,
            texto: texto
        });

        await novoRegistro.save();

        // Resposta JSON exata que o script.js espera receber
        return res.json({
            sucesso: true,
            mensagem: `Arquivo "${nome}" salvo no banco com sucesso!`
        });

    } catch (erro) {
        console.error("Erro ao salvar no banco:", erro);
        return res.status(500).json({
            sucesso: false,
            erro: "Não foi possível salvar o arquivo no banco de dados."
        });
    }
});


// ==========================================================
// 2. NOVO RECEPTOR (FÓRUM DE DISCUSSÕES & UPDATES)
// ==========================================================

const ComentarioSchema = new mongoose.Schema({
    autor: { type: String, required: true },
    mensagem: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

const TopicoSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    autor: { type: String, default: "Criador" },
    categoria: { type: String, default: "Geral" },
    imagem: { type: String, default: "" },
    conteudo: { type: String, required: true },
    data: { type: Date, default: Date.now },
    comentarios: [ComentarioSchema]
});

const TopicoModel = mongoose.model("Topico", TopicoSchema, "topicos");

// Rotas da API do Fórum
app.get("/api/forum", async (req, res) => {
    try {
        const topicos = await TopicoModel.find().sort({ data: -1 });
        res.json(topicos);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar tópicos do fórum." });
    }
});

app.post("/api/forum", async (req, res) => {
    try {
        const { titulo, autor, categoria, imagem, conteudo } = req.body;

        if (!titulo || !conteudo) {
            return res.status(400).json({ erro: "Título e conteúdo são obrigatórios." });
        }

        const novoTopico = new TopicoModel({
            titulo,
            autor: autor || "Anônimo",
            categoria: categoria || "Geral",
            imagem: imagem || "",
            conteudo
        });

        await novoTopico.save();
        res.json({ sucesso: true, topico: novoTopico });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao salvar tópico no banco de dados." });
    }
});

app.post("/api/forum/:id/comentarios", async (req, res) => {
    try {
        const { autor, mensagem } = req.body;
        const { id } = req.params;

        if (!mensagem) {
            return res.status(400).json({ erro: "Mensagem do comentário é obrigatória." });
        }

        const topico = await TopicoModel.findById(id);
        if (!topico) {
            return res.status(404).json({ erro: "Tópico não encontrado." });
        }

        topico.comentarios.push({
            autor: autor || "Visitante",
            mensagem
        });

        await topico.save();
        res.json({ sucesso: true, topico });
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao adicionar comentário." });
    }
});

app.get("/api/galeria", (req, res) => {
    const galeriaPath = path.join(__dirname, "galeria");
    if (!fs.existsSync(galeriaPath)) {
        fs.mkdirSync(galeriaPath);
    }

    fs.readdir(galeriaPath, (err, files) => {
        if (err) return res.status(500).json({ erro: "Erro ao ler galeria." });
        const imagens = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
        res.json(imagens);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
