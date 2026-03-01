/**
 * Tab manager utility class
 * Used to create and manage tabs inside a modal
 */
export class TabManager {
  constructor(addon, content, containerClassName = "") {
    this.addon = addon;
    this.tabs = [];
    this.currentTabIndex = 0;

    // Initialize containers
    this.#initTabsContainer(content, containerClassName);
  }

  /**
   * Initialize the tabs container and header (private)
   * @private
   */
  #initTabsContainer(content, containerClassName) {
    this.tabsContainer = document.createElement("div");
    this.tabsContainer.className = this.addon.tab.scratchClass("gui_tabs", {
      others: containerClassName,
    });
    content.append(this.tabsContainer);

    this.tabsHeader = document.createElement("div");
    this.tabsHeader.className = this.addon.tab.scratchClass("react-tabs_react-tabs__tab-list", "gui_tab-list");
    this.tabsContainer.append(this.tabsHeader);
  }

  /**
   * Create a new tab
   * @param {string} tabName - display name for the tab
   * @param {string} tabId - unique identifier for the tab
   * @param {HTMLElement} panelContent - content element for the tab panel
   */
  createTab(tabName, tabId, panelContent) {
    const tabHeader = document.createElement("div");
    tabHeader.className = this.addon.tab.scratchClass("react-tabs_react-tabs__tab", "gui_tab");
    tabHeader.textContent = tabName;
    tabHeader.dataset.tabId = tabId;

    const tabPanel = document.createElement("div");
    tabPanel.className = this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel", "gui_tab-panel");
    tabPanel.dataset.tabId = tabId;

    if (panelContent) {
      if (Array.isArray(panelContent)) {
        panelContent.forEach((item) => tabPanel.append(item));
      } else {
        tabPanel.append(panelContent);
      }
    }

    const tab = {
      name: tabName,
      id: tabId,
      header: tabHeader,
      panel: tabPanel,
    };

    this.tabs.push(tab);

    // Append directly to the DOM
    this.tabsHeader.append(tabHeader);
    this.tabsContainer.append(tabPanel);

    // Add click event handler
    const tabIndex = this.tabs.length - 1;
    tabHeader.addEventListener("click", () => this.switchTab(tabIndex));
  }

  /**
   * Switch to a specified tab
   * @param {string|number} tabIdOrIndex - tab id or index
   */
  switchTab(tabIdOrIndex) {
    let tabIndex;

    // Support switching by ID or index
    if (typeof tabIdOrIndex === "string") {
      tabIndex = this.tabs.findIndex((tab) => tab.id === tabIdOrIndex);
      if (tabIndex === -1) {
        console.warn(`Tab with id "${tabIdOrIndex}" not found`);
        return;
      }
    } else {
      tabIndex = tabIdOrIndex;
    }

    if (tabIndex < 0 || tabIndex >= this.tabs.length) {
      console.warn(`Invalid tab index: ${tabIndex}`);
      return;
    }

    // Hide the current tab
    const currentTab = this.tabs[this.currentTabIndex];
    currentTab.header.classList.remove(
      this.addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
      this.addon.tab.scratchClass("gui_is-selected")
    );
    currentTab.panel.classList.remove(
      this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel--selected"),
      this.addon.tab.scratchClass("gui_is-selected")
    );

    // Show the new tab
    const newTab = this.tabs[tabIndex];
    newTab.header.classList.add(
      this.addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
      this.addon.tab.scratchClass("gui_is-selected")
    );
    newTab.panel.classList.add(
      this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel--selected"),
      this.addon.tab.scratchClass("gui_is-selected")
    );

    this.currentTabIndex = tabIndex;
  }
}
