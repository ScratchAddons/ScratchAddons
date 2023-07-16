export default function ({ addon, msg }) {
  document.querySelectorAll(".blockpost").forEach((post) => {
    const container = document.createElement("span");
    const middleDot = document.createElement("span");
    const button = document.createElement("a");
    container.classList.add("sa-skip-post");
    middleDot.textContent = " • ";
    container.appendChild(middleDot);
    button.href = `#${post.nextElementSibling.id || "post"}`;
    button.textContent = msg("skip-post");
    container.appendChild(button);
    post.querySelector(".box-head").appendChild(container);
  });
  addon.self.addEventListener("disabled", () => {
    document.querySelectorAll(".sa-skip-post").forEach((el) => (el.style.display = "none"));
  });
  addon.self.addEventListener("reenabled", () => {
    document.querySelectorAll(".sa-skip-post").forEach((el) => (el.style.display = ""));
  });
}
