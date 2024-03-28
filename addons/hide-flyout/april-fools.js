export const isScratchAprilFools24 = async (redux) => {
  let val = false;
  const now = Date.now() / 1000;
  if (!redux.state && now < 1712059200 && now > 1711886400) val = true;
  else {
    await redux.waitForState((state) => state.session?.session?.flags);
    val = Object.entries(redux.state.session.session.flags).some(([k, v]) => k.includes("normal") && v === true);
  }
  return val;
};
