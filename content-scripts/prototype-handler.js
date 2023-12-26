// Unfortunately `chrome.scripting.registerContentScripts` can only be set to MAIN_WORLD
// since Chrome 102, and we want to support Chrome 96+. This is a workaround to
// synchronously run small statically-defined functions in the main world.
// https://crbug.com/40181146
function immediatelyRunFunctionInMainWorld(fn) {
  if (typeof fn !== "function") throw "Expected function";
  const div = document.createElement("div");
  div.setAttribute("onclick", "(" + fn + ")()");
  document.documentElement.appendChild(div);
  div.click();
  div.remove();
}

const isLocal = location.origin === "https://scratchfoundation.github.io" || ["8601", "8602"].includes(location.port);
if ((!(document.documentElement instanceof SVGElement) && location.pathname.split("/")[1] === "projects") || isLocal) {
  immediatelyRunFunctionInMainWorld(() => {
    const oldBind = Function.prototype.bind;
    // Use custom event target
    window.__scratchAddonsTraps = new EventTarget();
    const onceMap = (__scratchAddonsTraps._onceMap = Object.create(null));

    Function.prototype.bind = function (...args) {
      if (Function.prototype.bind === oldBind) {
        // Just in case some code stores the bind function once on startup, then always uses it.
        return oldBind.apply(this, args);
      } else if (
        args[0] &&
        Object.prototype.hasOwnProperty.call(args[0], "editingTarget") &&
        Object.prototype.hasOwnProperty.call(args[0], "runtime")
      ) {
        onceMap.vm = args[0];
	const cleanJsonExport = (json) => {
        for (const blockid in json.blocks || {}) {
          switch (json.blocks[blockid].opcode) {
            case "procedures_prototype_reporter": {
              json.blocks[blockid].opcode = "procedures_prototype";
              json.blocks[blockid].mutation.shape = "reporter";
              break;
            }
            case "procedures_prototype_boolean": {
              json.blocks[blockid].opcode = "procedures_prototype";
              json.blocks[blockid].mutation.shape = "boolean";
              break;
            }
            case "procedures_definition_reporter": {
              json.blocks[blockid].opcode = "procedures_definition";
              if (!json.blocks[blockid].mutation) {
                json.blocks[blockid].mutation = {
                  tagName: "mutation",
                  children: [],
                };
              }
              json.blocks[blockid].mutation.shape = "reporter";
              break;
            }
          }
        }
      };

      const originalToJson = onceMap.vm.constructor.prototype.toJSON;
      onceMap.vm.constructor.prototype.toJSON = function (optTargetId) {
        const json = JSON.parse(originalToJson.call(this, optTargetId));
        if (Object.prototype.hasOwnProperty.call(json, "targets")) {
          for (const target of json.targets) {
            cleanJsonExport(target);
          }
        } else {
          cleanJsonExport(json);
        }
        return JSON.stringify(json);
      };

      const cleanJsonImport = (json) => {
        for (const blockid in json.blocks || {}) {
          if (json.blocks[blockid].opcode === "procedures_prototype") {
            if (json.blocks[blockid].mutation.shape === "reporter") {
              json.blocks[blockid].opcode = "procedures_prototype_reporter";
            } else if (json.blocks[blockid].mutation.shape === "boolean") {
              json.blocks[blockid].opcode = "procedures_prototype_boolean";
            }
          } else if (
            json.blocks[blockid].opcode === "procedures_definition" &&
            json.blocks[blockid].mutation?.shape === "reporter"
          ) {
            json.blocks[blockid].opcode = "procedures_definition_reporter";
          }
        }
      };

      const originalDeserializeProject = onceMap.vm.constructor.prototype.deserializeProject;
      onceMap.vm.constructor.prototype.deserializeProject = function (projectJSON, zip) {
        // despite scratch documenting this functions firat parameter as being a string, it seems to actually be an object, and doesn't work if it's a string. Bizarre.
        let json = typeof projectJSON === "string" ? JSON.parse(projectJSON) : projectJSON;
        for (const target of json.targets || []) {
          cleanJsonImport(target);
        }
        return originalDeserializeProject.call(this, json, zip);
      };
        // After finding the VM, return to previous Function.prototype.bind
        Function.prototype.bind = oldBind;
        return oldBind.apply(this, args);
      } else {
        return oldBind.apply(this, args);
      }
    };
  });
}

immediatelyRunFunctionInMainWorld(() => {
  window.__scratchAddonsSessionRes = { loaded: false, session: null };

  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, path, ...args) {
    if (method === "GET" && path === "/session/") {
      this.addEventListener(
        "load",
        () => {
          if (this.responseType !== "json") return;
          window.__scratchAddonsSessionRes.session = this.response;
          window.__scratchAddonsSessionRes.loaded = true;
        },
        { once: true }
      );
    }
    return originalXhrOpen.call(this, method, path, ...args);
  };
});
