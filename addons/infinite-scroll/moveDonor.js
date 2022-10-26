export default async function ({ addon, global, console }) {
  const root = document.documentElement; //The :root element
  const footer = await addon.tab.waitForElement("#footer"); //The footer
  const donor = await addon.tab.waitForElement("#donor"); //The donor text

  footer.appendChild(donor); //Move the donor text to inside the footer
  root.style.setProperty("--footer-hover-height", "426px"); //Also make the hovered footer higher so the text is actually visible
}
