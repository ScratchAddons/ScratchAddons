import fontToSvg from "./fontToSvg.js";

export default async ({addon,console,msg}) => {
  await addon.tab.loadScript("/libraries/thirdparty/f2svg/bezier.js");
  fontToSvg({addon,console,msg});
};
