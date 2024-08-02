export default async function ({ addon, console }) {
  const MONTH_TO_INT = {
    "Jan.": 0,
    "Feb.": 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    "Aug.": 7,
    "Sept.": 8,
    "Oct.": 9,
    "Nov.": 10,
    "Dec.": 11,
  };

  /** @type {{edit: {el: HTMLElement; fetched: string; og: string} | undefined; post: {el: HTMLElement; fetched: string; og: string}}[]} */
  const cache = [];
  const locale = addon.auth.scratchLang;

  const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
    localeMatcher: "best fit",
    numeric: "auto",
    style: "long",
  });

  /**
   * @param {string} date
   * @param {boolean} transl
   */
  const parsePostDate = (date, transl) => {
    let [month, day, year, time] = date.split(" ");
    const now = new Date();

    if (year && time) {
      day = parseInt(day.slice(0, -1));
      year = parseInt(year);
      const [hh, mm, ss] = time.split(":").map(Number);

      now.setFullYear(year, MONTH_TO_INT[month], day);
      now.setHours(transl ? hh - 4 : hh, mm, ss);
    } else {
      const [hh, mm, ss] = date.split(" ")[1].split(":").map(Number);
      if (month === "Yesterday") {
        now.setDate(now.getDate() - 1);
      }
      now.setHours(transl ? hh - 4 : hh, mm, ss, 0);
    }
    return new Date(now.toLocaleString() + " EDT");
  };

  /** @param {string} date  */
  const parseEditDate = (date, transl) => parsePostDate(/\(([^)]+)\)/.exec(date)[1], transl);

  const forumTimeFormatter = (time) => {
    // This represents the time with timezone added/subtracted to the base time.
    // UTC representation of this is off by the timezone offset.
    // Temporary solution until browsers implement Temporal.
    const localTimeRepr = new Date(
      time.toLocaleString("en-US", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    );
    // Due to daytime saving, diff between two Date is inaccurate unless we both use timezoned Date
    // Math.min makes sure nobody gets posts from tomorrow
    const localDateDiff = Math.min(Math.floor(localTimeRepr / 8.64e7) - Math.floor(time / 8.64e7), 0);
    const timePart = localTimeRepr.toLocaleTimeString("en-GB");
    switch (localDateDiff) {
      case 0:
      case -1: {
        const relativePart = relativeFormatter.format(localDateDiff, "day");
        return `${relativePart[0].toUpperCase() + relativePart.slice(1)} ${timePart}`;
      }
      default: {
        const datePart = localTimeRepr.toLocaleDateString(locale, {
          dateStyle: "long",
        });
        return `${datePart} ${timePart}`;
      }
    }
  };

  addon.self.addEventListener("disabled", () => {
    for (const c of cache) {
      const { el, og } = c.post;
      el.innerText = og;
      if (c.edit) {
        const { el, og } = c.edit;
        el.innerText = og;
      }
    }
  });
  addon.self.addEventListener("reenabled", () => {
    for (const c of cache) {
      const { el, fetched } = c.post;
      el.innerText = forumTimeFormatter(fetched);
      if (c.edit) {
        const { el, fetched } = c.edit;
        el.innerText = forumTimeFormatter(fetched);
      }
    }
  });

  let doc = document;
  let fetched = false;

  if (locale !== "en-US") {
    const form = new FormData();
    form.append("language", "en");
    // ommiting credentials prevents setting from becoming permanent
    const params = { method: "POST", body: form, credentials: "omit" };

    let html = await fetch("https://scratch.mit.edu/i18n/setlang/", params);
    while (!html.ok) {
      html = await fetch("https://scratch.mit.edu/i18n/setlang/", params);
    }

    doc = new DOMParser().parseFromString(await html.text(), "text/html");
    fetched = true;
  }

  const posts = [...doc.querySelectorAll(".box")].slice(1, locale === "en-US" ? -2 : -1);
  const postDates = posts.map((e) => e.querySelector(".box-head > a"));
  const editDates = posts.map((e) => e.querySelector(".posteditmessage"));
  postDates.forEach((postDate, i) => {
    const editDate = editDates[i];
    const localPostTime = parsePostDate(postDate.innerText, fetched);
    const localEditTime = editDate ? parseEditDate(editDate.innerText, fetched) : undefined;

    const url = new URL(postDate.href).pathname;
    const actualPostDate = document.querySelector(`.box-head > a[href="${url}"]`);
    const actualEditDate = document.querySelector(`div#p${url.split("/")[3]} .posteditmessage`);

    cache.push({
      post: {
        el: actualPostDate,
        fetched: localPostTime,
        og: postDate.innerText,
      },
      edit: editDate
        ? {
            el: actualEditDate,
            fetched: localEditTime,
            og: editDate.innerText,
          }
        : undefined,
    });

    if (!addon.self.disabled) {
      actualPostDate.innerText = forumTimeFormatter(localPostTime);
      if (localEditTime) {
        const ogText = editDate.innerText;
        actualEditDate.innerText = ogText.replace(/\(([^)]+)\)/, `(${forumTimeFormatter(localEditTime)})`);
      }
    }
  });
}
