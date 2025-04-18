export default function cssVariables(obj) {
  return Object.entries(obj)
    .map(([name, value]) => `${name}: ${value};`)
    .join("\n");
}
