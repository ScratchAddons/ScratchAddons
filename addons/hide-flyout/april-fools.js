export const isScratchAprilFools23 = () => {
  let val = false;
  if (!__scratchAddonsRedux.state) val = true;
  else {
    val = Object.entries(__scratchAddonsRedux.state.session.session.flags).some(
      ([k, v]) => k.includes("normal") && v === true
    );
  }
  if (val === true) document.body.classList.toggle("totally-normal", true); // Only add once
  return val;
};
