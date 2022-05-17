export default async function ({ addon, console }) {
  addon.tab.waitForElement(".annual-report-content > .covid-response-section").then(() => {
    document.body.classList.add("sa-annual-report-2019");
  });
  addon.tab.waitForElement(".annual-report-content > .directors-message").then(() => {
    document.body.classList.add("sa-annual-report-2020");
  });
  addon.tab.waitForElement(".annual-report-content > .reach-section.t").then(() => {
    document.body.classList.add("sa-annual-report-2021");
  });
  while (true) {
    const tweet = await addon.tab.waitForElement(".twitter-tweet iframe[src*='theme=light']", { markAsSeen: true });
    setInterval(() => {
      tweet.src = tweet.src.replace("theme=light", "theme=dark");
    }, 0);
  }
}
