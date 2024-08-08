export function createTableHeader(config) {
  const tableHeader = Object.assign(document.createElement("div"), {
    className: "sa-timing-timer sa-timing-header",
    style: "display:none",
  });

  tableHeader.innerHTML = `
      <span>Label</span>
      <span>Total Time</span>
      <span>Average Time</span>
      <span class='percentheader'>Percent Time</span>
      <span>Call Count</span>
      <span class='rtcheader'>RTC</span>
    `;

  const rtcHeader = tableHeader.querySelector(".rtcheader");
  const percentHeader = tableHeader.querySelector(".percentheader");
  rtcHeader.style.display = "none";

  // Mapping from table header textContent to timer keys
  const headerKeyMapping = {
    Label: "idx",
    "Total Time": "totalTime",
    "Average Time": "avgTime",
    "Percent Time": "totalTime",
    "Ratio Time": "totalTime",
    "Call Count": "callCount",
    RTC: "rtc",
  };

  tableHeader.querySelectorAll("span, a").forEach((headerElement) => {
    headerElement.style.cursor = "pointer";
    headerElement.addEventListener("click", () => {
      const headerName = headerElement.textContent.trim();
      const timerKey = headerKeyMapping[headerName];
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
