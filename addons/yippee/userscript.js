export default async function ({ addon, msg, console }) {

  //Change font family -- fontSelector in the settings --

  var allTextElements = document.querySelectorAll('div, p, label, text, span, a, button, h1');

  //The cambiaTexto function is called at the end of the document, in a 'mouseover' eventListener, along with the other functions.
  function cambiaTexto() {
    const fontSelector = addon.settings.get('fontSelector');

    for (var i = 0; i < allTextElements.length; i++) {
      if (fontSelector == "arial") {
        allTextElements[i].style.fontFamily = "Arial, Helvetica, sans-serif";
      }
      else if (fontSelector == "verdana") {
        allTextElements[i].style.fontFamily = "Verdana, Tahoma, sans-serif";
      }
      else if (fontSelector == "comicSans") {
        allTextElements[i].style.fontFamily = "'Brush Script MT', Cursive";
      }
    }
  }

  //Change font size -- fontSizer in the settings --

  //This function will also be called at the end.
  function cambiaTamaño() {
    for (var j = 0; j < allTextElements.length; j++) {
      allTextElements[j].style.fontSize = addon.settings.get('fontSizer') + 'px';
    }
  }

  //Change text to Pictograms -- texToPic in the settings --

  //This function will also be called at the end.
  function cambiaPictos() {
    if (addon.settings.get('texToPic') == true) {
      const spans = document.querySelectorAll('span, .scratchCategoryMenuItemLabel');
      const words = ['Kodea', 'Editatu', 'Aldagaiak', 'Sentsoreak', "Hasi saioa", 'Tutorialak', 'Eragileak', "Nire blokeak", 'Kontrola', 'Gertaerak', 'Soinua', 'Itxura', 'Berreskuratu', 'Berria', 'Pertsonaia', 'Mugimendua', 'Norabidea', 'Erakutsi', 'Tamaina', 'Eszena', 'Fitxategia', 'Soinuak', 'Tankerak'];
      const imagenes = [
        'https://api.arasaac.org/api/pictograms/8508?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/21851?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/38753?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/6195?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/29955?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/34004?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/36373?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/4935?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/25990?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/37310?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/27073?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/32584?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/9026?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/11316?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/11318?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/25656?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/7078?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/16823?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/8704?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/8106?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/16078?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/27073?plural=false&download=false',
        'https://api.arasaac.org/api/pictograms/5985?plural=false&download=false'
      ];
      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const text = span.textContent.trim();
        const index = words.indexOf(text);
        if (index !== -1) {
          const img = document.createElement('img');
          img.src = imagenes[index];
          img.width = 50;
          img.height = 50;
          span.parentNode.replaceChild(img, span);
        }
      }
    }
  }

  //hide a Scratch block pressing F8 --hideBlocks in the settings --

  //We define the scratch blocks as erasable
  const erasable = document.querySelectorAll('.blocklyPath, .blocklyText');
  var mouseSelected = '';

  //Selects the element being hovered over
  document.addEventListener('mouseover', function (event) {
    mouseSelected = event.target;
  });

  //When F8 is pressed, if the selected element is erasable it calls eliminate
  document.addEventListener('keydown', event => {
    if (event.key === 'F8') {
      for (let i = 0; i < erasable.length; i++) {
        if (erasable[i] === mouseSelected) {
          eliminate(mouseSelected);
        }
      }
    }
  });

  //this deletes the previously selected element.
  function eliminate(elemento) {
    if (addon.settings.get('hideBlocks') == true) {
      elemento.parentNode.style.display = 'none';
    }
  }

  // TEXT-TO-SPEECH when hovering over a text element -- textToSpeechEnabled in the settings --

  // Add speakable class to some text elements
  const speakableElements = document.querySelectorAll('span, text, p, a, button, input, li, .scratchCategoryMenuItemLabel');
  speakableElements.forEach(element => {
    element.classList.add('speakable');
  });
  // Text-to-speech function
  function speakText(text) {
    if (addon.settings.get('textToSpeechEnabled') && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(msg);
    }
  }
  // Handle mouseover events on speakable elements
  document.addEventListener('mouseover', (event) => {
    /* We call all of the previous functions as well, to check them "constantly" when the mouse moves.
    Sorry if this is not optimal, I am not a programmer :( */
    cambiaTexto();
    cambiaTamaño();
    cambiaPictos();
    const target = event.target;
    if (target.classList.contains('speakable')) {
      const text = target.innerText;
      speakText(text, target);
    }
  });

}
