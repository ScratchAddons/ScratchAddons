import { addToList, getList, removeFromList } from './list.js';

const projectId = location.pathname.split('/')[2];

async function addToStorage() {
    addToList(projectId);
}

async function removeFromStorage() {
    removeFromList(projectId);
}

export default async function ({ addon, console, msg }) {
    async function createButton() {
        await addon.tab.waitForElement('.project-buttons');

        let existingButton = document.querySelector('.sa-play-later-button');
        if (existingButton) {
            existingButton.remove();
        }

        const isRemoveButton = getList().includes(projectId);
        let button = document.createElement('button');
        button.classList.add('button', 'action-button', 'sa-play-later-button');
        if (isRemoveButton) {
            button.textContent = msg('remove');
        } else {
            button.textContent = msg('add');
        }
        
        button.addEventListener('click', () => {
            if (isRemoveButton) {
                removeFromStorage();
            } else {
                addToStorage();
            }
            
            createButton();
        });

        addon.tab.appendToSharedSpace({space: 'afterCopyLinkButton', element: button});
    }

    await createButton();
    addon.tab.addEventListener('urlChange', () => {
        if (addon.tab.editorMode === 'projectpage') {
            createButton();
        }
    });
}