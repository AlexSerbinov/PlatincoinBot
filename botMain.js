require('dotenv').config();
const btoa = require('btoa')
const crypto = require('crypto');
const fetch = require('node-fetch')
const db = require('./db/mongo')
const  { Telegraf, Stage, session } = require('telegraf');
const Scene = require('telegraf/scenes/base'); 
const { enter, leave } = Stage
const bot = new Telegraf(process.env.BOT_TOKEN);
const { 
    USDT, 
    EUR,
    IN_PROGRESS,
} = require('./constants')
// test methods for db
// db.getAllOrders().then(res=>console.log(res))
// setTimeout(() => {
//     db.createOrder({
//         userId: Date.now(),
//         invoiceId: "4979ac8f-c44e-41d9-851b-f65a3665ffab",
//         invoiceLink: "https://coinsbit.io/merchant/4979ac8f-c44e-41d9-851b-f65a3665ffab",
//         userAddress: 'fshfehir383838447348eyr8373',
//         hash: 'e943439834d4dj483433djdjdhdjdfjdfjkdkdkdk',
//         amountPLC: 100,
//         purchaseCurrency: 'BTC',
//         purchaseCurrencyAmount: 1,
//         status: 'open',
//         timestamp: (Date.now()/1000).toFixed(),
//     }).then(res=>console.log(res))
// }, 1000);
// db.getOrdersByUserId(1596094490170).then(res=>console.log(res))
// db.deleteAllOrders().then(res=>console.log(res))


// -=-=-=-=-=-=-= GREETER SCENE -=-=-=-=-=-=-=
const greeterScene = new Scene('greeter')
const buiyngScene = new Scene('buiyng')
const infoScene = new Scene('info')
const myPaymentsHistoryScene = new Scene('myPayments')
const validateAddressScene = new Scene('validateAddress')
const choseCurrencyScene = new Scene('chooseCurrency')
const paymentGatewayScene = new Scene('paymentGateway')
const paymentLinkCryptoScene = new Scene('paymentLinkCrypto')
const paymentLinkFiatScene = new Scene('paymentLinkFiat')

const PriceMenu = Telegraf.Extra
    .markdown()
    .markup((m) => m.keyboard([
        m.callbackButton('🚙 Buy PLC', 'Buy PLC'),
        m.callbackButton('ℹ️ Info', 'Info'),
        m.callbackButton('ℹ️ My Payments', 'My Payments'),
    ]).resize())
greeterScene.enter((ctx) => ctx.reply('Please choose option from buttons bellow' ,PriceMenu))
greeterScene.hears(['🚙 Buy PLC','Buy PLC'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену buying`)
    ctx.reply('Hello! Welcome to the Platincoin! \nPlease choose or input amount PLC what you want to buy!', buiyngSceneMenu)
    ctx.scene.enter('buiyng')
})
// -=-=-=-=-=-=-= GREETER SCENE -=-=-=-=-=-=-=





// -=-=-=-=-=-=-= BUING SCENE -=-=-=-=-=-=-=
buiyngScene.enter((ctx) => {
    console.log(`buiyng scene`)
})
buiyngScene.hears(['🔴 Cancel','🔴 Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('greeter')
})
buiyngScene.hears(['ℹ️ My Payments','My Payments'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену My Payments`)
    ctx.scene.enter('myPayments')
})
buiyngScene.hears(['ℹ️ Info','Info'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('info')
})
buiyngScene.on('message', (ctx) => {
    ctx.session.plc_amount = getNumberFromString(ctx.message.text)
    if(ctx.session.plc_amount) {
        const voidMenu1 = Telegraf.Extra
        .markup((m) => m.keyboard([
            m.callbackButton('🔴 Cancel', 'Cancel'),
            m.callbackButton('ℹ️ Info', 'Info')
        ]).resize())
        if(ctx.session.currentScene){
            // console.log(`validate address if currentScene message = ${ctx.message.text}`)
            // console.log(`validate address if currentScene scene =   ${ctx.session.currentScene}`)
            ctx.scene.enter(ctx.session.currentScene)
        }
        else ctx.scene.enter('validateAddress')
    }
    else {
        ctx.replyWithMarkdown('Ooops! The amount is not a number! Platincoin amount what you want to buy was wrong. \n*Please, send it again!*')
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
        m.callbackButton('🔴 Cancel', 'Cancel'),
        m.callbackButton('ℹ️ Info', 'Info'),
    ]]).resize().removeKeyboard())
