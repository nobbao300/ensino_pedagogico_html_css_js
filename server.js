/*
============================================================
SERVER.JS — SALVANDO DIRETAMENTE NO GOOGLE DRIVE
============================================================
*/

const express = require("express");
const path = require("path");
const { google } = require("googleapis");

const app = express();
const PORT = process.env.PORT || 3000;

const pastaPublica = path.join(__dirname);
app.use(express.json({ limit: "100kb" }));
app.use(express.static(pastaPublica));

// Configuração de Autenticação do Google Drive
// Funciona localmente via arquivo credentials.json ou no Render via Variável de Ambiente
let credentialsConfig;
if (process.env.GOOGLE_CREDENTIALS) {
    try {
        credentialsConfig = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    } catch (e) {
        console.error("Erro ao analisar GOOGLE_CREDENTIALS da variável de ambiente:", e);
    }
} else {
    credentialsConfig = path.join(__dirname, "credentials.json");
}

const authOptions = {
    scopes: ["https://www.googleapis.com/auth/drive.file"]
};

if (typeof credentialsConfig === "string") {
    authOptions.keyFile = credentialsConfig;
} else {
    authOptions.credentials = credentialsConfig;
}

const auth = new google.auth.GoogleAuth(authOptions);
const drive = google.drive({ version: "v3", auth });

// ID da pasta "alunos" no Google Drive
const PASTA_ALUNOS_ID = "175bMJq--gBTfI8A0INE8bypOwNnwfKM4";

function limparNomeArquivo(nome) {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}

app.post("/api/salvar-txt", async (req, res) => {
    try {
        const { nome, texto } = req.body;

        if (typeof nome !== "string" || typeof texto !== "string") {
            return res.status(400).json({ erro: "Nome e texto são obrigatórios." });
        }

        const nomeLimpo = limparNomeArquivo(nome);

        if (!nomeLimpo || !texto.trim()) {
            return res.status(400).json({ erro: "Nome ou texto inválidos." });
        }

        const nomeArquivo = `${nomeLimpo}.txt`;

        // Metadados do arquivo para o Google Drive
        const fileMetadata = {
            name: nomeArquivo,
            parents: [PASTA_ALUNOS_ID] // Salva dentro da pasta específica
        };

        // Conteúdo do arquivo
        const media = {
            mimeType: "text/plain",
            body: texto
        };

        // Cria o arquivo no Google Drive
        const respostaDrive = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id, name, webViewLink"
        });

        console.log(`Arquivo criado no Google Drive: ${respostaDrive.data.name}`);

        res.json({
            sucesso: true,
            mensagem: `Arquivo "${nomeArquivo}" salvo no Google Drive com sucesso!`
        });

    } catch (erro) {
        console.error("Erro ao salvar no Google Drive:", erro);
        res.status(500).json({ erro: "Não foi possível salvar o arquivo no Google Drive. Verifique as credenciais." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
