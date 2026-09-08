# Laboratório — Primeiros passos com HTML, CSS e JavaScript

Projeto didático para ensino médio.

## Arquivos

- `index.html` — estrutura e conteúdo da aula.
- `style.css` — aparência da página.
- `script.js` — interações e experiências.
- `server.js` — servidor Node.js/Express.
- `package.json` — dependência e comando de inicialização.
- `alunos/` — arquivos TXT gerados pelo servidor.

## Executar localmente

É necessário ter Node.js instalado.

```bash
npm install
npm start
```

Depois abra:

```text
http://localhost:3000
```

## Sobre o salvamento

O endpoint:

```text
POST /api/salvar-txt
```

recebe o nome e o conteúdo e cria um `.txt` dentro da pasta `alunos`.

### Atenção ao Render

O exemplo não trata o sistema de arquivos local do Render como armazenamento permanente.

Se a intenção for que cada TXT fique permanentemente no repositório Git, será necessário adicionar uma segunda etapa no `server.js`:

```text
Aluno
  ↓
JavaScript
  ↓
Render
  ↓
server.js
  ↓
GitHub API
  ↓
commit
  ↓
arquivo .txt no repositório
```

Para isso, deve-se configurar um token como variável de ambiente no Render, nunca diretamente no código.

## Próxima evolução

Uma futura versão pode:

- criar commits automaticamente;
- colocar cada atividade em uma pasta;
- registrar nome/turma;
- gerar arquivos HTML;
- mostrar uma lista das atividades;
- utilizar banco de dados;
- adicionar autenticação para evitar que qualquer visitante grave arquivos.
# ensino_pedagogico_html_css_js
