export default async function ({ addon, global, console }) {
  const wait=ms=>new Promise(cb=>setTimeout(cb, ms))
  if(!(location.hash.startsWith("#fluffyscratch-") && scratchAddons.globalState.temporary[location.hash.slice(1)])) return document.body.classList.add("not-one-click");
  document.title = "Loading..."
  let loadingOverlay = Object.assign(document.createElement("div"), {style: "position: fixed;top: 0;left: 0;z-index: 300;background: inherit;width: 100%;height: 100%;color: #ffff;margin: 0;padding: 0;display: flex;align-items: center;justify-content: center;"})
  loadingOverlay.append(Object.assign(new Image(), {alt: "loading animation", className: "studio-status-icon-spinner spinner", src: "https://scratch.mit.edu/svgs/modal/spinner-white.svg"}), Object.assign(document.createElement("div"), {textContent: "Loading...", style: "margin-left: 0.5em;"}))
  document.documentElement.appendChild(loadingOverlay)
  let gf = await addon.tab.waitForElement("."+addon.tab.scratchClass("green-flag_green-flag"))
  let ogl=window.console.log;
  await new Promise(cb=>{
    window.console.log=(...a)=>{
      if(a.length>=3&&a[0]=="gui"&&a[1]=="info"&&a[2].includes("connected to cloud")) {
        setTimeout(cb, 500)
		window.console.log=ogl
      }
	  ogl(...a)
    }
  })
  gf.click();
  let input = await addon.tab.waitForElement("."+addon.tab.scratchClass("question_question-input")+" ."+addon.tab.scratchClass("input_input-form"));
  input.value = scratchAddons.globalState.temporary[location.hash.slice(1)].publicCode
  input[Object.keys(input).find(e=>e.startsWith("__reactEventHandlers"))].onChange({target: input})
  await wait(100)
  document.querySelector("."+addon.tab.scratchClass("question_question-submit-button")).click()
  while (1){
    await wait(100)
    try{
      if((await(await fetch("https://clouddata.scratch.mit.edu/logs?projectid=514649494&limit=10&offset=0")).json()).find(e=>e.value==scratchAddons.globalState.temporary[location.hash.slice(1)].publicCode&&e.name.endsWith("oauthgobrrr")))break
    }catch(e){break}
  }
  location.replace(scratchAddons.globalState.temporary[location.hash.slice(1)].redirect)
}