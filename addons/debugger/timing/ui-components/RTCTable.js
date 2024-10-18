export default class RTCTableComponent {
  constructor(rtcDataUrl, config = {}) {
    this.rtcDataUrl = rtcDataUrl;
    this.config = config;
  }

  // Helper to create table element
  createTableElement() {
    const table = document.createElement("table");
    table.className = "sa-rtc-table";
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    return { table, tbody };
  }

  // Populate table data from the rtc.json file in a four-column layout
  async populateTable(tbody) {
    try {
      const response = await fetch(this.rtcDataUrl);
      const data = await response.json();

      const colorDict = {
        "motion": { backgroundColor: "rgb(75, 153, 253)" },
        "looks": { backgroundColor: "rgb(152, 103, 252)" },
        "sound": { backgroundColor: "rgb(207, 97, 205)" },
        "event": { backgroundColor: "rgb(255, 189, 32)" },
        "control": { backgroundColor: "rgb(255, 168, 40)" },
        "sensing": { backgroundColor: "rgb(92, 178, 213)" },
        "operator": { backgroundColor: "rgb(90, 193, 93)" },
        "data": { backgroundColor: "rgb(255, 136, 37)" },
        "procedures": { backgroundColor: "rgb(255, 96, 128)" },
        "argument": { backgroundColor: "rgb(255, 96, 128)" },
        "pen": { backgroundColor: "rgb(20, 190, 141)" },
      };

      const entries = Object.entries(data);
      const groupCount = Math.ceil(entries.length / 4);

      for (let rowIndex = 0; rowIndex < groupCount; rowIndex++) {
        const row = document.createElement("tr");

        for (let colIndex = 0; colIndex < 4; colIndex++) {
          const index = rowIndex + colIndex * groupCount;
          if (index >= entries.length) break; // Handle case when there's no more data

          const [opcode, timeValue] = entries[index];

          const opcodeCell = document.createElement("td");
          opcodeCell.textContent = opcode.split("_")[1];

          const timeCell = document.createElement("td");

          // Apply the background color from the color dictionary
          const opcodeParts = opcode.split('_');
          if (colorDict[opcodeParts[0]]) {
            Object.assign(opcodeCell.style, colorDict[opcodeParts[0]]);
            Object.assign(timeCell.style, colorDict[opcodeParts[0]]);
          }

          // Handle array values (e.g., [D, E]) or normal values
          if (Array.isArray(timeValue)) {
            timeCell.textContent = timeValue[1] + ' + ' + timeValue[0] + 'n';
          } else {
            timeCell.textContent = timeValue;
          }

          row.appendChild(opcodeCell);
          row.appendChild(timeCell);
        }

        tbody.appendChild(row);
      }
    } catch (error) {
      console.error("Error loading RTC data:", error);
    }
  }

  // Insert table into the provided container
  renderInto(containerElement) {
    const { table, tbody } = this.createTableElement();
    this.populateTable(tbody).then(() => {
      containerElement.innerHTML = ''; // Clear any existing content
      containerElement.appendChild(table); // Insert the table
    });
  }
}
