export const isScratchAprilFools23 = () => {
  let val = false;
  const now = Date.now() / 1000;
  if (!__scratchAddonsRedux.state && now < 1712059200 && now > 1711886400) val = true;
  else {
    val = Object.entries(__scratchAddonsRedux.state.session.session.flags).some(
      ([k, v]) => k.includes("normal") && v === true
    );
  }
  if (val === true && document.body) document.body.classList.toggle("totally-normal", true); // Only add once
  return val;
};
