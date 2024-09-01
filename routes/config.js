module.exports = {
    email: {
        service: 'qq',
        subject: '密码重置',
        fromUser: '876853809@qq.com',
        pass: 'uwlalnhppenabbed'
    },
    pwdUpdate: {
        timeout: 10 * 60
    },
    orderFields: [
        "orderPlacedDate",
        "yearNumber",
        "monthNumber",
        "orderId",
        "comment",
        "orderSource",
        "paymentMethod",
        "brandName",
        "height",
        "bodyShape",
        "head",
        "paymentUSD",
        "paymentCNY",
        "factoryCost",
        "EVO",
        "extraHead",
        "luckyBox",
        "flightCase",
        "DHLEUB",
        "accessoriesPrice",
        "otherAccessories",
        "shippingCost",
        "totalProfit",
        "commission",
        "commissionPercentage",
        "designer",
        "companyProfit",
        "confirmTime",
        "shipTime",
        "shippingAgent",
        "domesticTrackingNumber",
        "trackingNumber",
        "salesRep",
        "checkStatus",
        "orderFlag"
    ],
    userInfoTblSql: "CREATE TABLE if not exists `user_info_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `userName` varchar(20) NOT NULL,\
                    `userId` varchar(32) NOT NULL,\
                    `email` varchar(100) NOT NULL,\
                    `salt` varchar(32) NOT NULL,\
                    `password` varchar(40) NOT NULL,\
                    `role` varchar(40) NOT NULL DEFAULT 'normalUser',\
                    `orderPlacedDate` int(10) unsigned NOT NULL DEFAULT '0',\
                    `yearNumber` int(10) unsigned NOT NULL DEFAULT '0',\
                    `monthNumber` int(10) unsigned NOT NULL DEFAULT '0',\
                    `orderId` int(10) unsigned NOT NULL DEFAULT '0',\
                    `comment` int(10) unsigned NOT NULL DEFAULT '0',\
                    `orderSource` int(10) unsigned NOT NULL DEFAULT '0',\
                    `paymentMethod` int(10) unsigned NOT NULL DEFAULT '0',\
                    `brandName` varchar(256) NOT NULL DEFAULT '',\
                    `height` int(10) unsigned NOT NULL DEFAULT '0',\
                    `bodyShape` int(10) unsigned NOT NULL DEFAULT '0',\
                    `head` int(10) unsigned NOT NULL DEFAULT '0',\
                    `paymentUSD` int(10) unsigned NOT NULL DEFAULT '0',\
                    `paymentCNY` int(10) unsigned NOT NULL DEFAULT '0',\
                    `factoryCost` int(10) unsigned NOT NULL DEFAULT '0',\
                    `EVO` int(10) unsigned NOT NULL DEFAULT '0',\
                    `extraHead` int(10) unsigned NOT NULL DEFAULT '0',\
                    `luckyBox` int(10) unsigned NOT NULL DEFAULT '0',\
                    `flightCase` int(10) unsigned NOT NULL DEFAULT '0',\
                    `DHLEUB` int(10) unsigned NOT NULL DEFAULT '0',\
                    `otherAccessories` int(10) unsigned NOT NULL DEFAULT '0',\
                    `accessoriesPrice` int(10) unsigned NOT NULL DEFAULT '0',\
                    `shippingCost` int(10) unsigned NOT NULL DEFAULT '0',\
                    `totalProfit` int(10) unsigned NOT NULL DEFAULT '0',\
                    `commission` int(10) unsigned NOT NULL DEFAULT '0',\
                    `commissionPercentage` int(10) unsigned NOT NULL DEFAULT '0',\
                    `designer` int(10) unsigned NOT NULL DEFAULT '0',\
                    `companyProfit` int(10) unsigned NOT NULL DEFAULT '0',\
                    `confirmTime` int(10) unsigned NOT NULL DEFAULT '0',\
                    `shipTime` int(10) unsigned NOT NULL DEFAULT '0',\
                    `shippingAgent` int(10) unsigned NOT NULL DEFAULT '0',\
                    `domesticTrackingNumber` int(10) unsigned NOT NULL DEFAULT '0',\
                    `trackingNumber` int(10) unsigned NOT NULL DEFAULT '0',\
                    `salesRep` int(10) unsigned NOT NULL DEFAULT '0',\
                    `checkStatus` int(10) unsigned NOT NULL DEFAULT '0',\
                    `orderFlag` int(10) unsigned NOT NULL DEFAULT '0',\
                    PRIMARY KEY (`id`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    orderTblSql: "CREATE TABLE if not exists `order_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `orderPlacedDate` date NOT NULL,\
                    `yearNumber` int(10) unsigned NOT NULL,\
                    `monthNumber` int(10) unsigned NOT NULL,\
                    `orderId` varchar(64) NOT NULL,\
                    `comment` varchar(256) DEFAULT NULL,\
                    `orderSource` varchar(64) NOT NULL,\
                    `paymentMethod` varchar(64) NOT NULL,\
                    `brandName` varchar(64) NOT NULL,\
                    `height` varchar(10) NOT NULL,\
                    `bodyShape` varchar(64) NOT NULL,\
                    `head` varchar(64) NOT NULL,\
                    `paymentUSD` int(10) unsigned NOT NULL,\
                    `paymentCNY` int(10) unsigned NOT NULL,\
                    `factoryCost` int(10) unsigned NOT NULL,\
                    `EVO` int(10) unsigned NOT NULL,\
                    `extraHead` int(10) unsigned NOT NULL,\
                    `luckyBox` int(10) unsigned NOT NULL,\
                    `flightCase` int(10) unsigned NOT NULL,\
                    `DHLEUB` int(10) unsigned NOT NULL,\
                    `otherAccessories` int(10) unsigned NOT NULL DEFAULT '0',\
                    `accessoriesPrice` int(10) unsigned NOT NULL DEFAULT '0',\
                    `shippingCost` int(10) unsigned NOT NULL,\
                    `totalProfit` int(10) unsigned NOT NULL,\
                    `commission` int(10) unsigned NOT NULL,\
                    `commissionPercentage` int(10) unsigned NOT NULL,\
                    `designer` int(10) unsigned NOT NULL,\
                    `companyProfit` int(10) unsigned NOT NULL,\
                    `confirmTime` date DEFAULT NULL,\
                    `shipTime` date DEFAULT NULL,\
                    `shippingAgent` varchar(64) DEFAULT NULL,\
                    `domesticTrackingNumber` varchar(256) DEFAULT '待定',\
                    `trackingNumber` varchar(64) DEFAULT NULL,\
                    `salesRep` varchar(64) DEFAULT NULL,\
                    `checkStatus` varchar(20) DEFAULT '0000',\
                    `orderFlag` varchar(16) DEFAULT 'No',\
                    `createTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\
                    `updateTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
                    `creator` varchar(64) DEFAULT NULL,\
                    `updator` varchar(64) DEFAULT NULL,\
                    PRIMARY KEY (`id`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    userVerifyCodeTblSql: "CREATE TABLE if not exists `user_verify_code_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `userName` varchar(20) NOT NULL,\
                    `verifyCode` varchar(32) NOT NULL,\
                    `createTime` bigint(20) NOT NULL,\
                    PRIMARY KEY (`id`),\
                    UNIQUE KEY `userName` (`userName`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    shippingAgentTblSql: "CREATE TABLE if not exists `shipping_agent_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `shippingAgent` varchar(64) DEFAULT NULL,\
                    PRIMARY KEY (`id`),\
                    UNIQUE KEY `shippingAgent` (`shippingAgent`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    brandNameTblSql: "CREATE TABLE if not exists `brand_name_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `brandName` varchar(64) DEFAULT NULL,\
                    PRIMARY KEY (`id`),\
                    UNIQUE KEY `brandName` (`brandName`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    headTblSql: "CREATE TABLE if not exists `head_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `head` varchar(256) DEFAULT NULL,\
                    PRIMARY KEY (`id`),\
                    UNIQUE KEY `head` (`head`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    paymentMethodTblSql: "CREATE TABLE if not exists `payment_method_tbl` (\
                    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,\
                    `paymentMethod` varchar(256) DEFAULT NULL,\
                    PRIMARY KEY (`id`),\
                    UNIQUE KEY `paymentMethod` (`paymentMethod`)\
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8",
    authenticCodeTblSql: "CREATE TABLE if not exists `authentic_code_tbl` (\
                  `id` int unsigned NOT NULL AUTO_INCREMENT,\
                  `authenticCode` varchar(256) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,\
                  `productInfo` varchar(256) NOT NULL DEFAULT '',\
                  `status` ENUM('activated','nonactivated') NOT NULL DEFAULT 'nonactivated',\
                  `availability` ENUM('yes','no') NOT NULL DEFAULT 'yes',\
                  `createTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP,\
                  `updateTime` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\
                  `creator` varchar(64) DEFAULT NULL,\
                  `updator` varchar(64) DEFAULT NULL,\
                  PRIMARY KEY (`id`),\
                  UNIQUE KEY `authenticCode` (`authenticCode`)\
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8"
}
