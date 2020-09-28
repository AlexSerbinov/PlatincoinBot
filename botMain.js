require('dotenv').config();
const db = require('./db/mongo')
const { fetchToCoinsbit, fetchCurrencyPairRate } = require('./services/fetch')
const { roundUp } = require('./services/math')
const { humanDate } = require('./services/timeConverter')
const { Telegraf, Stage, Markup, session } = require('telegraf');
const Scene = require('telegraf/scenes/base'); 
const { leave } = Stage
const StatusChecker = require('./microservices/StatusChecker')
const { 
    SUCCESS,
    IN_PROGRESS,
    GENERATE,
} = require('./constants')
const bot = new Telegraf(process.env.BOT_TOKEN);

// test methods for db
// db.getAllOrders().then(res=>console.log(res))
// db.getAllOrdersByStatus('WAITING_FOR_PAYMENT').then(res=>console.log(res))
// db.getOrderByInvoiceId('938570e3-bc7e-4344-bbc1-b4f7214a146f').then(res=>console.log(res))
// db.addInternalCoinsbitTxId('5cfac364-449a-4e2c-816e-146031b41795','18d8997d-064a-466d-ab08-f50c6102b1c2').then(res=>console.log(res))
// db.deleteAllOrders().then(res=>console.log(res))
// db.deleteOrderByInvoiceId('7256abbd-b4b7-4605-b773-6e6b011de3d9').then(res=>console.log(res))
// db.deleteAllOrdersByUserId('350985285').then(res=>console.log(res))
// db.addTxHash('8626be93-7e97-42a0-87cf-0fda4e1b3b76', "hashhash-hsah").then(res=>console.log(res))
// db.changeInvoiceStatus("938570e3-bc7e-4344-bbc1-b4f7214a146f", "WAITING_FOR_PAYMENT").then(res=>console.log(res))
// db.changePaidCurrencyAmount("938570e3-bc7e-4344-bbc1-b4f7214a146f", 11.2).then(res=>console.log(res))
// db.changeBalanceToTradeStatus("a460bc7d-4892-43fb-bdeb-1de639be6827", false).then(res=>console.log(res))
// db.addInternalCoinsbitTxId("e82ba4c8-9d09-46f8-ae63-0108fd526bb0", "c9321762-3109-4eaf-afe8-cd62ebf1702d").then(res=>console.log(res))
// db.getAllOrdersByStatus(SUCCESS).then(res=>console.log(res))
// db.getOrdersByUserId(350985285).then(res=>console.log(res))

// -=-=-=-=-=-=-= GREETER SCENE -=-=-=-=-=-=-=
const greeterScene = new Scene('greeter')
const buiyngScene = new Scene('buiyng')
const infoScene = new Scene('info')
const myPaymentsHistoryScene = new Scene('myPayments')
const validateAddressScene = new Scene('validateAddress')
const choseCurrencyScene = new Scene('chooseCurrency')
const paymentGatewayScene = new Scene('paymentGateway')
const paymentLinkCryptoScene = new Scene('paymentLinkCrypto')

const PriceMenu = Telegraf.Extra
    .markdown()
    .markup((m) => m.keyboard([
        m.callbackButton('💰 Buy PLC', 'Buy PLC'),
        m.callbackButton('ℹ️ Info', 'Info'),
        m.callbackButton('ℹ️ My Payments', 'My Payments'),
    ]).resize())
greeterScene.enter((ctx) => {
    ctx.replyWithMarkdown('Hello! Welcome to the *Platincoin*! \nPlease choose option from buttons bellow' ,PriceMenu)
    ctx.session.currentSceneForInfo = 'greeter'
})
greeterScene.hears(['💰 Buy PLC','Buy PLC'], (ctx) => {
    ctx.reply('Please choose or input amount PLC what you want to buy!', buiyngSceneMenu)
    ctx.scene.enter('buiyng')
})
// -=-=-=-=-=-=-= GREETER SCENE -=-=-=-=-=-=-=



