/**
 * NOTICE: This file is a merged version of various files from the types directory. They were slightly modified so that
 * they may work correctly when they are in the same file.
 *
 * The changes made were limited to:
 *
 * - Removal of excessive `export` declarations.
 * - Removal of `import` declarations.
 * - Renaming of duplicate identifiers between files.
 * - Extra comments to distinguish between what was from which file.
 * - Addition of `declare namespace` declarations to make it work correctly.
 * - Code formatting.
 *
 * The types directory these files were taken from can be found here:
 * https://github.com/vuejs/vue/tree/019d90040d1fd321d09e023b5dbe5d8183688810/types.
 */

/* -------------------- */

// vue.d.ts
export class _Vue {
  constructor(options?: Options.ComponentOptions<_Vue>);

  $data: Object;
  readonly $el: HTMLElement;
  readonly $options: Options.ComponentOptions<this>;
  readonly $parent: _Vue;
  readonly $root: _Vue;
  readonly $children: _Vue[];
  readonly $refs: { [key: string]: _Vue };
  readonly $slots: { [key: string]: VNode.VNode[] };
  readonly $isServer: boolean;

  $mount(elementOrSelector?: Element | String, hydrating?: boolean): this;
  $forceUpdate(): void;
  $destroy(): void;
  $set: typeof _Vue.set;
  $delete: typeof _Vue.delete;
  $watch(expOrFn: string | Function, callback: Options.WatchHandler<this>, options?: Options.WatchOptions): () => void;
  $on(event: string, callback: Function): this;
  $once(event: string, callback: Function): this;
  $off(event?: string, callback?: Function): this;
  $emit(event: string, ...args: any[]): this;
  $nextTick(callback?: (this: this) => void): void;
  $createElement(
    tag?: string | _Vue,
    data?: VNode.VNodeData,
    children?: VNode.VNodeChildren,
    namespace?: string
  ): VNode.VNode;

  static config: {
    silent: boolean;
    optionMergeStrategies: any;
    devtools: boolean;
    errorHandler(err: Error, vm: _Vue): void;
    keyCodes: { [key: string]: number };
  };

  static extend(options: Options.ComponentOptions<_Vue>): typeof _Vue;
  static nextTick(callback: () => void, context?: any[]): void;
  static set<T>(object: Object, key: string, value: T): T;
  static set<T>(array: T[], key: number, value: T): T;
  static delete(object: Object, key: string): void;

  static directive(
    id: string,
    definition?: Options.DirectiveOptions | Options.DirectiveFunction
  ): Options.DirectiveOptions;
  static filter(id: string, definition?: Function): Function;
  static component(
    id: string,
    definition?: Options.ComponentOptions<_Vue> | Options.FunctionalComponentOptions | typeof _Vue
  ): typeof _Vue;

  static use<T>(plugin: Plugin.PluginObject<T> | Plugin.PluginFunction<T>, options?: T): void;
  static mixin(mixin: typeof _Vue | Options.ComponentOptions<_Vue>): void;
  static compile(template: string): {
    render(createElement: typeof _Vue.prototype.$createElement): VNode.VNode;
    staticRenderFns: (() => VNode.VNode)[];
  };
}

/* -------------------- */

// options.d.ts
declare namespace Options {
  type Constructor = {
    new (...args: any[]): any;
  };

  type $createElement = typeof _Vue.prototype.$createElement;

  interface ComponentOptions<V extends _Vue> {
    data?: Object | ((this: V) => Object);
    props?: string[] | { [key: string]: PropOptions | Constructor | Constructor[] };
    propsData?: Object;
    computed?: { [key: string]: ((this: V) => any) | ComputedOptions<V> };
    methods?: { [key: string]: Function };
    watch?: { [key: string]: ({ handler: WatchHandler<V> } & WatchOptions) | WatchHandler<V> | string };

    el?: Element | String;
    template?: string;
    render?(this: V, createElement: $createElement): VNode.VNode;
    staticRenderFns?: ((createElement: $createElement) => VNode.VNode)[];

    beforeCreate?(this: V): void;
    created?(this: V): void;
    beforeDestroy?(this: V): void;
    destroyed?(this: V): void;
    beforeMount?(this: V): void;
    mounted?(this: V): void;
    beforeUpdate?(this: V): void;
    updated?(this: V): void;

    directives?: { [key: string]: DirectiveOptions | DirectiveFunction };
    components?: { [key: string]: ComponentOptions<_Vue> | FunctionalComponentOptions | typeof _Vue };
    transitions?: { [key: string]: Object };
    filters?: { [key: string]: Function };

    parent?: _Vue;
    mixins?: (ComponentOptions<_Vue> | typeof _Vue)[];
    name?: string;
    extends?: ComponentOptions<_Vue> | typeof _Vue;
    delimiters?: [string, string];
  }

