/* style */

const style = document.createElement("link");
style.setAttribute("rel", "stylesheet");
style.setAttribute("type", "text/CSS");
const url = new URL(document.location.href)
if(url.searchParams.get("theme") == "dark")
  style.setAttribute("href", "/../../webpages/styles/colors.css");
else
  style.setAttribute("href", "/../../webpages/styles/colors-light.css");
document.head.appendChild(style);


/* tab */

function showTab(id){
  document.getElementsByClassName('tab')[0].className = 'tab';
  document.getElementsByClassName('tab')[1].className = 'tab';
  document.getElementsByClassName('tab')[2].className = 'tab';
  document.getElementsByClassName('tab')[id].className = 'tab sel';
  document.getElementsByClassName('calculator')[0].className = 'calculator';
  document.getElementsByClassName('calculator')[1].className = 'calculator';
  document.getElementsByClassName('calculator')[2].className = 'calculator';
  document.getElementsByClassName('calculator')[id].className = 'calculator show';
}

document.querySelectorAll('.tab span')[0].textContent = url.searchParams.get("translation").split(',')[0];
document.querySelectorAll('.tab span')[1].textContent = url.searchParams.get("translation").split(',')[1];
document.querySelectorAll('.tab span')[2].textContent = url.searchParams.get("translation").split(',')[2];

document.getElementsByClassName('tab')[0].onclick = function(){showTab(0);};
document.getElementsByClassName('tab')[1].onclick = function(){showTab(1);};
document.getElementsByClassName('tab')[2].onclick = function(){showTab(2);historical();};


/* Calculation */

var result = false;
var number1 = '';
var number2 = '';
var operator = '';

