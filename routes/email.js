var nodemailer = require('nodemailer')
var config = require('./config')

smtpTransport = nodemailer.createTransport({
    service: config.email.service,
    secureConnection: true,
    secure: true,
    auth: {
        user: config.email.fromUser,
        pass: config.email.pass
    }
});

/**
 * @param {String} recipient 收件人
 * @param {String} subject 发送的主题
 * @param {String} html 发送的html内容
 */
exports.sendMail = function sendMail(recipient, subject, html) {
    return new Promise((resolve, reject)=>{
        smtpTransport.sendMail({
            from: config.email.fromUser,
            to: recipient,
            subject: subject,
            html: html
        }, function (error, response) {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    })
}