  interface FunctionalComponentOptions {
    props?: string[] | { [key: string]: PropOptions | Constructor | Constructor[] };
    functional: boolean;
    render(this: never, createElement: $createElement, context: RenderContext): VNode.VNode;
    name?: string;
  }

  interface RenderContext {
    props: any;
    children: VNode.VNode[];
    slots: any;
    data: VNode.VNodeData;
    parent: _Vue;
  }

  interface PropOptions {
    type?: Constructor | Constructor[] | null;
    required?: boolean;
    default?: any;
    validator?(value: any): boolean;
  }

  interface ComputedOptions<V> {
    get?(this: V): any;
    set?(this: V, value: any): void;
    cache?: boolean;
  }

  type WatchHandler<V> = (this: V, val: any, oldVal: any) => void;

  interface WatchOptions {
    deep?: boolean;
    immediate?: boolean;
  }

  type DirectiveFunction = (
    el: HTMLElement,
    binding: VNode.VNodeDirective,
    vnode: VNode.VNode,
    oldVnode: VNode.VNode
  ) => void;

  interface DirectiveOptions {
    bind?: DirectiveFunction;
    inserted?: DirectiveFunction;
    update?: DirectiveFunction;
    componentUpdated?: DirectiveFunction;
    unbind?: DirectiveFunction;
  }
}

/* -------------------- */

// vnode.d.ts
declare namespace VNode {
  type VNodeChildren = VNodeChildrenArrayContents | string;
  interface VNodeChildrenArrayContents {
    [x: number]: VNode | string | VNodeChildren;
  }

  interface VNode {
    tag?: string;
    data?: VNodeData;
    children?: VNode[];
    text?: string;
    elm?: Node;
    ns?: string;
    context?: _Vue;
    key?: string | number;
    componentOptions?: VNodeComponentOptions;
    child?: _Vue;
    parent?: VNode;
    raw?: boolean;
    isStatic?: boolean;
    isRootInsert: boolean;
    isComment: boolean;
  }

  interface VNodeComponentOptions {
    Ctor: _Vue;
    propsData?: Object;
    listeners?: Object;
    children?: VNodeChildren;
    tag?: string;
  }

  interface VNodeData {
    key?: string | number;
    slot?: string;
    ref?: string;
    tag?: string;
    staticClass?: string;
    class?: any;
    style?: Object[] | Object;
    props?: { [key: string]: any };
    attrs?: { [key: string]: any };
    domProps?: { [key: string]: any };
    hook?: { [key: string]: Function };
    on?: { [key: string]: Function | Function[] };
    nativeOn?: { [key: string]: Function | Function[] };
    transition?: Object;
    show?: boolean;
    inlineTemplate?: {
      render: Function;
      staticRenderFns: Function[];
    };
    directives?: VNodeDirective[];
    keepAlive?: boolean;
  }

  interface VNodeDirective {
    readonly name: string;
    readonly value: any;
    readonly oldValue: any;
    readonly expression: any;
    readonly arg: string;
    readonly modifiers: { [key: string]: boolean };
  }
}

/* -------------------- */

// plugin.d.ts

declare namespace Plugin {
  type PluginFunction<T> = (Vue: typeof _Vue, options?: T) => void;

  interface PluginObject<T> {
    install: PluginFunction<T>;
    [key: string]: any;
  }
}

/* -------------------- */

// index.d.ts

// `Vue` in `export = Vue` must be a namespace
// All available types are exported via this namespace
declare namespace Vue {
  export type ComponentOptions<V extends Vue> = Options.ComponentOptions<V>;
  export type FunctionalComponentOptions = Options.FunctionalComponentOptions;
  export type RenderContext = Options.RenderContext;
  export type PropOptions = Options.PropOptions;
  export type ComputedOptions<V extends Vue> = Options.ComputedOptions<V>;
  export type WatchHandler<V extends Vue> = Options.WatchHandler<V>;
  export type WatchOptions = Options.WatchOptions;
  export type DirectiveFunction = Options.DirectiveFunction;
  export type DirectiveOptions = Options.DirectiveOptions;

  export type PluginFunction<T> = Plugin.PluginFunction<T>;
  export type PluginObject<T> = Plugin.PluginObject<T>;

  export type VNodeChildren = VNode.VNodeChildren;
  export type VNodeChildrenArrayContents = VNode.VNodeChildrenArrayContents;
  export type VNode = VNode.VNode;
  export type VNodeComponentOptions = VNode.VNodeComponentOptions;
  export type VNodeData = VNode.VNodeData;
  export type VNodeDirective = VNode.VNodeDirective;
}

// TS cannot merge imported class with namespace, declare a subclass to bypass
declare class Vue extends _Vue {}

export = Vue;
