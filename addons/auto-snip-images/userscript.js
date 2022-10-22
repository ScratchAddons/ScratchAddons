export default async function ({ addon }) {
  const query = addon.settings.get("allPosts") == true ? ".post_body_html > img, blockquote > img" : "blockquote > img";

  document.querySelectorAll(query).forEach((image) => {
    let details = document.createElement("details");
    let summary = document.createElement("summary");
    let newImage = document.createElement("img");

    newImage.src = image.src;
    details.appendChild(summary);
    details.appendChild(newImage);
    summary.innerText = "Expand image";
    image.parentElement.insertBefore(details, image);
    image.remove();

    summary.style.fontStyle = "italic";
    details.style.cursor = "pointer";
    details.style.userSelect = "none";
  });
}
