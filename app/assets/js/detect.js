var dict = {
    "binance": "assets/icons/binance-logo.svg",
    "kucoin": "assets/icons/kucoin.svg",
    "hotbit": "assets/icons/hotbit.svg",
    "btc": "assets/icons/bitcoin.svg",
    "eth": "assets/icons/ethereum.svg",
    "usdt": "assets/icons/tether.svg"
};

var buy_parameters;
var valid_coin;
var trying_to_buy;

var input_coin;
var amount_input;
var pair_input;
var exchange_input;
var scrape_input;

var scrape_channel_input;
var getting_balance;

var date_input;
var time_input;

var symbolStream;

function initBotTab(){
  buy_parameters = {}
  input_coin = ""
  //amount_input = 0;
  valid_coin = false;
  trying_to_buy = false;
  //pair_input = undefined;
  //exchange_input = undefined;
  scrape_channel_input = undefined;
  date_input = undefined;
  time_input = undefined;
  scrape_input = "";
  getting_balance = false;

  var date = document.getElementById('pr_date');
  var time = document.getElementById('pr_time');

  var coin_input = document.getElementById('pr_coin');

  //Enable Butttons only if websockets are loaded
  DisableButtons(websocket_loaded)

  //Set vals
  if(amount_input != undefined)
    $('#pr_amount').val(amount_input);
  if(exchange_input != undefined)
    $('#pr_exchange').val(exchange_input);
  if(pair_input != undefined)
    $('#pr_pair').val(pair_input.toLowerCase());

  $('#pr_amount').on('input', function() {
    var inp = $(this).val()
    inp = inp.replace(/,|-|\//g,'.')
    var inp_new = inp;
    if(inp.includes('.')) {
      var inp_new = inp.split('.');
      inp_new = inp_new.shift() + '.' + inp_new.join('');
    }
    $(this).val(inp_new);
    amount_input = parseFloat(inp_new)
    console.log(amount_input)
  })

  $('#pr_exchange').on('sl-change', function() {
    exchange_input = $(this).val()
    if(input_coin != "") {
      CheckSymbol(input_coin)
    }
  });

  $('#pr_pair').on('sl-change', function() {
    pair_input = $(this).val().toUpperCase()
    if(input_coin != "") {
      CheckSymbol(input_coin)
    }
  });

  $('#pr_channel').on('input', function() {
    scrape_input = $(this).val()
  });

  $('#pr_split').on('input', function() {
    $(this).val($(this).val().replace(/\s+/g, '-').toUpperCase())
    input_coin = $(this).val()
  });

  document.querySelectorAll('sl-select').forEach(item => {
    item.addEventListener('sl-change', event => {
      SelectIcons(item);
    });
    if(item.value != undefined && item.value != "")
      setTimeout(function(){SelectIcons(item)}, 20)
  });

  if(date!=null){
    date.addEventListener('input', function(e) {
      this.type = 'text';
      var input = this.value;
      if (/\D\/$/.test(input)) input = input.substr(0, input.length - 3);
      var values = input.split('/').map(function(v) {
        return v.replace(/\D/g, '')
      });
      if (values[0]) values[0] = checkValue(values[0], 31, true);
      if (values[1]) values[1] = checkValue(values[1], 12, true);
      
      var output = values.map(function(v, i) {
        return v.length == 2 && i < 2 ? v + ' / ' : v;
      });
      this.value = output.join('').substr(0, 7);
    });
  
  
    time.addEventListener('input', function(e) {
      this.type = 'text';
      var input = this.value;
      if (/\D\:$/.test(input)) input = input.substr(0, input.length - 3);
      var values = input.split(':').map(function(v) {
        return v.replace(/\D/g, '')
      });
      if (values[0]) values[0] = checkValue(values[0], 23, false);
      if (values[1]) values[1] = checkValue(values[1], 59, false);
      var output = values.map(function(v, i) {
        return v.length == 2 && i < 2 ? v + ' : ' : v;
      });
      this.value = output.join('').substr(0, 7);
    });
  }

  if(coin_input != null) {
    var coin_symbol = coin_input.querySelector('p');
  
    coin_input.addEventListener('input', function(e) {
      coin_input.value= coin_input.value.toUpperCase();
      coin_symbol.style.transform = 'translateX(' + (200 - (coin_input.value.length) * 14) + 'px)';
      CheckSymbol(this.value)
    });
  }

  GetStats();
}

function checkValue(str, max, is_time) {
  if (str.charAt(0) !== '0' || str=="00" && is_time) {
    var num = parseInt(str);
    if (isNaN(num) || num <= 0 || num > max) num = 1;
    str = num > parseInt(max.toString().charAt(0)) && num.toString().length == 1 ? '0' + num : num.toString();
  }
  console.log(str);
  return str;
};

function GetStats() {
  var stats = $(".stats");
  stats.each(function(index, record){
    ipcRenderer.invoke('getStoreValue', 'pr_setting.' + this.id).then((value) => {
      ipcRenderer.invoke('getStoreValue', 'pr_enabled.' + this.id +  '_enabled').then((check) => {
        if(check == true) {
          buy_parameters[this.id] = value;
          this.innerHTML += value
          if(this.id == 'cancel_time') {
            this.innerHTML += 's'
          } else {
            this.innerHTML += '%'
          }
        } else {
          buy_parameters[this.id] = undefined;
          this.innerHTML += '-'
        }
      });
    });
  })
}

function Buy() {
  SetHelpText();
  if(pair_input == undefined || exchange_input == undefined || amount_input == 0) {
    notify('Invalid options', 'info_bad', 'x-circle');
    return;
  }
  if (trying_to_buy == false && valid_coin) {
    ipcRenderer.send('buy-now', input_coin, pair_input, amount_input, buy_parameters, exchange_input)
    trying_to_buy = true;
    DisableButtons(false)
    DisablePanels(false)
    DisableSidebar(false)
  } else {
    notify('Invalid symbol', 'info_bad', 'x-circle');
  }
}

function SplitOrder() {
  SetHelpText();
  var coin_array = input_coin.split('-');
  console.log(coin_array)
  if(pair_input == undefined || exchange_input == undefined || amount_input == 0) {
    notify('Invalid options', 'info_bad', 'x-circle');
    return;
  }
  if (trying_to_buy == false) {
    console.log(exchange_input)
    ipcRenderer.send('split-order', true, coin_array, pair_input, exchange_input, amount_input, buy_parameters)
    trying_to_buy = true;
    DisableButtons(false)
    DisablePanels(false)
    DisableSidebar(false)
  } else {
    notify('Invalid symbol', 'info_bad', 'x-circle');
  }
}

function Scrape() {
  SetHelpText();
  if (pair_input == undefined || exchange_input == undefined || amount_input == 0) {
    notify('Invalid options', 'info_bad', 'x-circle');
    return;
  }
  if (trying_to_buy == false && scrape_input != "") {
    ipcRenderer.send('scrape-now', scrape_input, pair_input, amount_input, buy_parameters, exchange_input)
    trying_to_buy = true;
    DisableButtons(false)
    DisablePanels(false)
    DisableSidebar(false)
    ipcRenderer.once('scrape-response', function() {
      $('#start_detect_button').removeAttr('disabled');
      $('#start_detect_button').attr('onclick', "StopScrape()")
      $('#start_detect_button span').html('Stop Scraping')
      $('#start_detect_button').css('filter','hue-rotate(75deg')
      $('#scrape_status').html("Status: ON")
      ipcRenderer.once('scrape-response', (event, status) => {
        if(status == true){
          $('#start_detect_button').attr('disabled', true);
          $('#start_detect_button').attr('onclick', "Scrape()")
          $('#start_detect_button span').html('Start Scraping')
          $('#start_detect_button').css('filter','')
          $('#scrape_status').html("Status: OFF")
        } else {
          StopScrape();
        }
      });
    })
  } else {
    notify('Invalid channel', 'info_bad', 'x-circle');
  }
}

function StopScrape() {
  $('#start_detect_button').attr('onclick', "Scrape()")
  $('#start_detect_button span').html('Start Scraping')
  $('#start_detect_button').css('filter','')
  $('#scrape_status').html("Status: OFF")
  ipcRenderer.removeAllListeners('scrape-response');
  DisableButtons(true)
  DisablePanels(true)
  DisableSidebar(true)
  ipcRenderer.send('stop-scrape')
}

function SetHelpText() {
  if (exchange_input == undefined) {
    $('#pr_exchange').attr('help-text', 'Select an exchange')
  } else {
    $('#pr_exchange').removeAttr('help-text')
  }
  if (pair_input  == undefined) {
    $('#pr_pair').attr('help-text', 'Select a pair')
  } else {
    $('#pr_pair').removeAttr('help-text')
  }
  if (amount_input == 0) {
    $('#pr_amount').attr('help-text', 'Invalid amount')
  } else {
    $('#pr_amount').removeAttr('help-text')
  }
}

//BINANCE

async function CheckSymbol(input) {
  input_coin = input;
  if(pair_input == undefined && exchange_input == undefined) return;
  clearTimeout(symbolStream)
  if(input == "") {
    $('#coin_stats').hide();
    $('#pr_coin').removeClass('is_coin')
  } else {
    ipcRenderer.invoke('getPrice', pair_input.toLowerCase(), input, exchange_input).then((value) => {
      if(value != undefined) {
        $('#coin_stats').show();
        $('#pr_coin').addClass('is_coin')
        valid_coin = true;
        UpdateStats(input);
      } else {
        $('#coin_stats').hide();
        $('#pr_coin').removeClass('is_coin')
        valid_coin = false;
      }
    })
  }
}

async function UpdateStats(symbol){
  if(pair_input == undefined && exchange_input == undefined) return;
  price = await ipcRenderer.invoke('getPrice', pair_input.toLowerCase(), symbol, exchange_input)
  $('#coin_stat_price').html(parseFloat(price[0]) + ' ' + pair_input);

  $('#coin_stat_daily').html(parseFloat(price[1]).toFixed(2) + '%');
  if(parseFloat(price[1]) < 0) {
    $('#coin_stat_daily').css("color", "#cf3939")
  } else {
    $('#coin_stat_daily').css("color", "#39cf6b")
  }
  symbolStream = setTimeout(function() {UpdateStats(symbol)}, 1000);
}

function DisableButtons(active) {
  $('.pr_input, .pr_selection, .pr_button').each(function() {
    if(active) {
      $(this).removeAttr('disabled');
      trying_to_buy = false;
    } else {
      $(this).attr('disabled', true);
    }
  })
}

function SelectIcons(item) {
  var node = document.createElement("sl-icon");
  node.src = dict[item.value];
  var ico_style = "margin-right: 12px;";
  if (item.value != "binance" && item.value != "kucoin" && item.value != "hotbit"){
    ico_style += " font-size: 20px; filter: invert(90%)";
    document.querySelector('#amount_icon').src = node.src;
  }
  node.style = ico_style;
  var lab = item.shadowRoot.querySelector('.select__label');
  if(lab.querySelector('sl-icon') != null)
    lab.querySelector('sl-icon').remove()
  lab.insertBefore(node, lab.childNodes[0]);
}

function SetMaxBalance() {
  if(pair_input == undefined || exchange_input == undefined || getting_balance === true)
    return;

  ipcRenderer.send("get-balance", exchange_input, pair_input);
  getting_balance = true;
  ipcRenderer.once("set-balance", (event, balance) => {
    getting_balance = false;
    amount_input = parseFloat(balance).toFixed(8)
    $("#pr_amount").val(parseFloat(balance).toFixed(8))
  });
}