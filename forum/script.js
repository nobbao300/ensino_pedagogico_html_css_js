function escaparHtml(texto) {
    if (!texto) return "";
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Carrega as opções de imagem da pasta /galeria
async function carregarImagensGaleria() {
    const selectImagem = document.querySelector("#topicoImagem");
    if (!selectImagem) return;

    try {
        const res = await fetch("/api/galeria");
        const imagens = await res.json();

        imagens.forEach(img => {
            const opt = document.createElement("option");
            opt.value = img;
            opt.textContent = `📷 ${img}`;
            selectImagem.appendChild(opt);
        });
    } catch (err) {
        console.error("Erro ao carregar imagens da galeria:", err);
    }
}

// Carrega os tópicos gravados no MongoDB
async function carregarTopicosForum() {
    const container = document.querySelector("#forumContainer");
    if (!container) return;

    try {
        const res = await fetch("/api/forum");
        const topicos = await res.json();

        if (topicos.length === 0) {
            container.innerHTML = "<p>Nenhuma postagem criada ainda. Seja o primeiro a publicar!</p>";
            return;
        }

        container.innerHTML = topicos.map(t => `
            <article class="forum-card" data-id="${t._id}">
                <div class="forum-header">
                    <div>
                        <span class="forum-badge">${escaparHtml(t.categoria)}</span>
                        <h3 style="margin-top: 5px;">${escaparHtml(t.titulo)}</h3>
                    </div>
                    <div class="forum-meta">
                        Por <strong>${escaparHtml(t.autor)}</strong> em ${new Date(t.data).toLocaleString("pt-BR")}
                    </div>
                </div>

                <div class="forum-conteudo">
                    <p>${escaparHtml(t.conteudo).replaceAll("\n", "<br>")}</p>
                    ${t.imagem ? `<img src="/galeria/${t.imagem}" class="forum-img" alt="Imagem do Tópico">` : ""}
                </div>

                <div class="forum-comentarios">
                    <h4>💬 Comentários (${t.comentarios ? t.comentarios.length : 0})</h4>
                    <div class="lista-comentarios">
                        ${(t.comentarios || []).map(c => `
                            <div class="comentario-item">
                                <strong>${escaparHtml(c.autor)}</strong> <span style="font-size:0.8rem; color:#94a3b8;">(${new Date(c.data).toLocaleString("pt-BR")}):</span>
                                <p style="margin-top: 3px;">${escaparHtml(c.mensagem)}</p>
                            </div>
                        `).join("")}
                    </div>

                    <form onsubmit="enviarComentario(event, '${t._id}')" class="form-comentario">
                        <input type="text" placeholder="Seu nome" class="inputComentarioAutor" style="max-width: 180px;">
                        <input type="text" placeholder="Escreva um comentário..." class="inputComentarioTexto" required style="flex:1;">
                        <button type="submit" class="btn btn-secundario">Comentar</button>
                    </form>
                </div>
            </article>
        `).join("");

    } catch (err) {
        container.innerHTML = "<p>❌ Erro ao carregar postagens do fórum.</p>";
    }
}

// Submeter Novo Tópico
const formTopico = document.querySelector("#formTopico");
if (formTopico) {
    formTopico.addEventListener("submit", async function (e) {
        e.preventDefault();
        const status = document.querySelector("#statusFormTopico");
        status.textContent = "⏳ Enviando...";

        const payload = {
            autor: document.querySelector("#topicoAutor").value.trim(),
            titulo: document.querySelector("#topicoTitulo").value.trim(),
            categoria: document.querySelector("#topicoCategoria").value.trim(),
            imagem: document.querySelector("#topicoImagem").value,
            conteudo: document.querySelector("#topicoConteudo").value.trim()
        };

        try {
            const res = await fetch("/api/forum", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                status.textContent = "✅ Post publicado com sucesso!";
                formTopico.reset();
                carregarTopicosForum();
            } else {
                status.textContent = "❌ Erro ao publicar.";
            }
        } catch (err) {
            status.textContent = "❌ Falha na conexão com o servidor.";
        }
    });
}

// Submeter Comentário
async function enviarComentario(event, topicoId) {
    event.preventDefault();
    const form = event.target;
    const autor = form.querySelector(".inputComentarioAutor").value.trim();
    const mensagem = form.querySelector(".inputComentarioTexto").value.trim();

    try {
        const res = await fetch(`/api/forum/${topicoId}/comentarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ autor, mensagem })
        });

        if (res.ok) {
            carregarTopicosForum();
        } else {
            alert("Erro ao enviar comentário.");
        }
    } catch (err) {
        alert("Erro na conexão.");
    }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    carregarImagensGaleria();
    carregarTopicosForum();
});