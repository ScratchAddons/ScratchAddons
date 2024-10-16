if (typeof browser === "object" && chrome.scripting) {
  const manifest = chrome.runtime.getManifest();
  const manifestScripts = manifest.content_scripts.filter((script) =>
    script.matches.includes("http://localhost:8602/*")
  );
  const scripts = manifestScripts.map((scriptObj, i) => ({
    id: `ff_${i}`,
    matches: ["http://localhost/*"],
    js: scriptObj.js.map((url) => new URL(url).pathname),
    runAt: scriptObj.run_at,
    allFrames: scriptObj.all_frames,
  }));
  chrome.scripting.registerContentScripts(scripts).catch((e) => console.error(e));
}

// Scripting API should only be used for local development purposes.
// At the moment, the scripting permission is not present in the release version.
chrome.scripting = "sa_no_scripting";
