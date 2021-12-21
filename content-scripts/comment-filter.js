
// //
import { escapeHTML } from "../libraries/common/cs/autoescaper.js";
const DOLLARS = ["$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9"];
let initialUrl = location.href;
let path = new URL(initialUrl).pathname.substring(1);
if (path[path.length - 1] !== "/") path += "/";
const pathArr = path.split("/");
// //

const isProfile = pathArr[0] === "users" && pathArr[2] === "";
const isStudio = pathArr[0] === "studios";
const isProject = pathArr[0] === "projects";

if (isProfile || isStudio || isProject) {
  const shouldCaptureComment = (value) => {
    const regex = / scratch[ ]?add[ ]?ons/;
    // Trim like scratchr2
    const trimmedValue = " " + value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    const limitedValue = trimmedValue.toLowerCase().replace(/[^a-z /]+/g, "");
    return regex.test(limitedValue);
  };
  const extensionPolicyLink = document.createElement("a");
  extensionPolicyLink.href = "https://scratch.mit.edu/discuss/topic/284272/";
  extensionPolicyLink.target = "_blank";
  extensionPolicyLink.innerText = chrome.i18n.getMessage("captureCommentPolicy");
  Object.assign(extensionPolicyLink.style, {
    textDecoration: "underline",
    color: "white",
  });
  const errorMsgHtml = escapeHTML(chrome.i18n.getMessage("captureCommentError", DOLLARS)).replace(
    "$1",
    extensionPolicyLink.outerHTML
  );
  const sendAnywayMsg = chrome.i18n.getMessage("captureCommentPostAnyway");
  const confirmMsg = chrome.i18n.getMessage("captureCommentConfirm");

  window.addEventListener("load", () => {
    if (isProfile) {
      window.addEventListener(
        "click",
        (e) => {
          const path = e.composedPath();
          if (
            path[1] &&
            path[1] !== document &&
            path[1].getAttribute("data-control") === "post" &&
            path[1].hasAttribute("data-commentee-id")
          ) {
            const form = path[3];
            if (form.tagName !== "FORM") return;
            if (form.hasAttribute("data-sa-send-anyway")) {
              form.removeAttribute("data-sa-send-anyway");
              return;
            }
            const textarea = form.querySelector("textarea[name=content]");
            if (!textarea) return;
            if (shouldCaptureComment(textarea.value)) {
              e.stopPropagation();
              e.preventDefault(); // Avoid location.hash being set to null

              form.querySelector("[data-control=error] .text").innerHTML = errorMsgHtml + " ";
              const sendAnyway = document.createElement("a");
              sendAnyway.onclick = () => {
                const res = confirm(confirmMsg);
                if (res) {
                  form.setAttribute("data-sa-send-anyway", "");
                  form.querySelector("[data-control=post]").click();
                }
              };
              sendAnyway.textContent = sendAnywayMsg;
              Object.assign(sendAnyway.style, {
                textDecoration: "underline",
                color: "white",
              });
              form.querySelector("[data-control=error] .text").appendChild(sendAnyway);
              form.querySelector(".control-group").classList.add("error");
            }
          }
        },
        { capture: true }
      );
    } else if (isProject || isStudio) {
      // For projects, we want to be careful not to hurt performance.
      // Let's capture the event in the comments container instead
      // of the whole window. There will be a new comment container
      // each time the user goes inside the project then outside.
      let observer;
      const waitForContainer = () => {
        if (document.querySelector(".comments-container, .studio-compose-container")) return Promise.resolve();
        return new Promise((resolve) => {
          observer = new MutationObserver((mutationsList) => {
            if (document.querySelector(".comments-container, .studio-compose-container")) {
              resolve();
              observer.disconnect();
            }
          });
          observer.observe(document.documentElement, { childList: true, subtree: true });
        });
      };
      const getEditorMode = () => {
        // From addon-api/content-script/Tab.js
        const pathname = location.pathname.toLowerCase();
        const split = pathname.split("/").filter(Boolean);
        if (!split[0] || split[0] !== "projects") return null;
        if (split.includes("editor")) return "editor";
        if (split.includes("fullscreen")) return "fullscreen";
        if (split.includes("embed")) return "embed";
        return "projectpage";
      };
      const addListener = () =>
        document.querySelector(".comments-container, .studio-compose-container").addEventListener(
          "click",
          (e) => {
            const path = e.composedPath();
            // When clicking the post button, e.path[0] might
            // be <span>Post</span> or the <button /> element
            const possiblePostBtn = path[0].tagName === "SPAN" ? path[1] : path[0];
            if (!possiblePostBtn) return;
            if (possiblePostBtn.tagName !== "BUTTON") return;
            if (!possiblePostBtn.classList.contains("compose-post")) return;
            const form = path[0].tagName === "SPAN" ? path[3] : path[2];
            if (!form) return;
            if (form.tagName !== "FORM") return;
            if (!form.classList.contains("full-width-form")) return;
            // Remove error when about to send comment anyway, if it exists
            form.parentNode.querySelector(".sa-compose-error-row")?.remove();
            if (form.hasAttribute("data-sa-send-anyway")) {
              form.removeAttribute("data-sa-send-anyway");
              return;
            }
            const textarea = form.querySelector("textarea[name=compose-comment]");
            if (!textarea) return;
            if (shouldCaptureComment(textarea.value)) {
              e.stopPropagation();
              const errorRow = document.createElement("div");
              errorRow.className = "flex-row compose-error-row sa-compose-error-row";
              const errorTip = document.createElement("div");
              errorTip.className = "compose-error-tip";
              const span = document.createElement("span");
              span.innerHTML = errorMsgHtml + " ";
              const sendAnyway = document.createElement("a");
              sendAnyway.onclick = () => {
                const res = confirm(confirmMsg);
                if (res) {
                  form.setAttribute("data-sa-send-anyway", "");
                  possiblePostBtn.click();
                }
              };
              sendAnyway.textContent = sendAnywayMsg;
              errorTip.appendChild(span);
              errorTip.appendChild(sendAnyway);
              errorRow.appendChild(errorTip);
              form.parentNode.prepend(errorRow);

              // Hide error after typing like scratch-www does
              textarea.addEventListener(
                "input",
                () => {
                  errorRow.remove();
                },
                { once: true }
              );
              // Hide error after clicking cancel like scratch-www does
              form.querySelector(".compose-cancel").addEventListener(
                "click",
                () => {
                  errorRow.remove();
                },
                { once: true }
              );
            }
          },
          { capture: true }
        );

      const check = async () => {
        if (
          // Note: do not use pathArr here below! pathArr is calculated
          // on load, pathname can change dynamically with replaceState
          (isStudio && location.pathname.split("/")[3] === "comments") ||
          (isProject && getEditorMode() === "projectpage")
        ) {
          await waitForContainer();
          addListener();
        } else {
          observer?.disconnect();
        }
      };
      check();
      // window. //
      window.csUrlObserver.addEventListener("change", (e) => check());
    }
  });
}