// -=-=-=-=-=-=-= BUING SCENE -=-=-=-=-=-=-=
buiyngScene.enter((ctx) => {
    ctx.session.currentSceneForInfo = 'buiyng'
})
buiyngScene.hears(['❌ Cancel','❌ Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    ctx.scene.enter('greeter')
})
buiyngScene.hears(['ℹ️ My Payments','My Payments'], (ctx) => {
    showPaymentHistory(ctx)
})
buiyngScene.hears(['ℹ️ Info','Info'], (ctx) => {
    ctx.reply('PLATINCOIN (PLC) is a blockchain product and digital currency designed to address online payment challenges. PLC is a cryptocurrency with its own closed ecosystem. We are provide various opportunities, such as Power Minter and PLC Secure Box for passive earnings, ATM cryptomats for instant transfer of PLC to fiat, PoS terminals for paying for goods and services using PLC, Marketplace for selling your own goods and developing your business. \nSite: https://platincoin.com/en \nWe on CoinMarketCap: https://coinmarketcap.com/ru/currencies/platincoin/')

})
buiyngScene.on('message', (ctx) => {
    ctx.session.plc_amount = getNumberFromString(ctx.message.text)
    if(ctx.session.plc_amount) {
        if(ctx.session.plc_amount <2 || ctx.session.plc_amount>1000000) ctx.replyWithMarkdown(`Ooops! The amount must be at least 2 PLC and no more than 1000000 PLC`)
        else{  
            const voidMenu1 = Telegraf.Extra
            .markup((m) => m.keyboard([
                m.callbackButton('❌ Cancel', 'Cancel'),
                m.callbackButton('ℹ️ Info', 'Info')
            ]).resize())
            if(ctx.session.currentScene){
                ctx.scene.enter(ctx.session.currentScene)
            }
            else ctx.scene.enter('validateAddress')
        }
    }
    else {
        ctx.replyWithMarkdown('Ooops! The amount is not a number! *Platincoin* amount what you want to buy was wrong. \n*Please, send it again!*')
    }
})
const buiyngSceneMenu = Telegraf.Extra
    .markdown()
    .markup((m) => m.keyboard([[
        m.callbackButton('🅿️ 5 PLC', '5 PLC'),
        m.callbackButton('🅿️ 50 PLC', '50 PLC'),
    ],[
        m.callbackButton('🅿️ 100 PLC', '100 PLC'),
        m.callbackButton('🅿️ 500 PLC', '500 PLC'),
    ],[
        m.callbackButton('❌ Cancel', 'Cancel'),
        m.callbackButton('ℹ️ Info', 'Info'),
    ]]).resize().removeKeyboard())
function getNumberFromString(message){
    try{
        message = message.replace(',', '.')
        let resFloat = message.match(/\d+\.\d+/g)
        if(resFloat !== null) {
            resFloat = parseFloat(resFloat[0])
            return resFloat.toFixed(4)
        } else {
            message.match(/\d+/)
            resInt = parseInt(message.replace(/[^\d]/g, ''))
            return resInt
        }
    } catch(e) {
        return e 
    }
}
// -=-=-=-=-=-=-= BUING SCENE -=-=-=-=-=-=-=

  


// -=-=-=-=-=-= VALIDATE ADDRESS SCENE =-=-=-=-=-=
validateAddressScene.enter((ctx => {
    ctx.reply(`Great! Your order was accepted! You will get ${ctx.session.plc_amount} PLC! \nPlease, *send your PLC address* to recieve your *Platincoin*!`, validateAddressSceneMenu)
})
    )
validateAddressScene.hears(['❌ Cancel','❌ Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    ctx.scene.enter('greeter')
})
validateAddressScene.hears(['ℹ️ Info','Info'], (ctx) => {
    ctx.reply('PLATINCOIN (PLC) is a blockchain product and digital currency designed to address online payment challenges. PLC is a cryptocurrency with its own closed ecosystem. We are provide various opportunities, such as Power Minter and PLC Secure Box for passive earnings, ATM cryptomats for instant transfer of PLC to fiat, PoS terminals for paying for goods and services using PLC, Marketplace for selling your own goods and developing your business. \nSite: https://platincoin.com/en \nWe on CoinMarketCap: https://coinmarketcap.com/ru/currencies/platincoin/')
})
validateAddressScene.hears(['ℹ️ My Payments', 'My Payments'], (ctx) => {
    showPaymentHistory(ctx)
})
validateAddressScene.hears(['⬅️ Change amount','Change amount'], (ctx) => {
    ctx.reply(`Please, send new amount in PLC`, buiyngSceneMenu)
    ctx.scene.enter('buiyng')
})
validateAddressScene.on('message', (ctx) =>{
    ctx.session.userAddress = ctx.message.text
    const result = validateAddress(ctx.message.text)
    if(result) {
        if(ctx.session.currentScene){
            ctx.scene.enter(ctx.session.currentScene)
        }
        else ctx.scene.enter('chooseCurrency')
    } else {
        ctx.replyWithMarkdown('Ooops! The address is not valid! \n*Platincoin* address was wrong. \n*Please, send it again!*')
    }
})
const validateAddressSceneMenu = Telegraf.Extra
    .markdown()
    .markup((m) => m.keyboard([[
        m.callbackButton('⬅️ Change amount', 'Change amount'),
        m.callbackButton('❌ Cancel', 'Cancel'),
    ],[
        m.callbackButton('ℹ️ My Payments', 'My Payments'),
        m.callbackButton('ℹ️ Info', 'Info'),
    ]]).resize())

