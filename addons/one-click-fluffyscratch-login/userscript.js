export default async function ({ addon, global, console }) {
  const wait = (ms) => new Promise((cb) => setTimeout(cb, ms));
  if (!(location.hash.startsWith("#fluffyscratch-") && scratchAddons.globalState.temporary[location.hash.slice(1)]))
    return document.body.classList.add("not-one-click");
  document.title = "Loading...";
  let loadingOverlay = Object.assign(document.createElement("div"), {
    className: "one-click-overlay"
  });
  loadingOverlay.append(
    Object.assign(new Image(), {
      alt: "loading animation",
      className: "studio-status-icon-spinner spinner",
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='none' fill-rule='evenodd' stroke='%23FFF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M15 10a5 5 0 1 0-5 5'/%3E%3C/svg%3E",
    }),
    Object.assign(document.createElement("span"), { textContent: "Loading...", className: "one-click-label" })
  );
  document.documentElement.appendChild(loadingOverlay);
  const { projectId } = await (await fetch(addon.self.dir + "/consts.json")).json();
  let gf = await addon.tab.waitForElement("." + addon.tab.scratchClass("green-flag_green-flag"));
  let ogl = window.console.log;
  await new Promise((cb) => {
    window.console.log = (...a) => {
      if (a.length >= 3 && a[0] == "gui" && a[1] == "info" && a[2].includes("connected to cloud")) {
        setTimeout(cb, 500);
        window.console.log = ogl;
      }
      ogl(...a);
    };
  });
  gf.click();
  let input = await addon.tab.waitForElement(
    "." + addon.tab.scratchClass("question_question-input") + " ." + addon.tab.scratchClass("input_input-form")
  );
  input.value = scratchAddons.globalState.temporary[location.hash.slice(1)].publicCode;
  input[Object.keys(input).find((e) => e.startsWith("__reactEventHandlers"))].onChange({ target: input });
  document.querySelector("." + addon.tab.scratchClass("question_question-submit-button")).click();
  while (1) {
    await wait(100);
    try {
      if (
        (
          await (
            await fetch("https://clouddata.scratch.mit.edu/logs?projectid=" + projectId + "&limit=10&offset=0")
          ).json()
        ).find(
          (e) =>
            e.value == scratchAddons.globalState.temporary[location.hash.slice(1)].publicCode &&
            e.name.endsWith("oauthgobrrr")
        )
      )
        break;
    } catch (e) {
      break;
    }
  }
  location.replace(scratchAddons.globalState.temporary[location.hash.slice(1)].redirect);
}
