/*
============================================================
SCRIPT.JS — INTERAÇÕES DA PÁGINA
============================================================

JavaScript é utilizado aqui para fazer a página reagir
às ações do usuário.

O padrão que aparecerá várias vezes:

1. Encontramos um elemento HTML.
2. Esperamos uma ação, como um clique.
3. Executamos uma função.
4. Alteramos algum elemento da página.
============================================================
*/

// ==========================================================
// 01 — PRIMEIRO EXPERIMENTO
// ==========================================================

const experimentoTexto = document.querySelector("#experimentoTexto");
const btnExperimentoTexto = document.querySelector("#btnExperimentoTexto");
const resultadoTexto = document.querySelector("#resultadoTexto");

btnExperimentoTexto.addEventListener("click", function () {
    const texto = experimentoTexto.value;

    if (texto.trim() === "") {
        resultadoTexto.textContent = "Digite alguma coisa primeiro.";
        return;
    }

    resultadoTexto.textContent = texto;
});


// ==========================================================
// 02 — UTF-8
// ==========================================================

const utf8Input = document.querySelector("#utf8Input");
const btnUtf8 = document.querySelector("#btnUtf8");
const utf8Resultado = document.querySelector("#utf8Resultado");

btnUtf8.addEventListener("click", function () {
    utf8Resultado.textContent =
        utf8Input.value || "Nenhum texto foi digitado.";
});


// ==========================================================
// 03 — GERAR CONTEÚDO HTML
// ==========================================================

const tituloAluno = document.querySelector("#tituloAluno");
const paragrafoAluno = document.querySelector("#paragrafoAluno");
const btnGerarConteudo = document.querySelector("#btnGerarConteudo");
const conteudoGerado = document.querySelector("#conteudoGerado");

btnGerarConteudo.addEventListener("click", function () {
    const titulo = tituloAluno.value.trim();
    const paragrafo = paragrafoAluno.value.trim();

    if (!titulo && !paragrafo) {
        conteudoGerado.textContent = "Preencha pelo menos um campo.";
        return;
    }

    conteudoGerado.innerHTML = `
        <h1>${escaparHtml(titulo || "Sem título")}</h1>
        <p>${escaparHtml(paragrafo || "Sem parágrafo.")}</p>
    `;
});


// ==========================================================
// 04 — ID
// ==========================================================

const btnId = document.querySelector("#btnId");
const caixaIdDemo = document.querySelector("#caixaIdDemo");

btnId.addEventListener("click", function () {
    caixaIdDemo.textContent =
        "O JavaScript encontrou este elemento pelo seu ID!";
    caixaIdDemo.style.backgroundColor = "#dcfce7";
    caixaIdDemo.style.borderColor = "#22c55e";
});


// ==========================================================
// 05 — IMAGEM
// ==========================================================

const imagemSrc = document.querySelector("#imagemSrc");
const btnImagem = document.querySelector("#btnImagem");
const imagemResultado = document.querySelector("#imagemResultado");

btnImagem.addEventListener("click", function () {
    const caminho = imagemSrc.value.trim();

    if (!caminho) {
        imagemResultado.textContent = "Digite um caminho de imagem.";
        return;
    }

    imagemResultado.innerHTML = "";

    const imagem = document.createElement("img");

    imagem.src = caminho;
    imagem.alt = "Imagem carregada pelo aluno";

    imagem.addEventListener("load", function () {
        imagemResultado.prepend(imagem);
    });

    imagem.addEventListener("error", function () {
        imagemResultado.textContent =
            "❌ Não foi possível carregar a imagem. Confira o caminho.";
    });
});


// ==========================================================
// 06 — CSS INTERATIVO
// ==========================================================

const cssDemo = document.querySelector("#cssDemo");
const corFundo = document.querySelector("#corFundo");
const corTexto = document.querySelector("#corTexto");
const btnAplicarCss = document.querySelector("#btnAplicarCss");

btnAplicarCss.addEventListener("click", function () {
    cssDemo.style.backgroundColor = corFundo.value;
    cssDemo.style.color = corTexto.value;
});


// ==========================================================
// 06B — EXPERIÊNCIA DE ESTILO
// ==========================================================

const cssCarregavel = document.querySelector("#cssCarregavel");
const btnCarregarCss = document.querySelector("#btnCarregarCss");
const btnRemoverCss = document.querySelector("#btnRemoverCss");
const statusCss = document.querySelector("#statusCss");

btnCarregarCss.addEventListener("click", function () {
    cssCarregavel.classList.add("area-com-estilo");

    statusCss.textContent =
        "✅ A classe CSS foi adicionada à área.";
});

btnRemoverCss.addEventListener("click", function () {
    cssCarregavel.classList.remove("area-com-estilo");

    statusCss.textContent =
        "O estilo foi removido.";
});


// ==========================================================
// 08 — SAUDAÇÃO
// ==========================================================

const nomeTeste = document.querySelector("#nomeTeste");
const btnSaudacao = document.querySelector("#btnSaudacao");
const saudacao = document.querySelector("#saudacao");

btnSaudacao.addEventListener("click", function () {
    const nome = nomeTeste.value.trim();

    if (!nome) {
        saudacao.textContent = "Digite seu nome.";
        return;
    }

    saudacao.textContent = `Olá, ${nome}! Você acabou de usar HTML + CSS + JavaScript.`;
});


// ==========================================================
// 09 — CONTADOR
// ==========================================================

const meuBotao = document.querySelector("#meuBotao");
const contador = document.querySelector("#contador");

let quantidadeCliques = 0;

meuBotao.addEventListener("click", function () {
    quantidadeCliques++;

    contador.textContent =
        `Você clicou ${quantidadeCliques} vez(es).`;
});


// ==========================================================
// 10 — ENVIAR TEXTO PARA O SERVIDOR
// ==========================================================

const arquivoNome = document.querySelector("#arquivoNome");
const textoFinal = document.querySelector("#textoFinal");
const btnSalvarTxt = document.querySelector("#btnSalvarTxt");
const statusSalvar = document.querySelector("#statusSalvar");

btnSalvarTxt.addEventListener("click", async function () {
    const nome = arquivoNome.value.trim();
    const texto = textoFinal.value;

    if (!nome || !texto.trim()) {
        statusSalvar.textContent =
            "❌ Informe um nome para o arquivo e escreva algum texto.";
        return;
    }

    statusSalvar.textContent = "⏳ Enviando para o servidor...";

    try {
        const resposta = await fetch("/api/salvar-txt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                texto: texto
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao salvar arquivo.");
        }

        statusSalvar.textContent =
            `✅ ${dados.mensagem}`;
    } catch (erro) {
        statusSalvar.textContent =
            `⚠️ ${erro.message}. Se o servidor não estiver rodando, execute o server.js.`;
    }
});


// ==========================================================
// FUNÇÃO DE SEGURANÇA
// ==========================================================

/*
    Quando colocamos texto enviado pelo usuário dentro de
    innerHTML, caracteres especiais podem ser interpretados
    como HTML.

    Esta função transforma caracteres especiais em texto.
*/

function escaparHtml(texto) {
    return texto
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
