require('dotenv').config();
const  { Telegraf, Stage, session } = require('telegraf');
const Scene = require('telegraf/scenes/base'); 
const { catchTelegram } = require('telegraf/stage');
const { resize } = require('telegraf/markup');
const { enter, leave } = Stage
const bot = new Telegraf(process.env.BOT_TOKEN);
const db = require('./db/mongo')
// test methods for db
db.getAllOrders().then(res=>console.log(res))
// setTimeout(() => {
    // db.createOrder({
    //     userId: Date.now(),
    //     userAddress: 'fshfehir383838447348eyr8373',
    //     hash: 'e943439834d4dj483433djdjdhdjdfjdfjkdkdkdk',
    //     amountPLC: 100,
    //     purchaseCurrency: 'BTC',
    //     purchaseCurrencyAmount: 1,
    //     status: 'closed'
    // }).then(res=>console.log(res))
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

greeterScene.enter((ctx) => ctx.reply('Please choose variant from buttons bellow',PriceMenu))
const PriceMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([
    m.callbackButton('🚙 Buy PLC', 'Buy PLC'),
    m.callbackButton('ℹ️ Info', 'Info'),
    m.callbackButton('ℹ️ My Payments', 'My Payments'),
]).resize())
// -=-=-=-=-=-=-= GREETER SCENE -=-=-=-=-=-=-=





