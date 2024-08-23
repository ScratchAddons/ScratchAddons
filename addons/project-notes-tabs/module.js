export const enableTabs = () => {
  document.body.classList.add("sa-project-tabs-on");
  document.querySelector(".sa-project-tabs-wrapper").style.display = "";
}

export const disableTabs = () => {
  document.body.classList.remove("sa-project-tabs-on");
  document.querySelectorAll(".description-block").forEach((e) => (e.style.display = ""));
  document.querySelector(".sa-project-tabs-wrapper").style.display = "none";
}
