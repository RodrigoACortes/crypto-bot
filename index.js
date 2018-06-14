'use strict';
// import personal id info
const auth = require('./auth.json');
// exchange library
const ccxt = require('ccxt');
const _ = require('lodash');

let coin1 = 'XMR';
let coin2 = 'BTC';
let sourceRef = 'okex';
let sourecTrade = 'cryptopia';
let offsetPercent = 0.5;

let exchangeRef = new ccxt[sourceRef](); // eslint-disable-line
let exchangeTrade = new ccxt[sourecTrade]({
  apiKey: auth.CRYPTOPIA_PUBLIC_KEY,
  secret: auth.CRYPTOPIA_PRIVATE_KEY
}); // eslint-disable-line

startBot();

// function loads initial assets
async function startBot () {
  try {
    await exchangeRef.loadMarkets();
    await exchangeTrade.loadMarkets();

    loopBot();
  } catch (err) {
    console.error(err);
  }
}

let priceIn;
let priceAVG;
let balance;

async function loopBot () {
  // repeats bot loop

  // combines both coins to pass as a pair
  let pairCoins = coin1 + '/' + coin2;

  try {
    // gets price info
    priceIn = await exchangeRef.fetchTicker(pairCoins);
    // calculates average for reference
    priceAVG = _.floor(0.5 * priceIn.bid + 0.5 * priceIn.ask, 8);
  } catch (e) { console.error('ERROR: fetchTicker', e); }

  try {
    // gets my current balance
    balance = await exchangeTrade.fetch_balance();
    console.log(exchangeRef.id, priceIn.symbol, 'Reference Price: ' + priceAVG);
    console.log(exchangeTrade.id, balance.LTC.total, coin1);
    console.log(exchangeTrade.id, balance.BTC.total, coin2);
    console.log('---------------------------------');
  } catch (e) { console.error('ERROR: fetch_balance', e); }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // cancel all orders
    await exchangeTrade.cancelOrder(undefined, undefined, { type: 'All' });
    console.log('Cancel Success!');
  } catch (e) { console.error('ERROR: cancelOrder'); }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // place an order
    let buyOrderPrice = priceAVG * (100 - offsetPercent) / 100.0;
    let buyOrderAmount = _.floor(balance[coin2].total * 0.9 / buyOrderPrice, 8);
    await exchangeTrade.createLimitBuyOrder(pairCoins, buyOrderAmount, buyOrderPrice);
    console.log('Buy Success!');
  } catch (e) { console.error('ERROR: buyOrderPrice'); }

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    let sellOrderPrice = priceAVG * (100 + offsetPercent) / 100.0;
    let sellOrderAmount = _.floor(balance[coin1].total * 0.9, 8);
    await exchangeTrade.createLimitSellOrder(pairCoins, sellOrderAmount, sellOrderPrice);
    console.log('Sell Placed!');
  } catch (err) {
    console.error('ERROR: sell');
  }
  await new Promise(resolve => setTimeout(resolve, 30000));

  startBot();
}
