export default async function ({ addon, console }) {
  addon.tab.waitForElement(".annual-report-content .covid-response-section").then(() => {
    document.querySelector(".page").classList.add("sa-annual-report-2019");
  });
  addon.tab.waitForElement(".annual-report-content .looking-forward").then(() => {
    document.querySelector(".page").classList.add("sa-annual-report-2020");
  });
}