function getNumberFromString(message){
    try{
        message = message.replace(',', '.')
        let resFloat = message.match(/\d+\.\d+/g)
        if(resFloat !== null) {
            resFloat =parseFloat(resFloat[0])
            return resFloat
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
    ctx.reply(`Great! Your order was accepted! You will get ${ctx.session.plc_amount} PLC! \nPlease send your PLC address to recieve your Platincoin!`, voidMenu1)
    console.log(`validate address scene`)
})
    )

validateAddressScene.hears(['🔴 Cancel','🔴 Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('greeter')
})
validateAddressScene.hears(['ℹ️ Info','Info'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('info')
})
validateAddressScene.on('message', async (ctx) =>{
    ctx.session.userAddress = ctx.message.text
    let result = await validateAddress(ctx.message.text)
    if(result) {
        // console.log(`validate address if scene=-=-=-= ${ctx.message.text}`)
        
        if(ctx.session.currentScene){
            console.log(`validate address if currentScene message = ${ctx.message.text}`)
            console.log(`validate address if currentScene scene =   ${ctx.session.currentScene}`)
            ctx.scene.enter(ctx.session.currentScene)
        }
        else ctx.scene.enter('chooseCurrency')
    } else {
        ctx.replyWithMarkdown('Ooops! The address is not valid! \nPlatincoin address was wrong. \n*Please, send it again!*')
    }
})
async function validateAddress(message){
    if(Math.random() < 0.99) return true
    else return false
}
// -=-=-=-=-=-= VALIDATE ADDRESS SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- CHOOSE CURRENCY SCENE =-=-=-=-=-=
choseCurrencyScene.enter((ctx) => {
    console.log(`choose currency scene`)

    ctx.reply(`Great! Please choose the currency for make a payment!`, currencyMenu)
})
choseCurrencyScene.hears(['USDT (Tether USD)','USDT', 'TUSD (TrueUSD)', 'TUSD', 'PAX (Paxos Standard)', 'PAX', 'USD (US Dollar)', 'USD', 'EUR (EURO)', 'EUR'], async (ctx) =>{
    ctx.session.paymentCurrency = `${ctx.message.text}`
    // ctx.scene.enter('paymentGateway') // по идее будет 2 разных пэймэнт гатевэй для двух разных способа оплаты
    if(ctx.session.currentScene){
        console.log(`validate address if currentScene message = ${ctx.message.text}`)
        console.log(`validate address if currentScene scene =   ${ctx.session.currentScene}`)
        ctx.scene.enter(ctx.session.currentScene)
    }
    else ctx.scene.enter('paymentGateway')
})
// choseCurrencyScene.hears(['↔️ Continue','Continue'], (ctx) => {
//     console.log(`continue under scene`)

//     console.log(`${ctx.message.text} -- здесь будет переход на сцену оплаты криптой`)
//     ctx.scene.enter('paymentLinkCryptoScene')
// })
// choseCurrencyScene.hears(['⬅️ Change address','Change address'], (ctx) => {
//     console.log(`change address under scene`)
//     ctx.reply(`Please send your PLC address to recieve your Platincoin!`, voidMenu1)
//     console.log(`${ctx.message.text} -- здесь будет переход на сцену validate`)
//     ctx.session.currentScene = 'chooseCurrency'
//     ctx.scene.enter('validateAddress')
// })
choseCurrencyScene.hears(['🔴 Cancel','🔴 Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
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
    m.callbackButton('🔴 Cancel', 'Cancel'),
    m.callbackButton('ℹ️ Info', 'Info'),
]]).resize())

const chooseCurrencyPaymentGatewayMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([[
    m.callbackButton('↔️ Continue', 'Continue'),
    m.callbackButton('💶 Change currency', 'Change currency'),
],[
    m.callbackButton('⬅️ Change address', 'Change address'),
    m.callbackButton('↔️ Change amount', 'Change amount'),
],[
    m.callbackButton('🔴 Cancel', 'Cancel'),
    m.callbackButton('ℹ️ Info', 'Info'),
]]).resize().removeKeyboard())
// -=-=-=-=-=-=- CHOOSE CURRENCY SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- PAYMENT GATEWAY SCENE =-=-=-=-=-=
paymentGatewayScene.enter((ctx) => {
    console.log(`payment Gateway Scene`)
    if(ctx.session.paymentCurrency === `USD (US Dollar)` || ctx.session.paymentCurrency === `EUR (EURO)`){
        ctx.reply(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${(Math.random()* 1000).toFixed(0)} PLC \nYour address - ${ctx.session.userAddress} \nPlease choose payment method`,chooseCurrencyPaymentGatewayMenu)
    }
    else if(ctx.session.paymentCurrency === `USDT (Tether USD)`){
        ctx.replyWithMarkdown(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${(Math.random()* 1000).toFixed(0)} PLC \nYour address - ${ctx.session.userAddress} \nNote! USDT accepted only ERC20. Send only ERC20 USDT! \n\nPress "*Continue*" to make a payment.`,chooseCurrencyPaymentGatewayMenu)
    }
    else if(ctx.session.paymentCurrency === `PAX (Paxos Standard)` || ctx.session.paymentCurrency === `TUSD (TrueUSD)`){
    ctx.reply(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${(Math.random()* 1000).toFixed(0)} PLC \nYour address - ${ctx.session.userAddress} \nPlease choose payment method`,chooseCurrencyPaymentGatewayMenu)
    }

})
paymentGatewayScene.hears(['↔️ Continue','Continue'], async (ctx) => {
    const data = {
        "currency": ctx.session.paymentCurrency.split(" ")[0],
        "success_url": process.env.RETURN_URL,
        "error_url": process.env.RETURN_URL,
        "amount": ctx.session.plc_amount,
        "request": "/api/v1/merchant/generate_invoice",
        "nonce": (Date.now()/1000).toFixed()
    }
    const jsonString = JSON.stringify(data)
    const payload = btoa(jsonString)
    const signature = crypto.createHmac("sha512", process.env.API_SECRET).update(payload).digest().toString('hex')
    const url = 'https://coinsbit.io/api/v1/merchant/generate_invoice';
    const result = await fetch(url, {
        method: 'post',
        body: JSON.stringify(data),
        headers: { 
            'Content-Type': 'application/json',
            'X-TXC-APIKEY': process.env.API_KEY,
            'X-TXC-PAYLOAD': payload,
            'X-TXC-SIGNATURE': signature,
        },
    }).then(res => res.json())
    console.log('result', result)

    db.createOrder({
        userId: ctx.update.message.from.id,
        invoiceId: result.result.invoice,
        invoiceLink: result.result.redirect_link,
        userAddress: ctx.session.userAddress,
        amountPLC: result.result.amount,
        purchaseCurrency: result.result.currency,
        purchaseCurrencyAmount: 1, // вытянуть значение
        status: IN_PROGRESS,
    }).then(res=>console.log(res))



    if(ctx.session.paymentCurrency === `USD (US Dollar)` || ctx.session.paymentCurrency === `EUR (EURO)`){
        console.log(`${ctx.message.text} -- здесь будет переход на сцену оплаты криптой`)
        ctx.scene.enter('paymentLinkFiat')
    }
    else if(ctx.session.paymentCurrency === `PAX (Paxos Standard)` || ctx.session.paymentCurrency === `TUSD (TrueUSD)`  || ctx.session.paymentCurrency === `USDT (Tether USD)`){
        console.log(`${ctx.message.text} -- здесь будет переход на сцену оплаты криптой`)
        ctx.scene.enter('paymentLinkCrypto')
    }
})
paymentGatewayScene.hears(['⬅️ Change address','Change address'], (ctx) => {
    console.log(`change address under scene`)
    // ctx.reply(`Please send your PLC address to recieve your Platincoin!`, voidMenu1)
    console.log(`${ctx.message.text} -- здесь будет переход на сцену validate`)
    ctx.session.currentScene = 'paymentGateway'
    ctx.scene.enter('validateAddress')
})
paymentGatewayScene.hears(['💶 Change currency','Change currency'], (ctx) => {
    // ctx.reply(`Please send your PLC address to recieve your Platincoin!`, voidMenu1)
    console.log(`${ctx.message.text} -- здесь будет переход на сцену validate`)
    ctx.session.currentScene = 'paymentGateway'
    ctx.scene.enter('chooseCurrency')
})
paymentGatewayScene.hears(['↔️ Change amount','Change currency'], (ctx) => {
    // ctx.reply(`Please send your PLC address to recieve your Platincoin!`, voidMenu1)
    ctx.reply('Please choose or input amount PLC what you want to buy!', buiyngSceneMenu)

    console.log(`${ctx.message.text} -- здесь будет переход на сцену validate`)
    ctx.session.currentScene = 'paymentGateway'
    ctx.scene.enter('buiyng')
})
paymentGatewayScene.hears(['🔴 Cancel','🔴 Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('greeter')
})
// -=-=-=-=-=-=- PAYMENT GATEWAY SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- PAYMENT LINK CRYPTO SCENE =-=-=-=-=-=
paymentLinkCryptoScene.enter((ctx) => {
    console.log(`payment link Crypto Scene`)
    ctx.replyWithMarkdown(`Great! This order will be active in 1 day. Please go to this *<link>* and make a payment. After payment will be success you recieve the notification about status of your *${ctx.session.plc_amount}* PLC in 5 - 90 mins. \nIf you pay but don't recieve your PLC in 90 mins - please contact support@platincoin.com`, paymentlinkFiatMenu )
    console.log(ctx.session.paymentCurrency)
})

const voidMenu1 = Telegraf.Extra
.markup((m) => m.removeKeyboard().resize())
const paymentlinkFiatMenu = Telegraf.Extra
// .markdown()
.markup((m) => m.keyboard([
    m.callbackButton('🚙 Back to main', 'Back to main'),
    m.callbackButton('ℹ️ My Payments', 'My Payments'),
]).resize())
// -=-=-=-=-=-=- PAYMENT LINK SCENE =-=-=-=-=-=



// -=-=-=-=-=-=- PAYMENT LINK FIAT SCENE =-=-=-=-=-=
paymentLinkFiatScene.enter((ctx) => {
    console.log(`payment link Fiat Scene`)
    ctx.replyWithMarkdown(`Great! This order will be active in 1 day. Please go to this *<link>* and make a payment. After payment will be success you recieve the notification about status of your *${ctx.session.plc_amount}* PLC in 5 - 90 mins. \nIf you pay but don't recieve your PLC in 90 mins - please contact support@platincoin.com`, FiatPaymentMenu)
    console.log(ctx.session.paymentCurrency)
})
const FiatPaymentMenu = Telegraf.Extra
  .markdown()
  .markup((m) => m.keyboard([
    m.callbackButton('🚙 Back to main', 'Back to main'),
    m.callbackButton('ℹ️ My Payments', 'My Payments'),
]).resize())
    .markdown()
  .markup((m) => m.inlineKeyboard([[
    m.callbackButton('PayPall', 'PayPall'),
    m.callbackButton('Visa/MasterCard', 'Visa/MasterCard')],[
    m.callbackButton('QIWI', 'QIWI'),
    m.callbackButton('Yandex.Money', 'Yandex.Money'),
  ]]).resize())
// -=-=-=-=-=-=- PAYMENT LINK SCENE =-=-=-=-=-=


bot.action('PayPall', (ctx) => {
    // ctx.answerCallbackQuery('PayPall')
    // console.log(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=`)
})


// -=-=-=-=-=-=-=-= INFO SCENE -=-=-=-=-=-=-=
infoScene.enter((ctx) => ctx.reply('project Description',infoSceneMenu))
const infoSceneMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([
    m.callbackButton('🚙 Back to main', 'Back to main'),
    m.callbackButton('ℹ️ My Payments', 'My Payments'),
]).resize())
// -=-=-=-=-=-=-=-= INFO SCENE -=-=-=-=-=-=-=



// -=-=-=-=-=-= MY PAYMENTS SCENE =-=-=-=-=-=
myPaymentsHistoryScene.enter((ctx) => ctx.reply('here will be your payment history', myPaymentsHistorySceneMenu))
const myPaymentsHistorySceneMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([
    m.callbackButton('🚙 Back to main', 'Back to main'),
]).resize())
// -=-=-=-=-=-= MY PAYMENTS SCENE =-=-=-=-=-=




