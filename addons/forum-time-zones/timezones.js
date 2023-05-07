export default async function ({ addon, console }) {
  const twelveHourTime = addon.settings.get("twelve-hour-time") === true;
  if (addon.settings.get("local-timezone") === true) {
    const cache = [];
    const locale = addon.auth.scratchLang;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localCurrentTimeRepr = new Date(new Date().toLocaleString("en-US", { timeZone }));
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
          if (addon.settings.get("relative-dates") === true) {
            const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
              localeMatcher: "best fit",
              numeric: "auto",
              style: "long",
            });
            const relativePart = relativeFormatter.format(localDateDiff, "day");
            return `${capitalize(relativePart)} ${timePart}`;
          }
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
    let mobileForum;
    try {
      mobileForum = await (
        await fetch(
          `https://scratch.mit.edu/discuss/m/topic/${location.pathname.split("/")[3]}?page=${pageNumber || 1}`,
          {
            credentials: "omit", // disable reply box
          }
        )
      ).text();
    } catch {
      throw "fetch error";
    }
    await addon.tab.waitForElement(".blockpost");
    const parser = new DOMParser();
    const doc = parser.parseFromString(mobileForum, "text/html");
    const posts = [...doc.querySelectorAll("article")];
    posts.forEach((e) => {
      const time = e.querySelector("time").getAttribute("datetime") + ".000Z"; // default timezone is UTC
      const timeOnPost = document.querySelector(`#p${e.id.substring(5)} > .box > .box-head > a`);
      // Optional chaining ? so that logged out forums don't cause console error
      cache.push({
        el: timeOnPost,
        fetched: time,
        og: timeOnPost?.innerText,
      });
      if (!addon.self.disabled && timeOnPost?.innerText) {
        timeOnPost.innerText = formatter(time);
      }
    });
  }

  const boxHeads = document.querySelectorAll(".box-head");
  boxHeads.forEach((el) => {
    if (!el.getElementsByTagName("a")[0]) return;
    const text = el.getElementsByTagName("a")[0].innerText;
    el.getElementsByTagName("a")[0].innerText = handleFormatting(text);
  });

  // this part was mostly written by @towerofnix on github!
  function handleFormatting(text) {
    const formatter = new Intl.DateTimeFormat("default", {
      hour12: twelveHourTime,
      timeStyle: "medium",
      dateStyle: "long",
    });

    const timeParts = text.replace(/\./g, "").match(/^(.*?)\s+([0-9][0-9]):([0-9][0-9]):([0-9][0-9])$/);
    if (!timeParts) {
      console.warn(`Failed to parse forum timestamp: ${text}`);
      return;
    }

    const [day, hours, minutes, seconds] = timeParts.slice(1);

    let date;
    let isRelative = false;
    switch (day) {
      case addon.tab.scratchMessage("Today"):
        isRelative = true;
        date = new Date();
        break;
      case addon.tab.scratchMessage("Yesterday"):
        isRelative = true;
        date = new Date();
        date.setDate(date.getDate() - 1);
        break;
      default:
        date = new Date(day);
    }

    date.setHours(hours, minutes, seconds, 0);

    if (isNaN(date.getTime())) {
      console.warn(`Failed to calculate date/time for forum timestamp: ${text} - regex timeParts:`, timeParts);
      return;
    }

    let formattedDate = formatter.format(date);
    if (isRelative && addon.settings.get("relative-dates") === true) {
      const resetFormatter = new Intl.DateTimeFormat("default", {
        hour12: twelveHourTime === true,
        dateStyle: "long",
      });
      formattedDate = formattedDate.replace(resetFormatter.format(date), day);
    }

    return formattedDate;
  }
}
