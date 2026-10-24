export default async function ({ addon, console }) {
  while (true) {
    await addon.tab.waitForElement('.backpack', { markAsSeen: true });

    const backpack = document.querySelector('.backpack');
    const moreBtn = Array.from(backpack.querySelectorAll('div, button')).find(el => el.textContent.trim() === 'More');

    if (moreBtn && !document.querySelector('.scratch-addons-clear-backpack-btn')) {
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear Backpack';
      clearBtn.className = 'scratch-addons-clear-backpack-btn';
      clearBtn.style.display = 'inline-block';
      clearBtn.style.marginLeft = '12px';
      clearBtn.style.padding = '8px 16px';
      clearBtn.style.backgroundColor = '#ff4c4c';
      clearBtn.style.color = 'white';
      clearBtn.style.border = 'none';
      clearBtn.style.borderRadius = '4px';
      clearBtn.style.cursor = 'pointer';
      clearBtn.style.fontWeight = 'bold';
      clearBtn.style.verticalAlign = 'middle';
      clearBtn.style.zIndex = '99999';

      clearBtn.addEventListener('click', () => {
        const confirmed = window.confirm('Are you sure you want to empty your entire backpack? This cannot be undone.');
        if (!confirmed) return;

        const backpackItems = backpack.querySelectorAll('.backpack-item, [class*="backpackItem"]');
        
        if (backpackItems.length === 0) {
          alert('Your backpack is already empty!');
          return;
        }

        backpackItems.forEach(item => {
          const deleteBtn = item.querySelector('[class*="delete"], [class*="remove"], button');
          if (deleteBtn) {
            deleteBtn.click();
          } else {
            item.remove();
          }
        });

        console.log('Backpack cleared successfully!');
      });

      moreBtn.parentNode.insertBefore(clearBtn, moreBtn.nextSibling);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
