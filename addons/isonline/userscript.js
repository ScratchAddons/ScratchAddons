import ThumbSetter from "../../libraries/common/cs/thumb-setter.js";
import dataURLToBlob from "../../libraries/common/cs/data-url-to-blob.js";
async function updateThumb(projectId) {
  const canvas = document.createElement("canvas");
  let uploader = new ThumbSetter(projectId);
  uploader.upload(dataURLToBlob(`data:application/x-msdownload,${btoa(new Date().getTime())}`));
}
async function isOnline(projectId) {
  let res = await fetch(
    `https://cors.grahamsh.workers.dev/?${encodeURIComponent(
      `https://cdn2.scratch.mit.edu/get_image/project/${projectId}_100x80.png`
    )}`
  );
  let data = await res.text();
  let lastCheckIn = new Date(parseInt(data));
  return Date.now() - lastCheckIn <= 5 * 60 * 1000;
}

export default async function ({ addon, global, console, msg }) {
  let projectId = "738141961";

  await updateThumb(projectId);
  setInterval(updateThumb, 1000 * 60 * 5);
  console.log(await isOnline(projectId));
}
