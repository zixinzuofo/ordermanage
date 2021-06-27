function signup(){
    var userName = document.getElementById("userName").value;
    var password = document.getElementById("password").value;
    var email = document.getElementById("email").value;
    $.ajax({
        type : "POST",
        url : "/signup",
        contentType: "application/json; charset=utf-8",
        async: true,
        data: JSON.stringify({
            "userName": userName,
            "password": password,
            "email": email
        }),
        traditional : true,
        success: function (res) {
            console.log(res);
            document.getElementById("myDiv").innerHTML = res.msg;
        }
    });
}

function show_pwd(){
    var pwd  = document.getElementById("password");
    if(pwd.type == "password"){
        pwd.type = "text";  // 改变input的属即可实现
    }else {
        pwd.type = "password";
    }
}