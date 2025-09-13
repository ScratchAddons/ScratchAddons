export function createTableHeader(config, msg) {
  const tableHeader = Object.assign(document.createElement("div"), {
    className: "sa-timing-timer sa-timing-header",
    style: "display:none",
  });

  // Create header spans dynamically
  const headerConfigs = [
    { className: "timing-label", messageKey: "timing-label" },
    { className: "timing-total-time", messageKey: "timing-total-time" },
    { className: "timing-average-time", messageKey: "timing-average-time" },
    { className: "timing-percent-time", messageKey: "timing-percent-time" },
    { className: "timing-call-count", messageKey: "timing-call-count" },
  ];

  let percentHeader;
  headerConfigs.forEach(({ className, messageKey }) => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = msg(messageKey);
    tableHeader.appendChild(span);
    
    if (className === "timing-percent-time") {
      percentHeader = span;
    }
  });

  // Mapping from table header textContent to timer keys
  const headerClassKeyMapping = {
    "timing-label": "idx",
    "timing-total-time": "totalTime",
    "timing-average-time": "avgTime",
    "timing-percent-time": "totalTime",
    "timing-call-count": "callCount",
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

  return { tableHeader, percentHeader };
}