function Button(button){
  if('0123456789'.includes(button)){
    if(result){
      number1 = button;
      result = false;
    }else  if(operator)
      number2 += button;
    else
      number1 += button;
  }
  else if(button == 'ce'){
    if(operator)
      number2 = '';
    else
      number1 = '';
  }
  else if(button == 'c'){
    number1 = '';
    number2 = '';
    operator = '';
  }
  else if(button == 'back'){
    if(operator && number2 == '')
      operator = '';
    else if(operator)
      number2 = number2.slice(0, -1);
    else
      number1 = number1.slice(0, -1);
  }
  else if('+-*/^'.includes(button)){
    if(operator == ''){
      operator = button;
      result = false;
      if(number1 == '' || number1 == '-')
        number1 = '0';
    }else{
      calculation()
      operator = button;
      result = false;
    }
  }
  else if(button == '='){
    calculation();
    return;
  }
  else if(button == '.'){
    if(operator && number2 != '' && number2 != '-' && ! number2.includes('.'))
      number2 += '.';
    else if(! operator && number1 != '' && number1 != '-' && ! number1.includes('.'))
      number1 += '.';
  }
  else if(button == 'opposite'){
    if(operator && number2.includes('-'))
      number2 = number2.slice(1);
    else if(operator)
      number2 = '-' + number2;
    else if(number1.includes('-'))
      number1 = number1.slice(1);
    else
      number1 = '-' + number1;
  }
  else if(button == 'π'){
    if(result || !operator){
      number1 = Math.PI.toString();
      result = false;
    }else  if(operator)
      number2 = Math.PI.toString();
  }
  else if(button == 'm+'){
    if(number1 != ''){
      result = true;
      if(!sessionStorage.calculatorMemory)
        sessionStorage.calculatorMemory = '0';
      let calculatorHistory = [];
      if(sessionStorage.calculatorHistory){
        calculatorHistory = JSON.parse(sessionStorage.calculatorHistory);
      }
      calculatorHistory.push('M = ' + sessionStorage.calculatorMemory + ' + ');
      calculation();
      calculatorHistory[calculatorHistory.length-1] += number1;
      sessionStorage.calculatorMemory = Number(sessionStorage.calculatorMemory) + Number(number1);
      calculatorHistory[calculatorHistory.length-1] += ' = ' + sessionStorage.calculatorMemory;
      if(calculatorHistory.length > 10)
        calculatorHistory.splice(0, 1);
      sessionStorage.calculatorHistory = JSON.stringify(calculatorHistory);
    }
  }
  else if(button == 'm-'){
    if(number1 != ''){
      result = true;
      if(!sessionStorage.calculatorMemory)
        sessionStorage.calculatorMemory = '0';
      let calculatorHistory = [];
      if(sessionStorage.calculatorHistory){
        calculatorHistory = JSON.parse(sessionStorage.calculatorHistory);
      }
      calculatorHistory.push('M = ' + sessionStorage.calculatorMemory + ' - ');
      calculation();
      calculatorHistory[calculatorHistory.length-1] += number1;
      sessionStorage.calculatorMemory = Number(sessionStorage.calculatorMemory) - Number(number1);
      calculatorHistory[calculatorHistory.length-1] += ' = ' + sessionStorage.calculatorMemory;
      if(calculatorHistory.length > 10)
        calculatorHistory.splice(0, 1);
      sessionStorage.calculatorHistory = JSON.stringify(calculatorHistory);
    }
  }
  else if(button == 'mr'){
    result = true;
    if(!sessionStorage.calculatorMemory)
      sessionStorage.calculatorMemory = '0';
    number1 = sessionStorage.calculatorMemory;
    number2 = '';
    operator = '';
  }
  else if(button == 'mc'){
    sessionStorage.calculatorMemory = '0';
    let calculatorHistory = [];
    if(sessionStorage.calculatorHistory){
      calculatorHistory = JSON.parse(sessionStorage.calculatorHistory);
    }
    calculatorHistory.push('M = 0');
    if(calculatorHistory.length > 10)
      calculatorHistory.splice(0, 1);
    sessionStorage.calculatorHistory = JSON.stringify(calculatorHistory);
  }
  else if(button == 'square'){
    if(operator == ''){
      operator = '^';
      number2 = '2';
      if(number1 == '' || number1 == '-')
        number1 = '0';
    }else{
      calculation();
      operator = '^';
      number2 = '2';
    }
    result = false;
  }
  else if(button == 'square_root'){
    if(number1 == '' || number1 == '-' || result){
      operator = '√';
      number1 = '2';
    }else if(operator == ''){
      operator = '√';
      number2 = number1;
      number1 = '2';
    }else{
      calculation();
      operator = '√';
      number2 = number1;
      number1 = '2';
    }
    result = false;
  }
  else if(button == 'cubic_root'){
    if(number1 == '' || number1 == '-' || result){
      operator = '√';
      number1 = '3';
    }else if(operator == ''){
      operator = '√';
      number2 = number1;
      number1 = '3';
    }else{
      calculation();
      operator = '√';
      number2 = number1;
      number1 = '3';
    }
    result = false;
  }
  else if(button == 'mod'){
    if(operator == ''){
      operator = 'mod';
      result = false;
      if(number1 == '' || number1 == '-')
        number1 = '0';
    }else{
      calculation()
      operator = 'mod';
      result = false;
    }
  }

  document.querySelector('#screen-standard span').textContent = (number1 + operator + number2).replaceAll('*', '×').replaceAll('/', '÷').replaceAll('^2', '²').replaceAll('2√', '√').replaceAll('3√', '³√').replaceAll('mod', '\u00a0mod\u00a0');
  document.querySelector('#screen-standard').title = (number1 + operator + number2).replaceAll('*', '×').replaceAll('/', '÷').replaceAll('^2', '²').replaceAll('2√', '√').replaceAll('3√', '³√').replaceAll('mod', ' mod ');
  document.querySelector('#screen-scientific span').textContent = (number1 + operator + number2).replaceAll('*', '×').replaceAll('/', '÷').replaceAll('^2', '²').replaceAll('2√', '√').replaceAll('3√', '³√').replaceAll('mod', '\u00a0mod\u00a0');
  document.querySelector('#screen-scientific').title = (number1 + operator + number2).replaceAll('*', '×').replaceAll('/', '÷').replaceAll('^2', '²').replaceAll('2√', '√').replaceAll('3√', '³√').replaceAll('mod', ' mod ');
}