const validateAddress = address => {
    return address.match(/^P{1}[a-km-zA-HJ-NP-Z1-9]{25,38}$/gm)
}
// -=-=-=-=-=-= VALIDATE ADDRESS SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- CHOOSE CURRENCY SCENE =-=-=-=-=-=
choseCurrencyScene.enter((ctx) => {
    ctx.reply(`Great! Please choose the currency for make a payment!`, currencyMenu)
})
choseCurrencyScene.hears(['USDT (Tether USD)','USDT', 'TUSD (TrueUSD)', 'TUSD', 'PAX (Paxos Standard)', 'PAX', 'USD (US Dollar)', 'USD', 'EUR (EURO)', 'EUR'], async (ctx) =>{
    ctx.session.paymentCurrency = `${ctx.message.text}`
    if(ctx.session.paymentCurrency) ctx.session.currencyRate = await fetchCurrencyPairRate(ctx.session.paymentCurrency)
    if(ctx.session.currentScene){
        ctx.scene.enter(ctx.session.currentScene)
    }
    else ctx.scene.enter('paymentGateway')
})

choseCurrencyScene.hears(['❌ Cancel','❌ Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    ctx.scene.enter('greeter')
})
const currencyMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([[
    m.callbackButton('USDT (Tether USD)', 'USDT (Tether USD)')],[
    m.callbackButton('TUSD (TrueUSD)', 'TUSD (TrueUSD)')],[
    m.callbackButton('PAX (Paxos Standard)', 'PAX (Paxos Standard)')],[
    m.callbackButton('USD (US Dollar)', 'USD (US Dollar)')],[
    m.callbackButton('EUR (EURO)', 'EUR (EURO)')
],[
    m.callbackButton('❌ Cancel', 'Cancel'),
    m.callbackButton('ℹ️ Info', 'Info'),
]]).resize())

const chooseCurrencyPaymentGatewayMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([[
    m.callbackButton('✅ Continue', 'Continue'),
    m.callbackButton('⬅️ Change currency', 'Change currency'),
],[
    m.callbackButton('⬅️ Change address', 'Change address'),
    m.callbackButton('⬅️ Change amount', 'Change amount'),
],[
    m.callbackButton('❌ Cancel', 'Cancel'),
    m.callbackButton('ℹ️ Info', 'Info'),
]]).resize().removeKeyboard())
// -=-=-=-=-=-=- CHOOSE CURRENCY SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- PAYMENT GATEWAY SCENE =-=-=-=-=-=
paymentGatewayScene.enter((ctx) => {
    if((ctx.session.paymentCurrency === `USD (US Dollar)` || ctx.session.paymentCurrency === `EUR (EURO)`) && ctx.session.currencyRate){
        ctx.session.purchaseCurrencyAmount = roundUp((ctx.session.plc_amount*ctx.session.currencyRate),-2)
        ctx.reply(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${ctx.session.purchaseCurrencyAmount} ${ctx.session.paymentCurrency.split(" ")[0]} plus deposit fee\nYour address - ${ctx.session.userAddress} \n\nPress "*Continue*" to make a payment.`,chooseCurrencyPaymentGatewayMenu)
    } else if(ctx.session.paymentCurrency === `USDT (Tether USD)` && ctx.session.currencyRate){
        ctx.session.purchaseCurrencyAmount = roundUp((ctx.session.plc_amount*ctx.session.currencyRate),-4)
        ctx.replyWithMarkdown(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${ctx.session.purchaseCurrencyAmount} ${ctx.session.paymentCurrency.split(" ")[0]} plus deposit fee\nYour address - ${ctx.session.userAddress} \n\n*Note!* USDT accepted only ERC20. Send only ERC20 USDT! \n\nPress "*Continue*" to make a payment.`,chooseCurrencyPaymentGatewayMenu)
    } else if((ctx.session.paymentCurrency === `PAX (Paxos Standard)` || ctx.session.paymentCurrency === `TUSD (TrueUSD)`) && ctx.session.currencyRate){
        ctx.session.purchaseCurrencyAmount = roundUp((ctx.session.plc_amount*ctx.session.currencyRate),-4)
        ctx.reply(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${ctx.session.purchaseCurrencyAmount} ${ctx.session.paymentCurrency.split(" ")[0]} plus deposit fee\nYour address - ${ctx.session.userAddress} \n\nPress "*Continue*" to make a payment.`,chooseCurrencyPaymentGatewayMenu)
    } else ctx.reply(`Sorry, there was an error in calculating the purchase ${ctx.session.paymentCurrency} amount`, paymentlinkFiatMenu)

})
paymentGatewayScene.hears(['✅ Continue','Continue'], async (ctx) => {
    const data = {
        "currency": ctx.session.paymentCurrency.split(" ")[0],
        "success_url": process.env.RETURN_URL,
        "error_url": process.env.RETURN_URL,
        "amount": ctx.session.purchaseCurrencyAmount,
        "request": "/api/v1/merchant/generate_invoice",
        "nonce": (Date.now()/1000).toFixed()
    }
    const result = await fetchToCoinsbit(data, GENERATE)
    if(result.success === true) {
        db.createOrder({
            userId: ctx.update.message.from.id,
            invoiceId: result.result.invoice,
            invoiceLink: result.result.redirect_link,
            userAddress: ctx.session.userAddress,
            amountPLC: ctx.session.plc_amount,
            purchaseCurrency: result.result.currency,
            purchaseCurrencyAmount: (ctx.session.plc_amount*ctx.session.currencyRate).toFixed(4),
            invoiceStatus: IN_PROGRESS,
        })//.then(res=>console.log(res))
        ctx.session.InvoiceLink = result.result.redirect_link
    }
    if(ctx.session.paymentCurrency === `PAX (Paxos Standard)` || ctx.session.paymentCurrency === `TUSD (TrueUSD)`  || ctx.session.paymentCurrency === `USDT (Tether USD)`|| ctx.session.paymentCurrency === `USD (US Dollar)` || ctx.session.paymentCurrency === `EUR (EURO)`){
        ctx.scene.enter('paymentLinkCrypto')
    }
})
paymentGatewayScene.hears(['⬅️ Change address','Change address'], (ctx) => {
    // ctx.reply(`Please send your PLC address to recieve your *Platincoin*!`, voidMenu1)
    ctx.session.currentScene = 'paymentGateway'
    ctx.scene.enter('validateAddress')
})
paymentGatewayScene.hears(['⬅️ Change currency','Change currency'], (ctx) => {
    ctx.session.currentScene = 'paymentGateway'
    ctx.scene.enter('chooseCurrency')
})
paymentGatewayScene.hears(['⬅️ Change amount','Change currency'], (ctx) => {
    ctx.reply('Please choose or input amount PLC what you want to buy!', buiyngSceneMenu)
    ctx.session.currentScene = 'paymentGateway'
    ctx.scene.enter('buiyng')
})
paymentGatewayScene.hears(['❌ Cancel','❌ Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    ctx.scene.enter('greeter')
})
// -=-=-=-=-=-=- PAYMENT GATEWAY SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- PAYMENT LINK CRYPTO SCENE =-=-=-=-=-=
paymentLinkCryptoScene.enter((ctx) => {
    if(ctx.session.InvoiceLink){
        ctx.replyWithMarkdown('Please wait, order is being created...', PriceMenu)
            setTimeout(() => {
            ctx.replyWithMarkdown(`Great! This order will be active in 1 day. Please click on **[Go to Invoice](${ctx.session.InvoiceLink})** and make a payment. After payment will be success you recieve the notification about status of your *${ctx.session.plc_amount}* PLC in 5 - 90 mins. \nIf you pay but don't recieve your PLC in 90 mins - please contact support@platincoin.com`,  {
                reply_markup: Markup.inlineKeyboard([[
                    {
                        text: `Go to invoice`,
                        url: `${ctx.session.InvoiceLink}`,
                    },
                ]]).resize()
            })
        }, 100);
    } else ctx.replyWithMarkdown(`Sorry, there was an error during invoice creation, please try again`, paymentlinkFiatMenu)
})
paymentLinkCryptoScene.hears(['💰 Buy PLC','Buy PLC'], (ctx) => {
    ctx.reply('Please choose or input amount PLC what you want to buy!', buiyngSceneMenu)
    ctx.scene.enter('buiyng')
})
const paymentlinkFiatMenu = Telegraf.Extra
.markup((m) => m.keyboard([
    m.callbackButton('❌ Cancel', 'Back to main'),
    m.callbackButton('ℹ️ My Payments', 'My Payments'),
]).resize())
.markdown()
// -=-=-=-=-=-=- PAYMENT LINK SCENE =-=-=-=-=-=