const stage = new Stage([greeterScene,buiyngScene, infoScene, myPaymentsHistoryScene, validateAddressScene, choseCurrencyScene, paymentGatewayScene, paymentLinkCryptoScene, paymentLinkFiatScene])
// stage.register(buiyngScene)
stage.command('cancel', leave())
bot.use(session())
bot.use(stage.middleware())
// bot.start((ctx) => ctx.scene.enter('greeter'))
bot.start((ctx) => {
    // ctx.reply('Please choose variant from buttons bellow')
    ctx.scene.enter('greeter')
})


// -=-=-=-=-=-= COMMON METHODS =-=-=-=-=-=
bot.hears(['🔴 Cancel','🔴 Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('greeter')
})
bot.hears(['ℹ️ My Payments','My Payments'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену My Payments`)
    ctx.scene.enter('myPayments')
})
bot.hears(['ℹ️ Info','Info'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('info')
})
// -=-=-=-=-=-= COMMON METHODS =-=-=-=-=-=

const helpMessage = 'help';
bot.help(ctx => {
    bot.telegram.sendMessage(ctx.from.id, helpMessage, {
        parse_mode: "markdown"
    })
})
bot.launch()


//ctx.deleteMessage(ctx.message.message_id)
// const voidMenu1 = Telegraf.Extra
// .markup((m) => m.removeKeyboard().resize())
