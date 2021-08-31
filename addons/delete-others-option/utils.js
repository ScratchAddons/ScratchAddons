export function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function queryByText(node, text) {
  const childNodes = Array.from(node.childNodes);
  return childNodes.find((childNode) => childNode.innerText === text);
}

export function removeClassContainingText(classList, text) {
  const classArray = Array.from(classList);
  const classContaingText = classArray.find((nodeClass) => nodeClass.includes(text));
  if (classContaingText) {
    classList.remove(classContaingText);
  }
}

export function getAncestorWithClass(node, className) {
  while (true) {
    node = node.parentNode;
    if (!node) {
      return false;
    }
    if (node.classList.contains(className)) {
      return node;
    }
  }
}

export function getAncestorWithId(node, id) {
  while (true) {
    node = node.parentNode;
    if (!node) {
      return false;
    }
    if (node.id === id) {
      return node;
    }
  }
}
