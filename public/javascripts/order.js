function addOrderStatus()
{
    var orderId = document.getElementById("orderId").value;
    console.log('orderId:', orderId);
    var obj = document.getElementsByName("orderStatus");
    var orderStatus;
    for(var i=0; i<obj.length; i++) {
        if(obj[i].checked) {
            orderStatus = obj[i].value;
        }
    }
    console.log('orderStatus:', orderStatus);
    $.ajax({
        type : "POST",
        url : "/order/add",
        contentType: "application/json; charset=utf-8",
        async: true,
        data: JSON.stringify({
            "orderId": orderId,
            "orderStatus": orderStatus
        }),
        traditional : true,
        success: function (res) {
            console.log(res);
            document.getElementById("myDiv").innerHTML = '订单状态：' + res;
        }
    });
}

function deleteOrder()
{
    var orderId = document.getElementById("orderId").value;
    console.log('orderId:', orderId);
    $.ajax({
        type : "POST",
        url : "/order/delete",
        contentType: "application/json; charset=utf-8",
        async: true,
        data: JSON.stringify({
            "orderId": orderId
        }),
        traditional : true,
        success: function (res) {
            console.log(res);
            document.getElementById("myDiv").innerHTML = res;
        }
    });
}

function updateOrderStatus()
{
    var orderId = document.getElementById("orderId").value;
    console.log('orderId:', orderId);
    var obj = document.getElementsByName("orderStatus");
    var orderStatus;
    for(var i=0; i<obj.length; i++) {
        if(obj[i].checked) {
            orderStatus = obj[i].value;
        }
    }
    console.log('orderStatus:', orderStatus);
    $.ajax({
        type : "POST",
        url : "/order/update",
        contentType: "application/json; charset=utf-8",
        async: true,
        data: JSON.stringify({
            "orderId": orderId,
            "orderStatus": orderStatus
        }),
        traditional : true,
        success: function (res) {
            console.log(res);
            document.getElementById("myDiv").innerHTML = res;
        }
    });
}

function queryOrderStatus()
{
    var orderId = document.getElementById("orderId").value;
    console.log('orderId:', orderId);
    $.ajax({
        type : "POST",
        url : "/order/query",
        contentType: "application/json; charset=utf-8",
        async: true,
        data: JSON.stringify({
            "orderId": orderId
        }),
        traditional : true,
        success: function (res) {
            var order;
            try {
                order = JSON.parse(res);
                console.log('order:', order);
                document.getElementById("orderTable").style.display="";
                document.getElementById("orderStatus").innerHTML = order.orderStatus;
                document.getElementById("orderCreateTime").innerHTML = order.createTime;
                document.getElementById("orderUpdateTime").innerHTML = order.updateTime;
                document.getElementById("myDiv").innerHTML = "";
            } catch(e) {
                console.log(e);
                document.getElementById("orderTable").style.display="none";
                document.getElementById("myDiv").innerHTML = res;
            }
        }
    });
}