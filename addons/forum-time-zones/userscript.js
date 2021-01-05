export default async function ({ addon, _global, _console }) {
  const { default: moment } = await import(addon.self.lib + "/moment.js");

  moment.locale(addon.auth.scratchLang === "en" ? "en-gb" : addon.auth.scratchLang);
  const forum_topic_id = parseInt(
    new URL(document.querySelector("meta[property='og:url']").content).pathname.split("/")[3]
  );
  const time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
            document.querySelector(`#p${e} > .box > .box-head > a`).innerText = moment(
              new Date(new Date(p.time.posted).toLocaleString("en-US", { timeZone: time_zone })).toISOString()
            ).calendar();
          }
        });
    });
}
