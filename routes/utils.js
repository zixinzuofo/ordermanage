const offset = (new Date).getTimezoneOffset();

Date.prototype.format = function(format) {
       var date = {
              "M+": this.getMonth() + 1,
              "d+": this.getDate(),
              "h+": this.getHours(),
              "m+": this.getMinutes(),
              "s+": this.getSeconds(),
              "q+": Math.floor((this.getMonth() + 3) / 3),
              "S+": this.getMilliseconds()
       };
       if (/(y+)/i.test(format)) {
              format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
       }
       for (var k in date) {
              if (new RegExp("(" + k + ")").test(format)) {
                     format = format.replace(RegExp.$1, RegExp.$1.length == 1
                            ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
              }
       }
       return format;
}

function createSalt() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_+=?!@#$%^&*()';
    var n = chars.length;
    var salt = '';
    for(i = 0; i < 32; i++){
        salt += chars.charAt(Math.floor(Math.random() * n));
    }
    return salt;
}

function generateVerifyCode() {
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var n = chars.length;
    var verificationCode = '';
    for(i = 0; i < 6; i++){
        verificationCode += chars.charAt(Math.floor(Math.random() * n));
    }
    return verificationCode;
}

function convertTimeToCST(time) {
    if (time == null) {
        return time;
    }
    var t = new Date(time).format('yyyy-MM-dd hh:mm:ss');
    return t;
}

function convertDateToCST(time) {
    if (time == null) {
        return time;
    }
    var t = new Date(time).format('yyyy-MM-dd');
    return t;
}

function getBeijingTime() {
    var p = new Date(Date.now()+(480+offset)*60*1000);
    return p.format('yyyy-MM-dd hh:mm:ss');
}

function getBeijingDate() {
    var p = new Date(Date.now()+(480+offset)*60*1000);
    return p.format('yyyy-MM-dd');
}

module.exports = {
    Date,
	createSalt,
    generateVerifyCode,
	convertTimeToCST,
    convertDateToCST,
    getBeijingTime,
    getBeijingDate
}