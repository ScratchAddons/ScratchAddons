import { textColor } from "../../libraries/common/cs/text-color.esm.js";

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
  let tweets = [];
  function updateTweetTheme(iframe) {
    if (!addon.self.disabled && textColor(addon.settings.get("box"), false, true)) {
      iframe.src = iframe.src.replace("theme=light", "theme=dark");
    } else {
      iframe.src = iframe.src.replace("theme=dark", "theme=light");
    }
  }
  function updateAllTweets() {
    for (let tweet of tweets) updateTweetTheme(tweet);
  }
  addon.self.addEventListener("disabled", updateAllTweets);
  addon.self.addEventListener("reenabled", updateAllTweets);
  addon.settings.addEventListener("change", updateAllTweets);
  while (true) {
    const tweet = await addon.tab.waitForElement(".twitter-tweet iframe[src*='theme=light']", { markAsSeen: true });
    tweets.push(tweet);
    if (textColor(addon.settings.get("box"), false, true)) {
      updateTweetTheme(tweet);
      const loadListener = () => {
        updateTweetTheme(tweet);
        tweet.removeEventListener("load", loadListener);
      };
      tweet.addEventListener("load", loadListener);
    }
  }
}
