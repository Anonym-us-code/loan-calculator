"use strict";
function getElement(selector){
    var element = document.querySelector(selector)
    if(element)return element
    throw Error(`there is no ${selector} class`)
}
function calculate(){
    var amount = getElement("#amount");
    var apr = getElement("#apr");
    var years = getElement("#years");
    var zipcode = getElement("#zipcode");
    var payment = getElement("#payment");
    var total = getElement("#total");
    var totalinterest = getElement("#totalinterest");


    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value)/100/12;
    var payments = parseFloat(years.value)*12;

    var x = Math.pow(1+interest, payments)
    var monthly = (principal*x*interest)/(x-1);

    if(isFinite(monthly)){
        payment.innerHTML = monthly.toFixed(2);
        totalinterest.innerHTML = ((monthly*payments)-principal).toFixed(2);

        save(amount.value, apr.value, years.value, zipcode.value);

        try{
            getLenders(amount.value, apr.value, years.value, zipcode.value);
        }catch(e){
            //ignore any errors
        }
    }else{
        payment.innerHTML = ""
        total.innerHTML = ""
        totalinterest.innerHTML = ""
        chart()
    }
}

function save(amount, apr, years, zipcode){
    if(window.localStorage){
        localStorage.loan_amount = amount;
    localStorage.loan_apr = apr
    localStorage.loan_years = years
    localStorage.loan_zipcode = zipcode
    }
}

window.onload = function(){
    if(window.localStorage&&localStorage.loan_amount){
        getElement("#amount").value = localStorage.loan_amount;
    getElement("#apr").value = localStorage.loan_apr;
    getElement("#years").value = localStorage.loan_years;
    getElement("#zipcode").value = localStorage.loan_zipcode;
    }
}

function getLenders(amount, apr, years, zipcode){
    if(!window.XMLHttpRequest) return

    var ad = getElement("#lenders")
    if(!ad) return;

    var url = "getLenders.php" + 
    "?amt="+encodeURIComponent(amount)+
    "&apr="+encodeURIComponent(apr)+
    "&yrs="+encodeURIComponent(years)+
    "&zip="+encodeURIComponent(zipcode);

    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.send(null);

    req.onreadystatechange = function(){
        if(req.readyState ==4&&req.status == 200){
            var response = req.responseText;
            var lenders = JSON.parse(response);

            var list = "";
            for(var i =0;i<lenders.length;i++){
                list+= "<li><a href+'"+lenders[i].url+"'>"+lenders[i].name + "</a>";
            }
            ad.innerHTML = "<ul>"+list +"</ul>";
        }
    }
}

function chart(principal, interest, monthly, payments){
    var graph =getElement("#graph");
    graph.width = graph.width;

    if(arguments.length==0||!graph.getContext)return

    var g = graph.getContext("2d");
    var width = graph.width, height = graph.height;

    function paymentToX(n){return n*width/payments}
    function amountToY(n){
        return height-(a*height/(monthly*payments*1.05));
    }

    g.moveTo(paymentToX(payments), amountToY(0));
    g.lineTo(paymentToX(payments), amountToY(monthly*payments));
    g.lineTo(paymentToX(payments), amountToY(0))
    g.closePath()
    g.fillStyle = "f88"
    g.fill()
    g.font = "bold 12px sans-serif"
    g.fillText("Total payments", 20,20)

    var equity =0
    g.beginPath()
    g.moveTo(paymentToX(payments), amountToY(0))
    for(var p =1;p<=payments;p++){
        var thisMonthInterest = (principal-equity)*interest
        equity+= (monthly - thisMonthInterest)
        g.lineTo(paymentToX(p), amountToY(equity))
    }
    g.lineTo(paymentToX(payments), amountToY(0))
    g.closePath()
    g.fillStyle = "green"
    g.fill()
    g.fillText("Total equity", 20,35)

    var bal = principal;
    g.beginPath()
    g.moveTo(paymentToX(0), amountToY(bal))
    for(var p=1;p<=payments;p++){
        var thisMonthInterest = bal*interest;
        bal-=(monthly - thisMonthInterest)
        g.lineTo(paymentToX(p), amountToY(bal));
    }
    g.lineWidth = 3;
    g.stroke()
    g.fillStyle = "black"
    g.fillText("Loan balance",20,50)

    g.textAlign= "center"
    var y = amountToY(0)
    for(var year = 1; year*12<=payments;year++){
        var x = paymentToX(year*12)
        g.fillRect(x-0.5,y-3,1,3)
        if(year==1)g.fillText("Year",x,y-5)
        if(year%5==0&&year*12!==payments){
            g.fillText(String(year),x,y-5);
        }
    }
    g.textAlign = "right";
    g.textBaseline = "middle"
    var ticks = [monthly*payments, principal];
    var rightEdge = paymentToX(payments);
    for(var i =0;i<ticks.length;i++){
        var y = amountToY(ticks[i])
        g.fillRect(rightEdge-3,y-0.5,3,1);
        g.fillText(String(ticks[i].toFixed(0)),rightEdge-5,y)
    }

}