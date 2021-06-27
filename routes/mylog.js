var path = require('path');
var utils = require('./utils');

function fatal(msg, js) {
    var info = stackInfo();
    var method = info['method'];
    var file = info['file'];
    var line = info['line'];
    var now = utils.getBeijingTime();
    if (js != undefined) {
        msg = msg + ' ' + JSON.stringify(js);
    }
    console.log(now + "|FATAL|" + file + "|" + method + "|" + line + "|" + msg);
}

function error(msg, js) {
    var info = stackInfo();
    var method = info['method'];
    var file = info['file'];
    var line = info['line'];
    var now = utils.getBeijingTime();
    if (js != undefined) {
        msg = msg + ' ' + JSON.stringify(js);
    }
    console.log(now + "|ERROR|" + file + "|" + method + "|" + line + "|" + msg);
}

function warn(msg, js) {
    var info = stackInfo();
    var method = info['method'];
    var file = info['file'];
    var line = info['line'];
    var now = utils.getBeijingTime();
    if (js != undefined) {
        msg = msg + ' ' + JSON.stringify(js);
    }
    console.log(now + "|WARN|" + file + "|" + method + "|" + line + "|" + msg);
}

function info(msg, js) {
    var info = stackInfo();
    var method = info['method'];
    var file = info['file'];
    var line = info['line'];
    var now = utils.getBeijingTime();
    if (js != undefined) {
        msg = msg + ' ' + JSON.stringify(js);
    }
    console.log(now + "|INFO|" + file + "|" + method + "|" + line + "|" + msg);
}

function debug(msg, js) {
    var info = stackInfo();
    var method = info['method'];
    var file = info['file'];
    var line = info['line'];
    var now = utils.getBeijingTime();
    if (js != undefined) {
        msg = msg + ' ' + JSON.stringify(js);
    }
    console.log(now + "|DEBUG|" + file + "|" + method + "|" + line + "|" + msg);
}

function stackInfo() {
    var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i;
    var stackReg2 = /at\s+()(.*):(\d*):(\d*)/i;
    var stacklist = (new Error()).stack.split('\n').slice(3);
    var s = stacklist[0];
    var sp = stackReg.exec(s) || stackReg2.exec(s);
    var data = {};
    if (sp && sp.length === 5) {
        data.method = sp[1];
        data.path = sp[2];
        data.line = sp[3];
        data.pos = sp[4];
        data.file = path.basename(data.path);
    }

    return data;
}

// function test() {
//     error('a');
// }

// test()

module.exports = {
    fatal,
    error,
    warn,
    info,
    debug
}