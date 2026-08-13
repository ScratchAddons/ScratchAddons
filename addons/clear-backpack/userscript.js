export default async function ({ addon, console }) {
  const backpackHeader = await addon.tab.waitForElement('[class*="backpack_backpack-header"]', {
    markAsHandled: true,
  });

  const clearBtn = document.createElement("button");
  clearBtn.className = "sa-empty-backpack-btn";
  clearBtn.innerText = "🗑️ Clear All";
  clearBtn.style.cssText = `
    margin-left: 8px;
    background: #ff4c4c;
    color: white;
    border: none;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
  `;

  clearBtn.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete ALL items from your backpack?")) return;

    const items = document.querySelectorAll('[class*="backpack_backpack-item"]');
    console.log(`Hamdancoding's script clearing ${items.length} assets...`);

    for (const item of items) {
      item.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 60));
    }
  });

  backpackHeader.appendChild(clearBtn);
}
