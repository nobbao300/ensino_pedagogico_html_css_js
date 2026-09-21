const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "500kb" }));

// Servir os arquivos da raiz (index.html, style.css do site principal, etc.)
app.use(express.static(path.join(__dirname)));

// Servir a pasta galeria
app.use("/galeria", express.static(path.join(__dirname, "galeria")));

// Servir a pasta do fórum de forma dedicada
app.use("/forum", express.static(path.join(__dirname, "forum")));

// Conexão com o MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/laboratorio_db";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// Esquema do Fórum
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

const TopicoModel = mongoose.model("Topico", TopicoSchema);

// --- ROTAS DA API DO FÓRUM ---

// 1. Listar tópicos
app.get("/api/forum", async (req, res) => {
    try {
        const topicos = await TopicoModel.find().sort({ data: -1 });
        res.json(topicos);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar tópicos." });
    }
});

// 2. Criar tópico
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
        res.status(500).json({ erro: "Erro ao salvar tópico." });
    }
});

// 3. Adicionar comentário
app.post("/api/forum/:id/comentarios", async (req, res) => {
    try {
        const { autor, mensagem } = req.body;
        const { id } = req.params;

        if (!mensagem) {
            return res.status(400).json({ erro: "Mensagem é obrigatória." });
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

// 4. Listar arquivos de imagem na pasta /galeria
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
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
