const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');

function createWindow () {
  const win = new BrowserWindow({ width: 1024, height: 768 });
  win.loadFile('index.html'); // Carrega a sua página web

  // CASO A: Abrir um jogo nativo do Linux (.sh ou binário)
  exec('./caminho/do/jogo-linux.sh');

  // CASO B: Abrir um jogo de Windows (.exe) usando o Wine instalado no Mint
  // exec('wine /caminho/do/jogo.exe');
}

app.whenReady().then(createWindow);
