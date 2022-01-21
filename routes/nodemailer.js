const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const CLIENT_ID = `1080009627535-0hb4ah9e0ovm9l08bep1fjrjmbpf03o7.apps.googleusercontent.com`;
const CLIENT_SECRET = `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`;
const REDIRECT_URI = `https://developers.google.com/oauthplayground/`;
const REFRESH_TOKEN = `1//04PkHbEV7yNJzCgYIARAAGAQSNwF-L9IrBQQKa4YXoI2Ghjy2aKya-IL_3DgGyPonB5X44F3L1W1EeE5Wx6UY2tVCymXZ_c5I9ZM`;

const oauthclient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oauthclient.setCredentials({refresh_token: REFRESH_TOKEN});

async function sendMail(receiver, text){ 
  try{
    const access_token = await oauthclient.getAccessToken();
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: "OAuth2",
        user:"ymandlekar9826@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: access_token
      }
    })

    const mailOpts = {
      from: "ymandlekar9826@gmail.com",
      to: receiver,
      subject: "Test test",
      text: "That was Easy",
      html: text
    }

    const result = await transport.sendMail(mailOpts);
    return result;
  }
  catch(err){
    return err;
  }
}

module.exports = sendMail;