function calculation(){
  if(number1 != '' && number2 != '' && operator != ''){
    let calculatorHistory = [];
    if(sessionStorage.calculatorHistory){
      calculatorHistory = JSON.parse(sessionStorage.calculatorHistory);
    }
    calculatorHistory.push(number1 + ' ' + operator + ' ' + number2 + ' = ');

    if(number2 == '-')
    number2 = '0';
    if(operator == '+')
      number1 = (Number(number1) + Number(number2)).toString();
    else if(operator == '-')
     number1 = (Number(number1) - Number(number2)).toString();
    else if(operator == '*')
     number1 = (Number(number1) * Number(number2)).toString();
    else if(operator == '/')
     number1 = (Number(number1) / Number(number2)).toString();
    else if(operator == '^')
      number1 = (Number(number1) ** Number(number2)).toString();
    else if(operator == '√' && number1 == '2')
      number1 = Math.sqrt(Number(number2)).toString();
    else if(operator == '√' && number1 == '3')
      number1 = Math.cbrt(Number(number2)).toString();
    else if(operator == 'mod')
      number1 = (Number(number1) % Number(number2)).toString();
      
    number2 = '';
    operator = '';
    result = true;
    document.querySelector('#screen-standard span').textContent = number1;
    document.querySelector('#screen-standard').title = number1;
    document.querySelector('#screen-scientific span').textContent = number1;
    document.querySelector('#screen-scientific').title = number1;

    calculatorHistory[calculatorHistory.length-1] += number1;
    if(calculatorHistory.length > 10)
      calculatorHistory.splice(0, 1);
    sessionStorage.calculatorHistory = JSON.stringify(calculatorHistory);
  }
}

for(let i=0; i<20; i++){
  document.getElementsByClassName('button-standard')[i].onclick = function(){
    Button(['ce', 'c', 'back', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', 'opposite', '0', '.', '='][i]);
  };
}
for(let i=0; i<30; i++){
  document.getElementsByClassName('button-scientific')[i].onclick = function(){
    Button(['π', 'm+', 'm-', 'mr', 'mc', 'square', 'ce', 'c', 'back', '/', '^', '7', '8', '9', '*', 'square_root', '4', '5', '6', '-', 'cubic_root', '1', '2', '3', '+', 'mod', 'opposite', '0', '.', '='][i]);
  };
}
document.addEventListener('keydown', (event) => {
  Button(({'Delete':'ce', 'Escape':'c', 'Backspace':'back', '+':'+', '-':'-', '*':'*', '/':'/', '.':'.', ',':'.', '=':'=', 'Enter':'=', '0':'0', '1':'1', '2':'2', '3':'3', '4':'4', '5':'5', '6':'6', '7':'7', '8':'8', '9':'9', '%':'mod'})[event.key])
});


/* Historical */

function historical(){
  if(sessionStorage.calculatorHistory){
    document.getElementById('historical').innerHTML = '<ul></ul>';
    calculatorHistory = JSON.parse(sessionStorage.calculatorHistory);
    for(let i = calculatorHistory.length - 1; i >= 0; i--){
      let li = document.createElement('li');
      li.textContent = calculatorHistory[i].replaceAll('*', '×').replaceAll('/', '÷').replaceAll(' ^ 2', '²').replaceAll('2 √', '√').replaceAll('3 √', '³√');
      document.querySelector('#historical ul').appendChild(li);
    }
  }else
    document.querySelector('#historical').innerHTML = `<h1>${url.searchParams.get("translation").split(',')[3]}</h1>`;
}