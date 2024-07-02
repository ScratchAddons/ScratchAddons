import { insert } from "../../libraries/thirdparty/cs/text-field-edit.js";
export default async function ({ addon, msg, console }) {
  await addon.tab.loadScript("/libraries/thirdparty/cs/spark-md5.min.js");

  const toolbar =
    document.querySelector("#markItUpId_body > div > div.markItUpHeader > ul") ||
    document.querySelector("#markItUpId_signature > div > div.markItUpHeader > ul");

  const textBox = document.querySelector("#id_body") || document.querySelector("#id_signature");
  if (!textBox) return;

  let progressElement;

  // Hidden input for file upload
  const uploadInput = document.createElement("input");
  uploadInput.className = "sa-image-upload-input";
  uploadInput.type = "file";
  uploadInput.accept = "image/*";

  // Button (the one the user interacts with)
  const inputButtonContainer = document.createElement("li");
  addon.tab.displayNoneWhileDisabled(inputButtonContainer);
  inputButtonContainer.className = "markItUpButton markItUpButton17";

  const inputButton = document.createElement("a");
  inputButton.className = "sa-image-upload-button";
  inputButton.title = msg("upload-image");
  inputButtonContainer.appendChild(inputButton);

  addon.tab.appendToSharedSpace({
    space: "forumToolbarLinkDecoration",
    element: inputButtonContainer,
    order: 1,
  });
  document.body.appendChild(uploadInput);

  // Events
  const onButtonClick = (e) => uploadInput.click();
  const onFileUpload = (e) => {
    const file = uploadInput.files[0];
    uploadBlob(file);
  };
  const onPaste = async (ev) => {
    const files = await retrieveImagesFromClipboardAsBlob(ev);

    for (const file of files) {
      uploadBlob(file);
    }
  };
  const onDragEnter = () => {
    textBox.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
  };
  const onDragLeave = () => {
    textBox.style.backgroundColor = "";
  };
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };
  const onDrop = (e) => {
    textBox.style.backgroundColor = "";
    const { files } = e.dataTransfer;
    if (files.length > 0) e.preventDefault() || e.stopPropagation();
    for (const file of files) {
      uploadBlob(file);
    }
  };

  // Append listeners
  function addListeners() {
    inputButton.addEventListener("click", onButtonClick);
    uploadInput.addEventListener("change", onFileUpload);
    textBox.addEventListener("paste", onPaste);
    textBox.addEventListener("dragenter", onDragEnter);
    textBox.addEventListener("dragover", onDragOver);
    textBox.addEventListener("dragleave", onDragLeave);
    textBox.addEventListener("dragend", onDragLeave);
    textBox.addEventListener("drop", onDrop);
  }
  addListeners();
  addon.self.addEventListener("disabled", () => {
    inputButton.removeEventListener("click", onButtonClick);
    uploadInput.removeEventListener("change", onFileUpload);
    textBox.removeEventListener("paste", onPaste);
    textBox.removeEventListener("dragenter", onDragEnter);
    textBox.removeEventListener("dragover", onDragOver);
    textBox.removeEventListener("dragleave", onDragLeave);
    textBox.removeEventListener("dragend", onDragLeave);
    textBox.removeEventListener("drop", onDrop);
  });
  addon.self.addEventListener("reenabled", addListeners);

  async function retrieveImagesFromClipboardAsBlob(pasteEvent) {
    if (!pasteEvent.clipboardData) {
      return;
    }
    const { items } = pasteEvent.clipboardData;
    if (!items) {
      return;
    }

    const files = [];
    for (const item of items) {
      // Skip content if not image
      if (!item.type.includes("image")) continue;
      // Retrieve image on clipboard as blob
      files.push(item.getAsFile());
    }

    return files;
  }
  async function uploadBlob(file) {
    const fileExt = file.name.split(".").pop().toLowerCase();

    file
      .arrayBuffer()
      .then((buf) => uploadImage(buf, fileExt))
      .catch((e) => {
        console.error("Error when reading file:", e);
        alert(msg("load-error"));
        progressElement?.remove();
      });
  }
  async function uploadImage(img, fileType) {
    progressElement = toolbar.appendChild(document.createElement("li"));

    const hash = SparkMD5.ArrayBuffer.hash(img);
    progressElement.innerText = msg("uploading");
    try {
      const res = await fetch(`https://assets.scratch.mit.edu/${hash}.${fileType}`, {
        body: img,
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      const data = await res.json();

      if (data.status === "ok") {
        insert(textBox, `[img]https://assets.scratch.mit.edu/get_image/.%2E/${data["content-name"]}[/img]`);
      } else {
        progressElement?.remove();
        alert(msg("upload-error"));
      }
      progressElement.remove();
    } catch (ex) {
      console.log("Error encountered while uploading image:", ex);
      progressElement?.remove();
      alert(msg("upload-error"));
    }
  }
}
