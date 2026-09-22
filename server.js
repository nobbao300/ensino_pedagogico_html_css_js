const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de parsers para lidar com dados de formulários e JSON
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da raiz
app.use(express.static(path.join(__dirname)));

// Servir pasta de galeria e a pasta isolada do fórum
app.use("/galeria", express.static(path.join(__dirname, "galeria")));
app.use("/forum", express.static(path.join(__dirname, "forum")));

// Conexão com o MongoDB (Pega a variável MONGO_URI do Render ou conecta ao localhost)
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/laboratorio_db";

mongoose.connect(MONGO_URI)
    .then(() => console.log("Conectado ao MongoDB com sucesso!"))
    .catch(err => console.error("Erro ao conectar ao MongoDB:", err));

// ==========================================================
// 1. RECEPTOR ANTIGO (PROJETO FINAL - ARQUIVOS TXT / RECADOS)
// ==========================================================

// Esquema para salvar as mensagens/arquivos antigos do site
const MensagemAntigaSchema = new mongoose.Schema({
    nomeArquivo: { type: String, default: "Sem nome" },
    conteudo: { type: String, required: true },
    data: { type: Date, default: Date.now }
});

const MensagemAntigaModel = mongoose.model("MensagemAntiga", MensagemAntigaSchema);

// Rotas antigas para evitar o erro 'JSON.parse' no projeto final
app.post("/gerar-txt", async (req, res) => {
    try {
        const { nomeArquivo, conteudo, nome, texto } = req.body;
        const textoFinal = conteudo || texto || "";
        const tituloFinal = nomeArquivo || nome || "recado.txt";

        if (!textoFinal) {
            return res.status(400).json({ sucesso: false, erro: "Conteúdo não pode estar vazio." });
        }

        const novaMensagem = new MensagemAntigaModel({
            nomeArquivo: tituloFinal,
            conteudo: textoFinal
        });

        await novaMensagem.save();
        res.json({ sucesso: true, mensagem: "Arquivo/Recado salvo com sucesso!", id: novaMensagem._id });
    } catch (erro) {
        console.error("Erro ao salvar mensagem antiga:", erro);
        res.status(500).json({ sucesso: false, erro: "Erro interno no servidor ao salvar." });
    }
});

// Alias para caso o frontend antigo chame /salvar
app.post("/salvar", async (req, res) => {
    try {
        const { nomeArquivo, conteudo, nome, texto } = req.body;
        const textoFinal = conteudo || texto || "";
        const tituloFinal = nomeArquivo || nome || "recado.txt";

        const novaMensagem = new MensagemAntigaModel({
            nomeArquivo: tituloFinal,
            conteudo: textoFinal
        });

        await novaMensagem.save();
        res.json({ sucesso: true, mensagem: "Salvo com sucesso!" });
    } catch (erro) {
        res.status(500).json({ sucesso: false, erro: "Erro ao salvar." });
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

const TopicoModel = mongoose.model("Topico", TopicoSchema);

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
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});
