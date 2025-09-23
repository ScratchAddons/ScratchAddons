import fontToSvg from "./fontToSvg.js";

export default async ({addon,console,msg}) => {
  await addon.tab.loadScript("/libraries/thirdparty/cs/bezier.js");
  fontToSvg({addon,console,msg});
};
