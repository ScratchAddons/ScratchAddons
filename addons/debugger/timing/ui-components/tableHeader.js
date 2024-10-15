export function createTableHeader(config, msg) {
  const tableHeader = Object.assign(document.createElement("div"), {
    className: "sa-timing-timer sa-timing-header",
    style: "display:none",
  });

  tableHeader.innerHTML = `
      <span class = 'timing-label'>${msg('timing-label')}</span>
      <span class = 'timing-total-time'>${msg('timing-total-time')}</span>
      <span class = 'timing-average-time'>${msg('timing-average-time')}</span>
      <span class = 'timing-percent-time'>${msg('timing-percent-time')}</span>
      <span class = 'timing-call-count'>${msg('timing-call-count')}</span>
      <span class = 'timing-rtc'>${msg('timing-rtc')}</span>
    `;

  const rtcHeader = tableHeader.querySelector(".timing-rtc");
  const percentHeader = tableHeader.querySelector(".timing-percent-time");
  rtcHeader.style.display = "none";

  // Mapping from table header textContent to timer keys
  const headerClassKeyMapping = {
    'timing-label': "idx",
    "timing-total-time": "totalTime",
    "timing-average-time": "avgTime",
    "timing-percent-time": "totalTime",
    "timing-call-count": "callCount",
    'timing-rtc': "rtc",
  };

  tableHeader.querySelectorAll("span, a").forEach((headerElement) => {
    headerElement.style.cursor = "pointer";
    headerElement.addEventListener("click", () => {
      const timerKey = headerClassKeyMapping[headerElement.className];
      if (config.sortHeader === timerKey) {
        config.sortDirection = config.sortDirection === "descending" ? "ascending" : "descending";
      } else {
        config.sortHeader = timerKey;
        config.sortDirection = "descending";
      }

      tableHeader.querySelectorAll("span, a").forEach((el) => el.classList.remove("active-header"));
      headerElement.classList.add("active-header");
    });
  });

  return { tableHeader, rtcHeader, percentHeader };
}
