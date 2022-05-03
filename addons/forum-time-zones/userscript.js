/**
 * @param {import("../types").UserscriptUtilities} param0
 */
export default async function ({ addon, _global, _console }) {
  const forum_topic_id = parseInt(location.pathname.split("/")[3]);
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
  window
    .fetch(`https://scratchdb.lefty.one/v2/forum/topic/${forum_topic_id}`)
    .catch(() => {
      throw "fetch error";
    })
    .then((res) => res.json())
    .then(async (data) => {
      await addon.tab.waitForElement(".blockpost");
      Array.prototype.map
        .call(document.getElementsByClassName("blockpost"), (e) => parseInt(e.id.replace("p", "")))
        .forEach((e) => {
          var p = data.posts.find((x) => x.id === e);
          if (p) {
            document.querySelector(`#p${e} > .box > .box-head > a`).innerText = formatter(p.time.posted);
          }
        });
    });
}
