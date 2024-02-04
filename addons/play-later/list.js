const storageKey = 'sa-play-later';

export function addToList(id) {
    id = String(id);
    let list = getList();

    if (list.includes(id)) {
        list.splice(list.indexOf(id), 1);
    }

    list.unshift(id);
    localStorage.setItem(storageKey, JSON.stringify(list));
    return list;
}

export function removeFromList(id) {
    id = String(id);
    let list = getList();

    if (list.includes(id)) {
        list.splice(list.indexOf(id), 1);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(list));

    return list;
}

export function getList() {
    let items = localStorage.getItem(storageKey);
    if (items == null) {
        localStorage.setItem(storageKey, JSON.stringify([]));
        return [];
    }

    return JSON.parse(items);
}