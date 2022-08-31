const keyMirror = (obj) => Object.fromEntries(Object.entries(obj).map(([k]) => [k, k]));

export default keyMirror;
