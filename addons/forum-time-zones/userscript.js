export default async function ({ addon, console }) {
  const cache = [];
  const locale = addon.auth.scratchLang;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localCurrentTimeRepr = new Date(new Date().toLocaleString("en-US", { timeZone }));
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
    localeMatcher: "best fit",
    numeric: "auto",
    style: "long",
  });
  const capitalize = (str) => str[0].toUpperCase() + str.slice(1);
  const formatter = (time) => {
    // This is the correct representation of the given time.
    const instantTimeRepr = new Date(time);
    // This represents the time with timezone added/subtracted to the base time.
    // UTC representation of this is off by the timezone offset.
    // Temporary solution until browsers implement Temporal.
    const localTimeRepr = new Date(instantTimeRepr.toLocaleString("en-US", { timeZone }));
    // Due to daytime saving, diff between two Date is inaccurate unless we both use timezoned Date
    // Math.min makes sure nobody gets posts from tomorrow
    const localDateDiff = Math.min(Math.floor(localTimeRepr / 8.64e7) - Math.floor(localCurrentTimeRepr / 8.64e7), 0);
    const timePart = localTimeRepr.toLocaleTimeString("en-GB");
    switch (localDateDiff) {
      case 0:
      case -1: {
        const relativePart = relativeFormatter.format(localDateDiff, "day");
        return `${capitalize(relativePart)} ${timePart}`;
      }
      default: {
        const datePart = localTimeRepr.toLocaleDateString(locale, {
          dateStyle: "long",
        });
        return `${datePart} ${timePart}`;
      }
    }
  };
  const pageNumber = new URLSearchParams(location.search).get("page");

  addon.self.addEventListener("disabled", () => {
    for (const c of cache) {
      const { el, og } = c;
      el.innerText = og;
    }
  });
  addon.self.addEventListener("reenabled", () => {
    for (const c of cache) {
      const { el, fetched } = c;
      el.innerText = formatter(fetched);
    }
  });
  fetch(`https://scratch.mit.edu/discuss/m/topic/${location.pathname.split("/")[3]}?page=${pageNumber || 1}`, {
    credentials: "omit", // disable reply box
  })
    .catch(() => {
      throw "fetch error";
    })
    .then((res) => res.text())
    .then(async (text) => {
      await addon.tab.waitForElement(".blockpost");
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const posts = [...doc.querySelectorAll("article")];
      posts.forEach((e) => {
        const time = e.querySelector("time").getAttribute("datetime") + ".000Z"; // default timezone is UTC
        const timeOnPost = document.querySelector(`#p${e.id.substring(5)} > .box > .box-head > a`);
        cache.push({
          el: timeOnPost,
          fetched: time,
          og: timeOnPost.innerText,
        });
        if (!addon.self.disabled) {
          timeOnPost.innerText = formatter(time);
        }
      });
    });
}
