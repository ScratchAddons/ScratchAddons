
export function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export function queryByText(node, text) {
    const childNodes = Array.from(node.childNodes)
    return childNodes.find((childNode) => childNode.innerText === text);
}

export function removeClassContainingText(classList, text) {
    const classArray = Array.from(classList);
    const classContaingText = classArray.find((nodeClass) => nodeClass.includes(text))
    if (classContaingText) {
        classList.remove(classContaingText)
    }
}

export function getSiblings(e) {
    let siblings = [];

    // if no parent, return no sibling
    if (!e.parentNode) {
        return siblings;
    }

    let sibling = e.parentNode.firstChild;

    // collecting siblings
    while (sibling) {
        if (sibling.nodeType === 1 && sibling !== e) {
            siblings.push(sibling);
        }
        sibling = sibling.nextSibling;
    }
    return siblings;
}

export function getMutationAddedNode(mutation) {
    if (mutation.type === 'childList') {
        const addedNodes = mutation.addedNodes;
        if (addedNodes.length === 1) {
            return addedNodes[0];
        }
    }
    return null;
}

export function getAncestorWithClass(node, className) {
    while (true) {
        node = node.parentNode;
        if (!node) { return false; }
        if (node.classList.contains(className)) {
            return node;
        }
    }
}