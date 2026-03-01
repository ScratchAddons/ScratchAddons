/**
 * Tab管理工具类
 * 用于创建和管理Modal中的Tabs
 */
export class TabManager {
  constructor(addon, content, containerClassName = "") {
    this.addon = addon;
    this.tabs = [];
    this.currentTabIndex = 0;

    // 初始化容器
    this.#initTabsContainer(content, containerClassName);
  }

  /**
   * 初始化Tab容器和标题栏 (私有方法)
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
   * 创建一个新的Tab
   * @param {string} tabName - tab的显示名称
   * @param {string} tabId - tab的唯一标识符
   * @param {HTMLElement} panelContent - tab面板的内容元素
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

    // 直接追加到DOM
    this.tabsHeader.append(tabHeader);
    this.tabsContainer.append(tabPanel);

    // 添加点击事件处理
    const tabIndex = this.tabs.length - 1;
    tabHeader.addEventListener("click", () => this.switchTab(tabIndex));
  }

  /**
   * 切换到指定的Tab
   * @param {string|number} tabIdOrIndex - tab的唯一标识符或索引
   */
  switchTab(tabIdOrIndex) {
    let tabIndex;

    // 支持通过ID或索引切换
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

    // 隐藏当前tab
    const currentTab = this.tabs[this.currentTabIndex];
    currentTab.header.classList.remove(
      this.addon.tab.scratchClass("react-tabs_react-tabs__tab--selected"),
      this.addon.tab.scratchClass("gui_is-selected")
    );
    currentTab.panel.classList.remove(
      this.addon.tab.scratchClass("react-tabs_react-tabs__tab-panel--selected"),
      this.addon.tab.scratchClass("gui_is-selected")
    );

    // 显示新的tab
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