// -=-=-=-=-=-=-= BUING SCENE -=-=-=-=-=-=-=
buiyngScene.enter((ctx) => {
    ctx.reply('Hello! Welcome to the Platincoin! \nPlease choose or input amount PLC what you want to buy!', buiyngSceneMenu)
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
function buiyngHandler(data){
    if(data) console.log(data.message.text)
    buiyngScene.on('message', async (ctx) =>{
        let result = await parseNumber(ctx.message.text)
        if(result) {
            const voidMenu1 = Telegraf.Extra
            .markup((m) => m.keyboard([
                m.callbackButton('🔴 Cancel', 'Cancel'),
                m.callbackButton('ℹ️ Info', 'Info')
            ]).resize())
            ctx.reply(`Great! Your order was accepted! You will get ${result} PLC! \nPlease send your PLC address to recieve your Platincoin!`, voidMenu1)
            ctx.session.plc_amount = result
            // .markdown()
            ctx.scene.enter('validateAddress')
        }
        else {
            ctx.replyWithMarkdown('Ooops! The amount is not a number! Platincoin amount what you want to buy was wrong. \n*Please, send it again!*')
            buiyngHandler(ctx)
        }
    })
}
buiyngHandler()
const buiyngSceneMenu = Telegraf.Extra
.markdown()
.markup((m) => m.keyboard([[
    m.callbackButton('🅿️ 5 PLC', '5 PLC'),
    // m.callbackButton('🅿️ 25 PLC', '25 PLC'),
    m.callbackButton('🅿️ 50 PLC', '50 PLC'),
],[
    m.callbackButton('🅿️ 100 PLC', '100 PLC'),
    m.callbackButton('🅿️ 500 PLC', '500 PLC'),
    // m.callbackButton('🅿️ 1000 PLC', '1000 PLC'),
],[
    m.callbackButton('🔴 Cancel', 'Cancel'),
    m.callbackButton('ℹ️ Info', 'Info'),
]]).resize().removeKeyboard())
async function parseNumber(message){
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
validateAddressScene.enter()
console.log(`validate address scene`)

validateAddressScene.hears(['🔴 Cancel','🔴 Cancel', '🚙 Back to main', 'Back to main'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('greeter')
})
validateAddressScene.hears(['ℹ️ Info','Info'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену info`)
    ctx.scene.enter('info')
})
validateAddressScene.on('message', async (ctx) =>{
    let result = await validateAddress(ctx.message.text)
    if(result) {
        ctx.scene.enter('chooseCurrency')
    }
    else {
        let a =5 
        ctx.replyWithMarkdown('Ooops! The address is not valid! \nPlatincoin address was wrong. \n*Please, send it again!*')
    }
})
async function validateAddress(message){
    let random_boolean = Math.random() < 0.9999;
        if(random_boolean){
            return true
        } else {
            return false
        }
}
// -=-=-=-=-=-= VALIDATE ADDRESS SCENE =-=-=-=-=-=


// -=-=-=-=-=-=- CHOOSE CURRENCY SCENE =-=-=-=-=-=
choseCurrencyScene.enter((ctx) => {
    console.log(`choose currency scene`)

    ctx.reply(`Great! Please choose the currency for make a payment!`, currencyMenu)
})
choseCurrencyScene.hears(['USDT (Tether USD)','USDT', 'TUSD (TrueUSD)', 'TUSD', 'PAX (Paxos Standard)', 'PAX', 'USD (US Dollar)', 'USD', 'EUR (EURO)', 'EUR'], async (ctx) =>{
    ctx.session.paymentCurrency = `${ctx.message.text}`
    if(ctx.session.paymentCurrency === `USD (US Dollar)` || ctx.session.paymentCurrency === `EUR (EURO)`){
        ctx.reply(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${(Math.random()* 1000).toFixed(0)} PLC \nPlease choose payment method`,chooseCurrencyPaymentGatewayMenu)
        ctx.scene.enter('paymentGateway') // по идее будет 2 разных пэймэнт гатевэй для двух разных способа оплаты
    }
    else if(ctx.session.paymentCurrency === `USDT (Tether USD)`){
        ctx.replyWithMarkdown(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${(Math.random()* 1000).toFixed(0)} PLC \nNote! USDT accepted only ERC20. Send only ERC20 USDT! \n\nPress "*Continue*" to make a payment.`,chooseCurrencyPaymentGatewayMenu)
        ctx.scene.enter('paymentGateway') // по идее будет 2 разных пэймэнт гатевэй для двух разных способа оплаты
    }
    else if(ctx.session.paymentCurrency === `PAX (Paxos Standard)` || ctx.session.paymentCurrency === `TUSD (TrueUSD)`){
    ctx.reply(`Great! You choose ${ctx.session.paymentCurrency} as currency for payment \n\nYou want to buy - ${ctx.session.plc_amount} PLC \nYou need to pay - ${(Math.random()* 1000).toFixed(0)} PLC \nPlease choose payment method`,chooseCurrencyPaymentGatewayMenu)
    ctx.scene.enter('paymentGateway') // по идее будет 2 разных пэймэнт гатевэй для двух разных способа оплаты
    }
})
choseCurrencyScene.hears(['↔️ Continue','Continue'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену оплаты криптой`)
    ctx.scene.enter('paymentLinkCryptoScene')
})
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
paymentGatewayScene.enter()
console.log(`payment Gateway Scene`)
paymentGatewayScene.hears(['↔️ Continue','Continue'], (ctx) => {
    if(ctx.session.paymentCurrency === `USD (US Dollar)` || ctx.session.paymentCurrency === `EUR (EURO)`){
        console.log(`${ctx.message.text} -- здесь будет переход на сцену оплаты криптой`)
        ctx.scene.enter('paymentLinkFiat')
    }
    else if(ctx.session.paymentCurrency === `PAX (Paxos Standard)` || ctx.session.paymentCurrency === `TUSD (TrueUSD)`  || ctx.session.paymentCurrency === `USDT (Tether USD)`){
        console.log(`${ctx.message.text} -- здесь будет переход на сцену оплаты криптой`)
        ctx.scene.enter('paymentLinkCrypto')
    }
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
bot.hears(['🚙 Buy PLC','Buy PLC'], (ctx) => {
    console.log(`${ctx.message.text} -- здесь будет переход на сцену buying`)
    ctx.scene.enter('buiyng')
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
