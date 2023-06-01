const FUNCTION_OPCODE = "procedures_definition";

const APPEARANCE_CODE_TYPE_LIST = ["motion", "looks", "sound"];

const GETTER_MAP = {
  motion: (data) => (isNaN(data["motion"]) ? 0 : data["motion"]),
  looks: (data) => (isNaN(data["looks"]) ? 0 : data["looks"]),
  sound: (data) => (isNaN(data["sound"]) ? 0 : data["sound"]),
  events: (data) => (isNaN(data["event"]) ? 0 : data["event"]),
  control: (data) => (isNaN(data["control"]) ? 0 : data["control"]),
  sensing: (data) => (isNaN(data["sensing"]) ? 0 : data["sensing"]),
  operators: (data) => (isNaN(data["operator"]) ? 0 : data["operator"]),
  variables: (data) => (isNaN(data["data"]) ? 0 : data["data"]),
  "my-blocks": (data) => {
    const argument = isNaN(data["argument"]) ? 0 : data["argument"];
    const procedures = isNaN(data["procedures"]) ? 0 : data["procedures"];
    return argument + procedures;
  },
};

const CODE_GENETIC_LIST = [
  "motion",
  "looks",
  "sound",
  "events",
  "control",
  "sensing",
  "operators",
  "variables",
  "my-blocks",
];

const CODE_GENETIC_TABLE_LIST = [
  ["motion", "events", "operators"],
  ["looks", "control", "variables"],
  ["sound", "sensing", "my-blocks"],
];

export default async function ({ addon, msg, console }) {
  const vm = addon.tab.traps.vm;
  await new Promise((resolve) => {
    if (vm.editingTarget) return resolve();
    vm.runtime.once("PROJECT_LOADED", resolve);
  });
  const targets = addon.tab.traps.vm.runtime.targets;
  const result = analyseCode(targets);
  const statsNode = await addon.tab.waitForElement("#view > div > div.inner > div:nth-child(3)");
  const projectStatsContainer = document.createElement("div");
  statsNode.after(projectStatsContainer);
  projectStatsContainer.className = "flex-row preview-row";
  const projectStatsContent = document.createElement("div");
  projectStatsContainer.appendChild(projectStatsContent);
  projectStatsContent.className = "flex-row project-stats-content";
  const container = createElement("ps-container", "div");
  projectStatsContent.appendChild(container);
  renderStats(addon, container, result);
}

function analyseCode(targets) {
  let codeCount = 0;
  let classifiedCodeMap = {};
  targets.map((target) => {
    for (const [, v] of Object.entries(target.sprite.blocks._blocks)) {
      let opcode = v.opcode;
      if (opcode === undefined || opcode.indexOf("_") <= 0 || v.shadow || opcode === "data_variable") {
        continue;
      }
      codeCount++;
      let codeType = opcode.split("_", 1)[0];
      isNaN(classifiedCodeMap[codeType]) ? (classifiedCodeMap[codeType] = 1.0) : classifiedCodeMap[codeType]++;
    }
  });
  return {
    codeCount: codeCount,
    classifiedCodeMap: classifiedCodeMap,
  };
}

function renderStats(addon, container, result) {
  const psHeader = createElement("ps-header", "div");
  psHeader.appendChild(createElementWithTextContent("ps-header-content project-textlabel", "span", "Code Genetic Map"));
  container.appendChild(psHeader);
  const rightContent = createElementWithTextContent(
    "ps-header-right-content project-textlabel",
    "a",
    "🔗 View Details"
  );
  const projectId = location.href.match(/\d+/)?.[0];
  rightContent.href = "https://tools.getgandi.com/projects/" + projectId;
  container.appendChild(rightContent);
  const psContent = createContent(addon, result);
  container.appendChild(psContent);
}

function createContent(addon, result) {
  const total = result.codeCount;
  const psContent = createElement("ps-content", "div");
  const classifiedCodeMap = (result.classifiedCodeMap ??= {});
  const codeGenetic = createCodeGenetic(addon, total, classifiedCodeMap);
  psContent.appendChild(codeGenetic);
  const codeGeneticTable = createCodeGeneticTable(total, classifiedCodeMap);
  psContent.appendChild(codeGeneticTable);
  return psContent;
}

function createCodeGenetic(addon, total, classifiedCodeMap) {
  const horizontalSlider = createElement("ps-code-genetic", "div");
  horizontalSlider.appendChild(createElement("ps-code-genetic-bg", "span"));
  let baseLine = 46;
  CODE_GENETIC_LIST.forEach((item) => {
    if (total === 0) {
      return;
    }
    const block = createElement(`ps-code-genetic-block ${item}`, "span");
    const num = GETTER_MAP[item](classifiedCodeMap);
    // Minus 0.01 is used as the accuracy compensation
    const width = (num * 837) / total - 0.01;
    block.style.left = `${baseLine}px`;
    block.style.width = `${width}px`;
    horizontalSlider.appendChild(block);
    baseLine += width;
  });
  horizontalSlider.appendChild(
    Object.assign(document.createElement("img"), {
      className: "ps-edge01",
      src: addon.self.dir + "/edge.svg",
    })
  );
  horizontalSlider.appendChild(
    Object.assign(document.createElement("img"), {
      className: "ps-edge02",
      src: addon.self.dir + "/edge.svg",
    })
  );
  return horizontalSlider;
}

function createCodeGeneticTable(total, classifiedCodeMap) {
  const codeGeneticTable = createElement("ps-code-genetic-table", "div");
  let sum = 0;
  CODE_GENETIC_TABLE_LIST.forEach((items, index) => {
    items.forEach((item, nestedIndex) => {
      codeGeneticTable.appendChild(
        createElementWithTextContent(`ps-code-genetic-item-${item}`, "span", `${item.replace("-", " ")}:`)
      );
      const codeSum = GETTER_MAP[item](classifiedCodeMap);
      codeGeneticTable.appendChild(
        createElementWithTextContent(`ps-code-genetic-item row${index} col${nestedIndex}`, "span", codeSum)
      );
      sum += codeSum;
    });
  });
  codeGeneticTable.appendChild(createElementWithTextContent("ps-code-genetic-item-extensions", "span", "Extensions:"));
  codeGeneticTable.appendChild(createElementWithTextContent("ps-code-genetic-item row0 col3", "span", total - sum));
  return codeGeneticTable;
}

function createSliderBG(name, value) {
  const psSliderBG = createElement(`ps-slider-bg ${name}`, "span");
  psSliderBG.appendChild(createElementWithTextContent("ps-slider-title", "text", name.toUpperCase()));
  psSliderBG.appendChild(createElementWithTextContent("ps-slider-content", "text", value));
  return psSliderBG;
}

function createElement(className, label) {
  const element = document.createElement(label);
  element.className = className;
  return element;
}

function createElementWithTextContent(className, label, textContent) {
  const element = createElement(className, label);
  element.textContent = textContent;
  return element;
}
