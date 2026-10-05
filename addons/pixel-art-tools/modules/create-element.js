export function createElement(tag, props = {}, children = []) {
  const element = Object.assign(document.createElement(tag), props);
  element.append(...children);
  return element;
}
