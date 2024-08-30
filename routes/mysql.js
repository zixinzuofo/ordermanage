var mysql = require('mysql');
var config = require('./config')
var log = require('./mylog');

var pool = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : '111111',
    database : ''
});

exports.init = function init() {
    exports.databaseInit().then(()=>{
        pool.config.connectionConfig.database = 'ordermanage';
        return exports.userInfoTblInit();
    }).then(()=>{
        return exports.orderTblInit();
    }).then(()=>{
        return exports.userVerifyCodeTblInit();
    }).then(()=>{
        return exports.shippingAgentTblInit();
    }).then(()=>{
        return exports.brandNameTblInit();
    }).then(()=>{
        return exports.headTblInit();
    }).then(()=>{
        return exports.paymentMethodTblInit();
    }).then(()=>{
        return exports.authCodeTblInit();
    }).catch((err)=>{
        log.error('fail to do mysql init:', err);
    });
}

exports.databaseInit = function databaseInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = 'create database if not exists ordermanage';
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.userInfoTblInit = function userInfoTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.userInfoTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.orderTblInit = function orderTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.orderTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.userVerifyCodeTblInit = function userVerifyCodeTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.userVerifyCodeTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.shippingAgentTblInit = function shippingAgentTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.shippingAgentTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.brandNameTblInit = function brandNameTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.brandNameTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.headTblInit = function headTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.headTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.paymentMethodTblInit = function paymentMethodTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.paymentMethodTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.authCodeTblInit = function authCodeTblInit() {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = config.authenticCodeTblSql;
                conn.query(sql, (err)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.queryPrevNumber = function queryPrevNumber(year, month) {
    return new Promise((resolve, reject)=>{
        pool.getConnection((err, conn)=>{
            if (err) {
                reject(err);
            } else {
                var sql = 'select max(yearNumber) as yearNumber, (select max(monthNumber) from order_tbl where binary orderPlacedDate like ?) as monthNumber from order_tbl where binary orderPlacedDate like ? FOR UPDATE';
                var sqlParams = [year+'-'+month+'%', year+'%'];
                conn.query(sql, sqlParams, (err, results)=>{
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.addOrder = function addOrder(order, yearNumber, monthNumber){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'INSERT INTO order_tbl ( creator, updator, ';
                for (var i = 0; i < config.orderFields.length; i++) {
                    sql += config.orderFields[i];
                    if (i!=config.orderFields.length-1) {
                        sql += ', ';
                    } else {
                        sql += ') VALUES (?)';
                    }
                }
                var sqlParams = [order.userName, order.userName];
                for (var i = 0; i < config.orderFields.length; i++) {
                    if (config.orderFields[i] == 'yearNumber') {
                        sqlParams.push(yearNumber);
                    } else if (config.orderFields[i] == 'monthNumber') {
                        sqlParams.push(monthNumber);
                    } else {
                        sqlParams.push(order[config.orderFields[i]]);
                    }
                }
                sqlParams = [sqlParams];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(); // why need this?
                    }
                });
            }
        });
    });
}

exports.deleteOrder = function deleteOrder(id){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'delete from order_tbl where binary id = ?';
                var sqlParams = [id];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateOrder = function updateOrder(order){
    // 年序号、月序号不能修改
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update order_tbl set updator = ?, ';
                for (var i = 0; i < config.orderFields.length; i++) {
                    if (i!=config.orderFields.length-1) {
                        sql += (config.orderFields[i] + ' = ?, ')
                    } else {
                        sql += (config.orderFields[i] + ' = ? ')
                    }
                }
                sql += 'where binary id = ?';
                var sqlParams = [order.userName];
                for (var i = 0; i < config.orderFields.length; i++) {
                    sqlParams.push(order[config.orderFields[i]]);
                }
                sqlParams.push(order.id);
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateCheckStatus = function updateCheckStatus(userName, id, checkStatus){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'UPDATE order_tbl SET updator = ?, checkStatus = ? where binary id = ?';
                var sqlParams = [userName, checkStatus, id];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.queryOrderById = function queryOrderById(id){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from order_tbl where binary id = ? order by orderPlacedDate asc';
                var sqlParam = [id];
                conn.query(sql, sqlParam, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
};

exports.queryOrderByOrderId = function queryOrderByOrderId(orderId){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from order_tbl where binary orderId like ? order by orderPlacedDate asc';
                var sqlParam = ["%"+orderId+"%"];
                conn.query(sql, sqlParam, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
};

exports.queryOrderByMonth = function queryOrderByMonth(month){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from order_tbl where binary orderPlacedDate like ? order by orderPlacedDate asc';
                var sqlParam = [month+'%'];
                conn.query(sql, sqlParam, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
};


exports.queryOrderByDate = function queryOrderByDate(startDate, endDate){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from order_tbl where binary orderPlacedDate >= ? AND orderPlacedDate <= ?  order by orderPlacedDate asc';
                var sqlParam = [startDate, endDate];
                conn.query(sql, sqlParam, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
};

exports.queryOrderByBrandName = function queryOrderByBrandName(brandName){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from order_tbl where binary brandName = ? order by orderPlacedDate asc';
                var sqlParam = [brandName];
                conn.query(sql, sqlParam, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
};

exports.queryOrderBySalesRep = function queryOrderBySalesRep(salesRep){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from order_tbl where binary salesRep = ? order by orderPlacedDate asc';
                var sqlParam = [salesRep];
                conn.query(sql, sqlParam, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
};

exports.queryUserInfoByUserName = function queryUserInfoByUserName(userName){
    return new Promise(function(resolve, reject){
        pool.getConnection(function(err, conn){
           if (err) {
                reject(err);
            } else {
                var sql = 'select userName, userId, email, salt, password from user_info_tbl where binary userName = ?';
                var sqlParams = [userName];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    })
}

exports.queryUserPermissionByUserName = function queryUserPermissionByUserName(userName){
    return new Promise(function(resolve, reject){
        pool.getConnection(function(err, conn){
           if (err) {
                reject(err);
            } else {
                var sql = 'select role, ';
                for (var i = 0; i < config.orderFields.length; i++) {
                    if (i!=config.orderFields.length-1) {
                        sql += (config.orderFields[i] + ', ')
                    } else {
                        sql += (config.orderFields[i] + ' ')
                    }
                }
                sql += 'from user_info_tbl where binary userName = ?';
                var sqlParams = [userName];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    })
}

exports.queryAllUsers = function queryAllUsers(){
    return new Promise(function(resolve, reject){
        pool.getConnection(function(err, conn){
           if (err) {
                reject(err);
            } else {
                var sql = 'select userName from user_info_tbl where binary role != ?';
                var sqlParams = ['superAdmin'];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    })
}

exports.updateUserPermission = function updateUserPermission(userName, data){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var keys = Object.keys(data);
                var values = Object.values(data);
                var sqlParams = []
                for(var i = 0, length1 = values.length; i < length1; i++){
                    sqlParams.push(values[i]);
                }
                var tmpStr = '';
                for(var i = 0, length1 = values.length-1; i < length1; i++){
                    tmpStr = tmpStr + keys[i] + ' = ?, ';
                }
                tmpStr = tmpStr + keys[values.length-1] + ' = ? ';
                var sql = 'UPDATE user_info_tbl SET ' + tmpStr + 'where binary userName = ?';
                sqlParams.push(userName);
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.insertUserInfo = function insertUserInfo(userName, userId, password, email, salt){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
           if (err) {
                reject(err);
            } else {
                var sql = 'insert into user_info_tbl (userName, userId, password, email, salt) values (?, ?, ?, ?, ?)';
                var sqlParams = [userName, userId, password, email, salt];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    })
}

exports.querySignupCode = function querySignupCode(){
    return new Promise((resolve, reject)=>{
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select signupCode from signup_code_tbl limit 1';
                conn.query(sql, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    })
}

exports.updateSignupCode = function updateSignupCode(signupCode){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'UPDATE signup_code_tbl SET signupCode = ?';
                var sqlParams = [signupCode];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateVerifyCode = function updateVerifyCode(userName, verifyCode, createTime){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'insert into user_verify_code_tbl (userName, verifyCode, createTime) values (?, ?, ?) on duplicate key update verifyCode = ?, createTime = ?';
                var sqlParams = [userName, verifyCode, createTime, verifyCode, createTime];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(verifyCode);
                    }
                });
            }
        });
    });
}

exports.queryVerifyCode = function queryVerifyCode(userName){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select verifyCode, createTime from user_verify_code_tbl where binary userName = ?';
                var sqlParams = [userName];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.updateUserPassword = function updateUserPassword(userName, salt, password){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update user_info_tbl set salt = ?, password = ? where binary userName = ?';
                var sqlParams = [salt, password, userName];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.querySaltAndPwd = function querySaltAndPwd(userName){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select salt, password from user_info_tbl where binary userName = ?';
                var sqlParams = [userName];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.addShippingAgent = function addShippingAgent(shippingAgent) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'insert into shipping_agent_tbl (shippingAgent) values (?)';
                sqlParams = [shippingAgent]
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.deleteShippingAgent = function deleteShippingAgent(shippingAgent) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'delete from shipping_agent_tbl where binary shippingAgent = ?';
                sqlParams = [shippingAgent];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateShippingAgent = function updateShippingAgent(oldShippingAgent, newShippingAgent) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update shipping_agent_tbl set shippingAgent = ? where binary shippingAgent = ?';
                sqlParams = [newShippingAgent, oldShippingAgent];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.queryShippingAgent = function queryShippingAgent() {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select shippingAgent from shipping_agent_tbl';
                conn.query(sql, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.addbrandName = function addbrandName(brandName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'insert into brand_name_tbl (brandName) values (?)';
                sqlParams = [brandName]
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.deletebrandName = function deletebrandName(brandName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'delete from brand_name_tbl where binary brandName = ?';
                sqlParams = [brandName];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updatebrandName = function updatebrandName(oldBrandName, newBrandName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update brand_name_tbl set brandName = ? where binary brandName = ?';
                sqlParams = [newBrandName, oldBrandName];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.querybrandName = function querybrandName() {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select brandName from brand_name_tbl';
                conn.query(sql, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.addHead = function addHead(head) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'insert into head_tbl (head) values (?)';
                sqlParams = [head]
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.deleteHead = function deleteHead(head) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'delete from head_tbl where binary head = ?';
                sqlParams = [head];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateHead = function updateHead(oldHead, newHead) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update head_tbl set head = ? where binary head = ?';
                sqlParams = [newHead, oldHead];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.queryHead = function queryHead() {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select head from head_tbl';
                conn.query(sql, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.addPaymentMethod = function addPaymentMethod(paymentMethod) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'insert into payment_method_tbl (paymentMethod) values (?)';
                sqlParams = [paymentMethod]
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.deletePaymentMethod = function deletePaymentMethod(paymentMethod) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'delete from payment_method_tbl where binary paymentMethod = ?';
                sqlParams = [paymentMethod];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updatePaymentMethod = function updatePaymentMethod(oldPaymentMethod, newPaymentMethod) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update payment_method_tbl set paymentMethod = ? where binary paymentMethod = ?';
                sqlParams = [newPaymentMethod, oldPaymentMethod];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.queryPaymentMethod = function queryPaymentMethod() {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select paymentMethod from payment_method_tbl';
                conn.query(sql, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.updateOrderFlag = function updateOrderFlag(userName, id, orderFlag){
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'UPDATE order_tbl SET updator = ?, orderFlag = ? where binary id = ?';
                var sqlParams = [userName, orderFlag, id];
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.addAuthCode = function addAuthCode(authenticCode, productInfo, userName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'insert into authentic_code_tbl (authenticCode, productInfo, creator, updator) values (?, ?, ?, ?)';
                sqlParams = [authenticCode, productInfo, userName, userName]
                conn.query(sql, sqlParams, function (err) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.deleteAuthCode = function deleteAuthCode(authenticCode) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'delete from authentic_code_tbl where binary authenticCode = ?';
                sqlParams = [authenticCode];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else if (results.affectedRows === 0) {
                        reject(new Error('No rows were deleted. The authenticCode may not exist.'));
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateAuthCodeProdInfo = function updateAuthCodeProdInfo(authenticCode, productInfo, userName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update authentic_code_tbl set productInfo = ?, updator = ? where binary authenticCode = ?';
                sqlParams = [productInfo, userName, authenticCode];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else if (results.affectedRows === 0) {
                        reject(new Error('No rows were updated. The authenticCode may not exist or the productInfo is already set as requested.'));
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateAuthCodeStatus = function updateAuthCodeStatus(authenticCode, status, userName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update authentic_code_tbl set status = ?, updator = ? where binary authenticCode = ?';
                sqlParams = [status, userName, authenticCode];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else if (results.affectedRows === 0) {
                        reject(new Error('No rows were updated. The authenticCode may not exist or the status is already set as requested.'));
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.updateAuthCodeStatusNoAuth = function updateAuthCodeStatusNoAuth(authenticCode, status) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update authentic_code_tbl set status = ? where binary authenticCode = ?';
                sqlParams = [status, authenticCode];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else if (results.affectedRows === 0) {
                        reject(new Error('No rows were updated. The authenticCode may not exist or the status is already set as requested.'));
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

exports.queryAuthCode = function queryAuthCode(authenticCode) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from authentic_code_tbl where binary authenticCode = ?';
                sqlParams = [authenticCode];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.queryAuthCodeByNum = function queryAuthCodeByNum(number) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from authentic_code_tbl where binary availability = "yes" order by rand(id) limit ?';
                sqlParams = [number];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.queryAllAuthCodes = function queryAllAuthCodes() {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'select * from authentic_code_tbl';
                conn.query(sql, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            }
        });
    });
}

exports.updateAuthCodeAvailability = function updateAuthCodeAvailability(authenticCode, availability, userName) {
    return new Promise(function (resolve, reject){
        pool.getConnection(function(err, conn){
            if (err) {
                reject(err);
            } else {
                var sql = 'update authentic_code_tbl set availability = ?, updator = ? where binary authenticCode = ?';
                sqlParams = [availability, userName, authenticCode];
                conn.query(sql, sqlParams, function (err, results) {
                    conn.release();
                    if (err) {
                        reject(err);
                    } else if (results.affectedRows === 0) {
                        reject(new Error('No rows were updated. The authenticCode may not exist or the availability is already set as requested.'));
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}
