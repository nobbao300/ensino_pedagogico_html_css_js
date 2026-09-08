/*
============================================================
SERVER.JS — SERVIDOR PARA O PROJETO

Este servidor utiliza Node.js + Express.

Funções:

1. Entregar os arquivos HTML/CSS/JS ao navegador.
2. Receber textos enviados pelo formulário.
3. Criar arquivos .txt na pasta "alunos".

IMPORTANTE SOBRE O RENDER:

Este exemplo salva os arquivos na pasta local "alunos".
Em muitos serviços de hospedagem, o disco local pode ser
temporário.

Se o objetivo for manter os arquivos permanentemente no
repositório Git, será necessário integrar este servidor com
GitHub/GitLab ou utilizar armazenamento persistente.

NUNCA coloque tokens ou senhas diretamente neste arquivo.
Use variáveis de ambiente.
============================================================
*/

const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const app = express();

const PORT = process.env.PORT || 3000;

const pastaPublica = path.join(__dirname);
const pastaAlunos = path.join(__dirname, "alunos");

app.use(express.json({ limit: "100kb" }));

/*
    Entrega index.html, style.css e script.js.
*/
app.use(express.static(pastaPublica));

/*
    Garante que a pasta de arquivos dos alunos exista.
*/
async function prepararPasta() {
    await fs.mkdir(pastaAlunos, { recursive: true });
}

/*
    Remove caracteres perigosos do nome do arquivo.

    Exemplo:

    "minha atividade/1"
          ↓
    "minha-atividade-1"
*/
function limparNomeArquivo(nome) {
    return nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}


/*
============================================================
ROTA POST /api/salvar-txt
============================================================

O navegador envia:

{
    "nome": "minha-atividade",
    "texto": "Olá!"
}

O servidor transforma isso em:

alunos/minha-atividade.txt
============================================================
*/

app.post("/api/salvar-txt", async (req, res) => {
    try {
        const { nome, texto } = req.body;

        if (typeof nome !== "string" || typeof texto !== "string") {
            return res.status(400).json({
                erro: "Nome e texto são obrigatórios."
            });
        }

        const nomeLimpo = limparNomeArquivo(nome);

        if (!nomeLimpo) {
            return res.status(400).json({
                erro: "O nome do arquivo não é válido."
            });
        }

        if (!texto.trim()) {
            return res.status(400).json({
                erro: "O texto não pode estar vazio."
            });
        }

        await prepararPasta();

        const caminhoArquivo =
            path.join(pastaAlunos, `${nomeLimpo}.txt`);

        await fs.writeFile(
            caminhoArquivo,
            texto,
            "utf8"
        );

        console.log(`Arquivo criado: ${caminhoArquivo}`);

        res.json({
            sucesso: true,
            mensagem: `Arquivo "${nomeLimpo}.txt" salvo com sucesso.`
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Não foi possível salvar o arquivo."
        });
    }
});


/*
============================================================
INICIALIZAÇÃO
============================================================
*/

prepararPasta()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor funcionando na porta ${PORT}`);
            console.log(`Abra: http://localhost:${PORT}`);
        });
    })
    .catch((erro) => {
        console.error("Erro ao preparar o servidor:", erro);
        process.exit(1);
    });
