const { app, BrowserWindow } = require('electron');
const path = require('path');
const {ipcMain} = require('electron')
const Store = require('electron-store');

const store = new Store();

var binance_btc_pairs = {}
var binance_eth_pairs = {}
var binance_usdt_pairs = {}

var kucoin_btc_pairs = {}
var kucoin_eth_pairs = {}
var kucoin_usdt_pairs = {}

var hotbit_btc_pairs = {}
var hotbit_eth_pairs = {}
var hotbit_usdt_pairs = {}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
     // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            webSecurity: false
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, './app/index.html'));
    mainWindow.webContents.setBackgroundThrottling(false);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.on('moved', function () {
        mainWindow.webContents.send('windows-resized');
    });

    //Worker
    workerWindow = new BrowserWindow({
      show: true,
      webPreferences: { nodeIntegration: true }
    });
    workerWindow.webContents.openDevTools();
    workerWindow.webContents.setBackgroundThrottling(false);

    workerWindow.loadFile('./app/assets/worker.html');

    mainWindow.on('close', function() { 
      workerWindow.close();
    });

    mainWindow.setMaximizable(false);

    ipcMain.on('asynchronous-message', (event, msg) => {
      console.log(msg)
    })

    ipcMain.on('pumping_coin_value', (event, value, time) => {
      mainWindow.webContents.send('pumping_coin_updated', value, time);
    })

    ipcMain.on('update_clock', (event, hour, minute, second, mil) => {
      mainWindow.webContents.send('pr_clock', hour, minute, second, mil);
    })

    ipcMain.on('UpdatePairs', (event, bnc_btc, bnc_eth, bnc_usdt, ku_btc, ku_eth, ku_usdt, hb_btc, hb_eth, hb_usdt) => {
      binance_btc_pairs = bnc_btc
      binance_eth_pairs = bnc_eth
      binance_usdt_pairs = bnc_usdt

      kucoin_btc_pairs = ku_btc
      kucoin_eth_pairs = ku_eth
      kucoin_usdt_pairs = ku_usdt

      hotbit_btc_pairs = hb_btc
      hotbit_eth_pairs = hb_eth
      hotbit_usdt_pairs = hb_usdt
    })

    ipcMain.on('notification', (event, msg, type, icon) => {
      mainWindow.webContents.send('notification', msg, type, icon);
    });

    ipcMain.handle('setStoreValue', (event, key, value) => {
      store.set(key, value);
    });

    ipcMain.handle('getStoreValue', (event, key) => {
      return store.get(key);
    });

    ipcMain.on('buy-now', (event, symbol, pair, amount, parameters, exchange) => {
      workerWindow.webContents.send("buy-now", symbol, pair, amount, parameters, exchange);
    });

    ipcMain.on('scrape-now', (event, channel, pair, amount, parameters, exchange) => {
      workerWindow.webContents.send("scrape-now", channel, pair, amount, parameters, exchange);
    });

    ipcMain.on('sell-now', (event, perc) => {
      workerWindow.webContents.send("sell-now", perc);
    });

    ipcMain.handle('getPrice', (event, pair, symbol, exchange) => {
      switch (exchange) {
        case 'binance':
          switch (pair){
            case 'btc':
              if (symbol + 'BTC' in binance_btc_pairs)
                return binance_btc_pairs[symbol + 'BTC'];
              break;
            case 'eth':
              if (symbol + 'ETH' in binance_eth_pairs)
                return binance_eth_pairs[symbol + 'ETH'];
              break
            case 'usdt':
                if (symbol + 'USDT' in binance_usdt_pairs)
                  return binance_usdt_pairs[symbol + 'USDT'];
                break
          }
          break;
        case 'kucoin':
          switch (pair){
            case 'btc':
              if (symbol + 'BTC' in kucoin_btc_pairs)
                return kucoin_btc_pairs[symbol + 'BTC'];
              break;
            case 'eth':
              if (symbol + 'ETH' in kucoin_eth_pairs)
                return kucoin_eth_pairs[symbol + 'ETH'];
              break
            case 'usdt':
                if (symbol + 'USDT' in kucoin_usdt_pairs)
                  return kucoin_usdt_pairs[symbol + 'USDT'];
                break
          }
          break;
        case 'hotbit':
          switch (pair){
            case 'btc':
              if (symbol + 'BTC' in hotbit_btc_pairs)
                return hotbit_btc_pairs[symbol + 'BTC'];
              break;
            case 'eth':
              if (symbol + 'ETH' in hotbit_eth_pairs)
                return hotbit_eth_pairs[symbol + 'ETH'];
              break
            case 'usdt':
                if (symbol + 'USDT' in hotbit_usdt_pairs)
                  return hotbit_usdt_pairs[symbol + 'USDT'];
                break
          }
          break;
      }
    });

    ipcMain.on('pump-response', (event, success, symbol, enter_price, amount, min_not) => {
      mainWindow.webContents.send("pump-response-client", success, symbol, enter_price, amount, min_not);
    });

    ipcMain.on('scrape-response', (event, status) => {
      mainWindow.webContents.send("scrape-response", status);
    });

    ipcMain.on('selling-status', (event, selling) => {
      mainWindow.webContents.send("selling-status", selling);
    });

    ipcMain.on('exit-pump', (event) => {
      mainWindow.webContents.send("exit-pump");
    });

    ipcMain.on('stop-scrape', (event) => {
      workerWindow.webContents.send("stop-scrape");
    });

    ipcMain.on('sold-perc', (event, quantity, price) => {
      mainWindow.webContents.send("sold-perc", quantity, price);
    });

    ipcMain.on('websocket-status', (event, status) => {
      mainWindow.webContents.send("websocket-status", status);
    });

    ipcMain.on('get-balance', (event, exchange, pair) => {
      workerWindow.webContents.send("get-balance", exchange, pair);
    });

    ipcMain.on('set-balance', (event, balance) => {
      mainWindow.webContents.send("set-balance", balance);
      mainWindow.webContents.send('notification', "Max balance set", "info_alert", "info-circle");
    });

    ipcMain.on('split-order', (event, is_place, coins, pair, exchange, amount, parameters) => {
      workerWindow.webContents.send("split-order", is_place, coins, pair, exchange, amount, parameters);
    });
};

require('electron-reload')(__dirname);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const fs = require('fs')

const config_path = app.getPath('userData') + '/config.json';

if (!fs.existsSync(config_path)) {
  
}