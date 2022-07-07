export default async function ({ addon, global, console, msg }) {

  var windowCalculator = {closed:true};
  const calculatorInterface = document.createElement("div");
  calculatorInterface.className = 'sa-calculator-interface';

  function openCalculator(){
    if(addon.settings.get('popup')){
      if(windowCalculator.closed)
        windowCalculator = window.open(addon.self.dir + '/calculator.html?theme=' + addon.settings.get('theme') + '&translation=' + msg('standard') + ',' + msg('scientific') + ',' + msg('historical') + ',' + msg('no-historical'), '', 'top=100, left=100, height=480,width=360');
      else
        windowCalculator.focus();
    }else{
      if(document.getElementsByClassName('sa-calculator-interface')[0])
        document.body.removeChild(calculatorInterface);
      else{
        calculatorInterface.innerHTML = `
<div class="calculator-draggable-handle"></div>
<div class="close-calculator-button"></div>
<iframe src="${addon.self.dir + '/calculator.html?theme=' + addon.settings.get('theme') + '&translation=' + msg('standard') + ',' + msg('scientific') + ',' + msg('historical') + ',' + msg('no-historical')}"></iframe>
        `;
        if(addon.settings.get('theme') == 'dark')
          calculatorInterface.innerHTML += '<style>:root{--calculator-background: #2a2a2a;}</style>'
        else
          calculatorInterface.innerHTML += '<style>:root{--calculator-background: #f7f7f7;}</style>'
        document.body.appendChild(calculatorInterface);
        document.getElementsByClassName('close-calculator-button')[0].style.backgroundImage = `url(${addon.self.dir + '/icon/close.svg'})`;
        if(addon.settings.get('theme') == 'dark')
          document.getElementsByClassName('close-calculator-button')[0].style.filter = 'invert(1)';
        document.getElementsByClassName('close-calculator-button')[0].onclick = function(){
          document.body.removeChild(calculatorInterface);
        };
        allowMovement(calculatorInterface);
      }
    }
  }

  function allowMovement(elem){
    elem.style.left = '50px';
    elem.style.top = '50px';
    let moving = false;
    let shiftX = 0;
    let shiftY = 0;
    elem.onmousedown = function(ev){
      moving = true;
      shiftX = ev.clientX - Number(elem.style.left.replace('px', ''));
      shiftY = ev.clientY - Number(elem.style.top.replace('px', ''));
      document.getElementsByClassName('calculator-draggable-handle')[0].style.height = '500px';
    }
    document.body.onmousemove = function(ev){
      if(moving){
        elem.style.left = (ev.clientX - shiftX) + 'px';
        elem.style.top = (ev.clientY - shiftY) + 'px';
        if(ev.clientX - shiftX < 0)
          elem.style.left = '0px';
        else if(ev.clientX - shiftX + 362 > window.innerWidth)
          elem.style.left = (window.innerWidth - 362) + 'px';
        if(ev.clientY - shiftY < 0)
          elem.style.top = '0px';
        else if(ev.clientY - shiftY + 502 > window.innerHeight)
          elem.style.top = (window.innerHeight - 502) + 'px';
      }
    }
    elem.onmouseup = function(){
      moving = false;
      document.getElementsByClassName('calculator-draggable-handle')[0].style.height = '30px';
    }
  }

  const calculatorButtonOuter = document.createElement("div");
  calculatorButtonOuter.className = 'sa-calculator-container';
  const calculatorButton = document.createElement("div");
  calculatorButton.className = addon.tab.scratchClass("button_outlined-button", "stage-header_stage-button");
  const calculatorButtonContent = document.createElement("div");
  calculatorButtonContent.className = addon.tab.scratchClass("button_content");
  const calculatorButtonImage = document.createElement("img");
  calculatorButtonImage.className = addon.tab.scratchClass("stage-header_stage-button-icon");
  calculatorButtonImage.draggable = false;
  calculatorButtonImage.src = addon.self.dir + "/icon/thin-operation.svg";
  calculatorButtonContent.appendChild(calculatorButtonImage);
  calculatorButton.appendChild(calculatorButtonContent);
  calculatorButtonOuter.appendChild(calculatorButton);
  calculatorButton.addEventListener("click", () => openCalculator());

 while (true) {
    await addon.tab.waitForElement('[class*="stage-header_stage-size-row"]', {
      markAsSeen: true,
      reduxEvents: [
        "scratch-gui/mode/SET_PLAYER",
        "scratch-gui/mode/SET_FULL_SCREEN",
        "fontsLoaded/SET_FONTS_LOADED",
        "scratch-gui/locales/SELECT_LOCALE",
      ],
    });
    if (addon.tab.editorMode === "editor") {
      addon.tab.appendToSharedSpace({ space: "stageHeader", element: calculatorButtonOuter, order: -1 });
    }else if(document.getElementsByClassName('sa-calculator-interface')[0]){
      document.body.removeChild(document.getElementsByClassName('sa-calculator-interface')[0]);
    }
  }
}