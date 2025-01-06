export default async function ({ addon, console }) {
  addon.self.addEventListener("reenabled", () =>
    document
      .querySelectorAll(".tclcon>h3>a")
      .forEach((link) => (link.href = link.href.replace(/(\d+)\/?$/, "$1/unread/")))
  );
  addon.self.addEventListener("disabled", () =>
    document.querySelectorAll(".tclcon>h3>a").forEach((link) => (link.href = link.href.replace(/unread\/?$/, "")))
  );

  while (true) {
    const link = await addon.tab.waitForElement(".tclcon>h3>a", {
      markAsSeen: true,
      condition: () => !addon.self.disabled,
    });
    console.log("found element");
    link.href = link.href.replace(/(\d+)\/?$/, "$1/unread/");
  }
}
