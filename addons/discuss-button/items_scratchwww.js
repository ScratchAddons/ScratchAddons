const REACT_ELEMENT = Symbol.for("react.element");

export default async function ({ addon, console }) {
  const createReactElement = (type, props, ...children) => {
    const key = props.key ?? null;
    const ref = props.ref ?? null;
    delete props.key;
    delete props.ref;
    if (type.defaultProps) {
      props = Object.assign({}, type.defaultProps, props);
    }
    if (children.length > 1) props.children = children;
    else if (children.length === 1) props.children = children[0];
    return {
      $$typeof: REACT_ELEMENT,
      type,
      props,
      key,
      ref,
    };
  };

  const navbar = await addon.tab.waitForElement("#navigation > .inner", {
    markAsSeen: true,
    reduxCondition: (state) => {
      if (!state.scratchGui) return true;
      return state.scratchGui.mode.isPlayerOnly;
    },
  });
  let fiberNode = navbar[addon.tab.traps.getInternalKey(navbar)];
  while (!fiberNode.stateNode?.handleSearchSubmit) {
    fiberNode = fiberNode.return;
  }
  const navigationInstance = fiberNode.stateNode;
  const Navigation = navigationInstance.constructor;

  const oldRender = Navigation.prototype.render;
  Navigation.prototype.render = function () {
    if (addon.self.disabled) return oldRender.call(this);

    // The objects returned by oldRender() are immutable in the development version
    // of React, but overriding Object.freeze() allows us to change them. This won't
    // cause problems because React hasn't seen the objects yet at this point.
    const oldFreeze = Object.freeze;
    Object.freeze = () => {};
    const result = oldRender.call(this);
    Object.freeze = oldFreeze;

    const loggedIn = !!this.props.user;
    const list = result.props.children[0];
    if (list.type !== "ul") return result;
    list.props.children = [
      list.props.children[0], // logo

      ...addon.settings.get("items").map(({ name, url, visibility }) => {
        const visible =
          visibility === "always" ||
          (visibility === "loggedIn" && loggedIn) ||
          (visibility === "loggedOut" && !loggedIn);
        if (!visible) return null;

        const absolute = new URL(url, location.origin);
        return createReactElement(
          "li",
          { className: "link" },
          createReactElement(
            "a",
            { href: ["http:", "https:"].includes(absolute.protocol) ? absolute.toString() : "" },
            createReactElement("span", {}, name)
          )
        );
      }),

      ...list.props.children.slice(1).filter(
        // remove original links
        (child) =>
          !(
            child &&
            child.type === "li" &&
            child.props.className.includes("link") &&
            !child.props.className.includes("right")
          )
      ),
    ];
    return result;
  };
  navigationInstance.render = Navigation.prototype.render.bind(navigationInstance);

  const updateItems = () => {
    // force rerender
    addon.tab.redux.dispatch({
      type: "SET_STATUS",
      status: addon.tab.redux.state.session.status,
    });
  };
  updateItems();
  addon.settings.addEventListener("change", updateItems);
  addon.self.addEventListener("disabled", updateItems);
  addon.self.addEventListener("reenabled", updateItems);
}
