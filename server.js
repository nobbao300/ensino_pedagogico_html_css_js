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

// Conexão com o MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/test";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// ==========================================================
// 1. RECEPTOR ANTIGO (SALVA NA COLEÇÃO 'alunotextos')
// ==========================================================

// Definindo o Schema idêntico ao modelo salvo no MongoDB
const AlunoTextoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    texto: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

// Forçando o Mongoose a usar exatamente a coleção 'alunotextos'
const AlunoTextoModel = mongoose.model("AlunoTexto", AlunoTextoSchema, "alunotextos");

// Tratador genérico para salvar recados antigos
const salvarTextoAntigo = async (req, res) => {
    try {
        const { nome, texto, nomeArquivo, conteudo } = req.body;
        
        const autorFinal = nome || nomeArquivo || "Aluno Anônimo";
        const textoFinal = texto || conteudo || "";

        if (!textoFinal) {
            return res.status(400).json({ sucesso: false, erro: "O texto não pode estar vazio." });
        }

        const novoRegistro = new AlunoTextoModel({
            nome: autorFinal,
            texto: textoFinal
        });

        await novoRegistro.save();
        res.json({ sucesso: true, mensagem: "Arquivo/Texto salvo no banco com sucesso!" });
    } catch (erro) {
        console.error("Erro ao salvar texto antigo:", erro);
        res.status(500).json({ sucesso: false, erro: "Erro interno no servidor ao salvar." });
    }
};

// Mapeando todas as possíveis rotas que o frontend antigo possa estar chamando
app.post("/gerar-txt", salvarTextoAntigo);
app.post("/salvar", salvarTextoAntigo);
app.post("/api/salvar", salvarTextoAntigo);


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
