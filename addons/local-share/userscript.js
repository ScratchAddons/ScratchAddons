export default async function ({ addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "...";
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.ceil(seconds % 60);
    return `${m}m ${s}s`;
  }

  function getSettings() {
    return {
      host: addon.settings.get("host") || "",
      port: addon.settings.get("port") || 3000,
      useHttps: addon.settings.get("useHttps") ?? true,
    };
  }

  async function getProjectInfo() {
    let title = "Scratch Project";
    const titleInput = document.querySelector("input[class*='project-title-input']");
    if (titleInput?.value) {
      title = titleInput.value;
    } else if (document.title) {
      title = document.title.replace(" on Scratch", "");
    }

    let author = "Me";
    try {
      const user = await addon.auth.getUser();
      if (user?.username) author = user.username;
    } catch (e) {}

    return { title, author };
  }

  async function sendProject(base, onProgress) {
    /*
      Should I perform a check here to see if the VM exists?
      Theoretically, it would be good practice to check if "vm" exists before accessing it.
      But that's probably unnecessary, right?
    */
    if (!vm) throw new Error("Scratch VM not found");

    const blob = await vm.saveProjectSb3();
    const startTime = Date.now();
    const projectInfo = await getProjectInfo();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${base}/send`);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.setRequestHeader("X-Project-Title", projectInfo.title);
      xhr.setRequestHeader("X-Project-Author", projectInfo.author);
      xhr.setRequestHeader("X-Chunk-Offset", "0");

      if (xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) {
            onProgress(0, Infinity);
            return;
          }
          const percent = (e.loaded / e.total) * 100;
          const timeElapsed = (Date.now() - startTime) / 1000;
          const uploadSpeed = e.loaded / timeElapsed;
          const remainingBytes = e.total - e.loaded;
          const secondsLeft = remainingBytes / uploadSpeed;

          onProgress(percent, secondsLeft);
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error (connection failed)"));

      xhr.send(blob);
    });
  }

  async function startTransfer(content, remove, useHttps) {
    const hostInput = content.querySelector(".sa-input-host");
    const portInput = content.querySelector(".sa-input-port");

    const host = hostInput.value.trim();
    const port = portInput.value.trim();

    if (!host) {
      hostInput.style.borderColor = "red";
      return;
    }

    const btnRow = content.querySelector(".sa-modal-buttons");
    const progContainer = content.querySelector(".sa-progress-container");
    const progFill = content.querySelector(".sa-progress-fill");
    const progText = content.querySelector(".sa-progress-text");

    const protocol = useHttps ? "https" : "http";
    const base = `${protocol}://${host}:${port}`;

    btnRow.style.display = "none";
    progContainer.style.display = "block";
    progText.textContent = "Start uploading...";
    progFill.style.width = "0%";
    progFill.style.backgroundColor = "#4C97FF";

    try {
      await sendProject(base, (percent, secondsLeft) => {
        progFill.style.width = `${percent}%`;
        if (percent >= 100) {
          progText.textContent = "Processing...";
        } else {
          progText.textContent = `${Math.round(percent)}% / ${formatTime(secondsLeft)}`;
        }
      });

      progText.textContent = "Complete!";
      progFill.style.backgroundColor = "#4CB050";

      setTimeout(() => {
        remove();
        alert("Project sent successfully!");
      }, 500);
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
      remove();
    }
  }

  function openScratchStyleModal() {
    const settings = getSettings();

    const { backdrop, container, content, closeButton, remove } = addon.tab.createModal("Share project locally", {
      isOpen: true,
      useEditorClasses: true,
    });

    container.classList.add("sa-local-share-popup");
    content.classList.add("sa-local-share-content");

    const description = Object.assign(document.createElement("p"), {
      textContent: "Send your project to another device on your local network.",
      className: "sa-description",
    });
    content.appendChild(description);

    const labelHost = Object.assign(document.createElement("label"), {
      textContent: "Recipient's IP address:",
      htmlFor: "sa-input-host",
      className: "sa-label",
    });
    const inputHost = Object.assign(document.createElement("input"), {
      type: "text",
      placeholder: "e.g. 192.168.1.42",
      value: settings.host,
      id: "sa-input-host",
      className: "sa-input sa-input-host " + addon.tab.scratchClass("prompt_variable-name-text-input"),
    });
    content.appendChild(labelHost);
    content.appendChild(inputHost);

    const labelPort = Object.assign(document.createElement("label"), {
      textContent: "Port:",
      htmlFor: "sa-input-port",
      className: "sa-label",
    });
    const inputPort = Object.assign(document.createElement("input"), {
      type: "text",
      placeholder: "3000",
      value: settings.port,
      id: "sa-input-port",
      className: "sa-input sa-input-port " + addon.tab.scratchClass("prompt_variable-name-text-input"),
    });
    content.appendChild(labelPort);
    content.appendChild(inputPort);

    const progressContainer = Object.assign(document.createElement("div"), {
      className: "sa-progress-container",
    });
    const progressTrack = Object.assign(document.createElement("div"), {
      className: "sa-progress-track",
    });
    const progressFill = Object.assign(document.createElement("div"), {
      className: "sa-progress-fill",
    });
    const progressText = Object.assign(document.createElement("div"), {
      className: "sa-progress-text",
      textContent: "Preparation...",
    });
    progressTrack.appendChild(progressFill);
    progressContainer.appendChild(progressTrack);
    progressContainer.appendChild(progressText);
    content.appendChild(progressContainer);

    const btnRow = Object.assign(document.createElement("div"), {
      className: addon.tab.scratchClass("prompt_button-row", { others: "sa-modal-buttons" }),
    });

    const cancelBtn = Object.assign(document.createElement("button"), {
      textContent: "Cancel",
    });
    cancelBtn.onclick = () => remove();

    const sendBtn = Object.assign(document.createElement("button"), {
      textContent: "Send",
      className: addon.tab.scratchClass("prompt_ok-button"),
    });
    sendBtn.onclick = () => startTransfer(content, remove, settings.useHttps);

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(sendBtn);
    content.appendChild(btnRow);

    backdrop.onclick = () => remove();
    closeButton.onclick = () => remove();

    inputHost.focus();
  }

  while (true) {
    const dropdownList = await addon.tab.waitForElement("[class*='menu-bar_menu-bar-menu_'] ul", {
      markAsSeen: true,
      reduxCondition: (state) => state.scratchGui && state.scratchGui.menus.fileMenu,
    });

    if (dropdownList.querySelector(".sa-local-share-item")) continue;

    const li = Object.assign(document.createElement("li"), {
      className: "menu_menu-item_-vv8x menu_hoverable_ZLcfJ sa-local-share-item",
    });
    const labelSpan = Object.assign(document.createElement("span"), {
      textContent: "Share locally",
    });
    li.appendChild(labelSpan);

    li.onclick = (e) => {
      e.stopPropagation();

      const menuBar = document.querySelector("[class*='menu-bar_account-info-group']");
      if (menuBar) {
        menuBar.click();
      }

      openScratchStyleModal();
    };

    dropdownList.appendChild(li);
  }
}
