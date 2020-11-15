export default async function ({ addon, console, msg }) {
  let projectInfo;
  while (true) {
    const buttons = await addon.tab.waitForElement(".preview .project-buttons", { markAsSeen: true });
    const container = document.createElement("div");
    container.className = "sa-project-info";
    buttons.insertBefore(container, buttons.firstChild);
    if (!projectInfo) {
      const projectId = location.pathname.split("/")[2];
      const projectData = await (await fetch("https://projects.scratch.mit.edu/" + projectId)).json();
      if ("targets" in projectData) {
        let scriptCount = 0;
        for (let target of projectData.targets) {
          scriptCount += Object.values(target.blocks).filter((block) => block.topLevel).length;
        }
        projectInfo = {
          spriteCount: projectData.targets.length - 1, // see scratch-www/src/lib/project-info.js, line 10
          scriptCount: scriptCount,
        };
      } else if ("info" in projectData) {
        projectInfo = projectData.info;
      } else {
        projectInfo = { spriteCount: "?", scriptCount: "?" };
      }
    }
    container.appendChild(
      msg(
          projectInfo.spriteCount == 1 ? "sprite" : "sprites",
          {num: projectInfo.spriteCount}
      )
    );
    container.appendChild(document.createElement("br"));
    container.appendChild(
        msg(
            projectInfo.spriteCount == 1 ? "script" : "scripts",
            {num: projectInfo.spriteCount}
        )
    );
  }
}
