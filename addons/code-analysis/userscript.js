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
  const content = await addon.tab.waitForElement("#view > div > div.inner");
  const projectStatsContainer = document.createElement("div");
  content.appendChild(projectStatsContainer);
  projectStatsContainer.className = "flex-row preview-row";
  const projectStatsContent = document.createElement("div");
  projectStatsContainer.appendChild(projectStatsContent);
  projectStatsContent.className = "flex-row project-stats-content";
  const container = createElement("ps-container", "div");
  projectStatsContent.appendChild(container);
  renderStats(addon, container, result);
}

function analyseCode(targets) {
  const spriteCount = Object.values(targets).filter((o) => !o.isStage).length;
  let functionCount = 0;
  let codeCount = 0;
  let costumeCount = 0;
  let classifiedCodeMap = {};
  targets.map((target) => {
    for (const [, v] of Object.entries(target.sprite.blocks._blocks)) {
      let opcode = v.opcode;
      if (opcode === undefined || opcode.indexOf("_") <= 0 || v.shadow || opcode === "data_variable") {
        continue;
      }
      if (FUNCTION_OPCODE === opcode) {
        functionCount++;
      }
      codeCount++;
      let codeType = opcode.split("_", 1)[0];
      isNaN(classifiedCodeMap[codeType]) ? (classifiedCodeMap[codeType] = 1.0) : classifiedCodeMap[codeType]++;
    }
    costumeCount += target.sprite.costumes_.length;
  });
  const appearanceCount = APPEARANCE_CODE_TYPE_LIST.map((item) => classifiedCodeMap[item])
    .filter((item) => !isNaN(item))
    .reduce((total, item) => {
      return total + item;
    }, 0);
  return {
    spriteCount: spriteCount,
    functionCount: functionCount,
    codeCount: codeCount,
    costumeCount: costumeCount,
    appearanceCount: appearanceCount,
    classifiedCodeMap: classifiedCodeMap,
  };
}

function renderStats(addon, container, result) {
  const psHeader = createElement("ps-header", "div");
  psHeader.appendChild(createElementWithTextContent("ps-header-content", "span", "Project Statistics"));
  container.appendChild(psHeader);
  const psHeaderRight = createElement("ps-header-right", "div");
  const rightContent = createElementWithTextContent("ps-header-right-content", "a", "🔗 View Details");
  const projectId = location.href.match(/\d+/)?.[0];
  rightContent.href = "https://tools.getgandi.com/projects/" + projectId;
  psHeaderRight.appendChild(rightContent);
  container.appendChild(psHeaderRight);
  const psContent = createContent(addon, result);
  container.appendChild(psContent);
}

function createContent(addon, result) {
  const total = result.codeCount;
  const psContent = createElement("ps-content", "div");
  const psSliderContainer = createSlider(addon, result);
  psContent.appendChild(psSliderContainer);
  const classifiedCodeMap = (result.classifiedCodeMap ??= {});
  const horizontalGradientContainer = createHorizontalGradient(addon, total, result.appearanceCount);
  psContent.appendChild(horizontalGradientContainer);
  const codeGenetic = createCodeGenetic(addon, total, classifiedCodeMap);
  psContent.appendChild(codeGenetic);
  const codeGeneticTable = createCodeGeneticTable(total, classifiedCodeMap);
  psContent.appendChild(codeGeneticTable);
  return psContent;
}

function createSlider(addon, result) {
  const psSliderContainer = createElement("ps-slider-container", "div");
  psSliderContainer.appendChild(createSliderBG("sprite", result.spriteCount));
  psSliderContainer.appendChild(createSliderBG("code", result.codeCount));
  psSliderContainer.appendChild(createSliderBG("function", result.functionCount));
  psSliderContainer.appendChild(createSliderBG("costume", result.costumeCount));
  return psSliderContainer;
}

function createHorizontalGradient(addon, total, appearanceCount) {
  const horizontalGradientContainer = createElement("ps-horizontal-gradient-container", "div");
  horizontalGradientContainer.appendChild(createElement("ps-horizontal-gradient", "span"));
  const arrow = Object.assign(document.createElement("img"), {
    className: "ps-arrow",
    src: addon.self.dir + "/arrow.svg",
  });
  let location = 428;
  if (total !== 0) {
    location = (1 - Number.parseInt(appearanceCount) / total) * 787;
  }
  arrow.style.left = `${location}px`;
  horizontalGradientContainer.appendChild(arrow);
  horizontalGradientContainer.appendChild(
    createElementWithTextContent("ps-horizontal-description-motion", "span", "Motion and Appearance")
  );
  horizontalGradientContainer.appendChild(
    createElementWithTextContent("ps-horizontal-description-logic", "span", "Logic and Algorithm")
  );
  return horizontalGradientContainer;
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
    const width = (num * 837) / total;
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
  codeGeneticTable.appendChild(createElementWithTextContent("ps-code-genetic-footer", "span", "Code Genetic Map"));
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