// -=-=-=-=-=-=-=-= INFO SCENE -=-=-=-=-=-=-=
infoScene.enter((ctx) => {
    ctx.reply('PLATINCOIN (PLC) is a blockchain product and digital currency designed to address online payment challenges. PLC is a cryptocurrency with its own closed ecosystem. We are provide various opportunities, such as Power Minter and PLC Secure Box for passive earnings, ATM cryptomats for instant transfer of PLC to fiat, PoS terminals for paying for goods and services using PLC, Marketplace for selling your own goods and developing your business. \nSite: https://platincoin.com/en \nWe on CoinMarketCap: https://coinmarketcap.com/ru/currencies/platincoin/')
})
const infoSceneMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([
    m.callbackButton('🚙 Back', 'Back'),
]).resize())
// -=-=-=-=-=-=-=-= INFO SCENE -=-=-=-=-=-=-=


// -=-=-=-=-=-= MY PAYMENTS SCENE =-=-=-=-=-=
async function showPaymentHistory(ctx){
    let allOrdersByUser = await db.getOrdersByUserId(ctx.message.chat.id)
    let sortArray = allOrdersByUser.sort((function(a, b){
        return a.timestamp-b.timestamp
    }))
    if(allOrdersByUser.length === 0) ctx.replyWithMarkdown(`You don't have any transactions yet!`)
    else {
        let i = 0;
        let timer = setInterval(function() {
            if (i >= sortArray.length) {
                clearInterval(timer);
            } else {
                if(sortArray[i].invoiceStatus !== 'CANCEL'){
                    if(sortArray[i].hash){
                        ctx.replyWithMarkdown(`${humanDate(sortArray[i].timestamp*1000)}\n*invoice*: ${sortArray[i].invoiceId}\n*address*:${sortArray[i].userAddress}\n*amount*: ${sortArray[i].finalSendedPlc} PLC\n*paid*: ${sortArray[i].paidCurrencyAmount} ${sortArray[i].purchaseCurrency} plus deposit fee\n*txHash*: https://platincoin.info/#/tx/${sortArray[i].hash}`, {parse_mode: "markdown"})
                    } else {
                        ctx.replyWithMarkdown(`${humanDate(sortArray[i].timestamp*1000)}\n*invoice*: ${sortArray[i].invoiceId}\n*address*:${sortArray[i].userAddress}\n*amount*: ${sortArray[i].finalSendedPlc} PLC\n*paid*: ${sortArray[i].paidCurrencyAmount} ${sortArray[i].purchaseCurrency} plus deposit fee\n*txHash*:\n`, {parse_mode: "markdown"})
                    }
                }
                i++
            }
        }, 10);
    }
}

const stage = new Stage([greeterScene,buiyngScene, infoScene, myPaymentsHistoryScene, validateAddressScene, choseCurrencyScene, paymentGatewayScene, paymentLinkCryptoScene])
stage.command('cancel', leave())
bot.use(session())
bot.use(stage.middleware())
bot.start((ctx) => {
    ctx.scene.enter('greeter')
})

// -=-=-=-=-=-= COMMON METHODS =-=-=-=-=-=
bot.hears(['❌ Cancel','❌ Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    ctx.scene.enter('greeter')
})
bot.hears(['ℹ️ My Payments','My Payments'], (ctx) => {
    showPaymentHistory(ctx)
})
bot.hears(['💰 Buy PLC','Buy PLC'], (ctx) => {
    ctx.reply('Please choose or input amount PLC what you want to buy!', buiyngSceneMenu)
    ctx.scene.enter('buiyng')
})
bot.hears(['ℹ️ Info','Info'], (ctx) => {
    ctx.replyWithMarkdown('*PLATINCOIN* (PLC) is a blockchain product and digital currency designed to address online payment challenges. PLC is a cryptocurrency with its own closed ecosystem. We are provide various opportunities, such as Power Minter and PLC Secure Box for passive earnings, ATM cryptomats for instant transfer of PLC to fiat, PoS terminals for paying for goods and services using PLC, Marketplace for selling your own goods and developing your business. \nSite: https://platincoin.com/en \nWe on CoinMarketCap: https://coinmarketcap.com/ru/currencies/platincoin/')

})
// -=-=-=-=-=-= COMMON METHODS =-=-=-=-=-=

bot.launch()

const sendMessageToId = (userId, messageData) => {
    bot.telegram.sendMessage(userId, messageData, {
        parse_mode: "markdown"
    })
}

const statusChecker = new StatusChecker(db, fetchToCoinsbit, fetchCurrencyPairRate, sendMessageToId);
statusChecker.paidStatusChecher();
statusChecker.statusPlcChecher();
statusChecker.succesStatusChecker();
