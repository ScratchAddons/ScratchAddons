export default async function ({ addon, console }) {
  await addon.tab.waitForElement(".pagination");
  const pagination = document.getElementsByClassName("pagination")[0].cloneNode(true);
  const paginationTop = document.querySelector(".box-head").appendChild(pagination);
  paginationTop.style.float = "right";
  addon.tab.displayNoneWhileDisabled(paginationTop);
}
