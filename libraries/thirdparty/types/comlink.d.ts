/**
 * NOTICE: This file is a merged version of comlink.d.ts and protocol.d.ts. They were slightly modified so that they may
 * work correctly when they are in the same file.
 *
 * The changes made were limited to:
 *
 * - Removal of excessive `export` declarations from protocol.d.ts.
 * - Removal of `import` declarations from comlink.d.ts.
 * - Extra comments to distinguish between what was from which file.
 *
 * The original comlink.d.ts can be found here: https://cdn.jsdelivr.net/npm/comlink@4.3.1/dist/umd/comlink.d.ts.
 *
 * The original protocol.d.ts can be found here: https://cdn.jsdelivr.net/npm/comlink@4.3.1/dist/umd/protocol.d.ts.
 */

/* -------------------- */

// protocol.d.ts
/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
interface EventSource {
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: {}): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: {}): void;
}
interface PostMessageWithOrigin {
  postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void;
}
export interface Endpoint extends EventSource {
  postMessage(message: any, transfer?: Transferable[]): void;
  start?: () => void;
}
declare const enum WireValueType {
  RAW = "RAW",
  PROXY = "PROXY",
  THROW = "THROW",
  HANDLER = "HANDLER"
}
interface RawWireValue {
  id?: string;
  type: WireValueType.RAW;
  value: {};
}
interface HandlerWireValue {
  id?: string;
  type: WireValueType.HANDLER;
  name: string;
  value: unknown;
}
declare type WireValue = RawWireValue | HandlerWireValue;
declare type MessageID = string;
declare const enum MessageType {
  GET = "GET",
  SET = "SET",
  APPLY = "APPLY",
  CONSTRUCT = "CONSTRUCT",
  ENDPOINT = "ENDPOINT",
  RELEASE = "RELEASE"
}
interface GetMessage {
  id?: MessageID;
  type: MessageType.GET;
  path: string[];
}
interface SetMessage {
  id?: MessageID;
  type: MessageType.SET;
  path: string[];
  value: WireValue;
}
interface ApplyMessage {
  id?: MessageID;
  type: MessageType.APPLY;
  path: string[];
  argumentList: WireValue[];
}
interface ConstructMessage {
  id?: MessageID;
  type: MessageType.CONSTRUCT;
  path: string[];
  argumentList: WireValue[];
}
interface EndpointMessage {
  id?: MessageID;
  type: MessageType.ENDPOINT;
}
interface ReleaseMessage {
  id?: MessageID;
  type: MessageType.RELEASE;
  path: string[];
}
declare type Message = GetMessage | SetMessage | ApplyMessage | ConstructMessage | EndpointMessage | ReleaseMessage;

/* -------------------- */

// comlink.d.ts
/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 export declare const proxyMarker: unique symbol;
 export declare const createEndpoint: unique symbol;
 export declare const releaseProxy: unique symbol;
 /**
  * Interface of values that were marked to be proxied with `comlink.proxy()`.
  * Can also be implemented by classes.
  */
 export interface ProxyMarked {
     [proxyMarker]: true;
 }
 /**
  * Takes a type and wraps it in a Promise, if it not already is one.
  * This is to avoid `Promise<Promise<T>>`.
  *
  * This is the inverse of `Unpromisify<T>`.
  */
 declare type Promisify<T> = T extends Promise<unknown> ? T : Promise<T>;
 /**
  * Takes a type that may be Promise and unwraps the Promise type.
  * If `P` is not a Promise, it returns `P`.
  *
  * This is the inverse of `Promisify<T>`.
  */
 declare type Unpromisify<P> = P extends Promise<infer T> ? T : P;
 /**
  * Takes the raw type of a remote property and returns the type that is visible to the local thread on the proxy.
  *
  * Note: This needs to be its own type alias, otherwise it will not distribute over unions.
  * See https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
  */
 declare type RemoteProperty<T> = T extends Function | ProxyMarked ? Remote<T> : Promisify<T>;
 /**
  * Takes the raw type of a property as a remote thread would see it through a proxy (e.g. when passed in as a function
  * argument) and returns the type that the local thread has to supply.
  *
  * This is the inverse of `RemoteProperty<T>`.
  *
  * Note: This needs to be its own type alias, otherwise it will not distribute over unions. See
  * https://www.typescriptlang.org/docs/handbook/advanced-types.html#distributive-conditional-types
  */
 declare type LocalProperty<T> = T extends Function | ProxyMarked ? Local<T> : Unpromisify<T>;
 /**
  * Proxies `T` if it is a `ProxyMarked`, clones it otherwise (as handled by structured cloning and transfer handlers).
  */
 export declare type ProxyOrClone<T> = T extends ProxyMarked ? Remote<T> : T;
 /**
  * Inverse of `ProxyOrClone<T>`.
  */
 export declare type UnproxyOrClone<T> = T extends RemoteObject<ProxyMarked> ? Local<T> : T;
 /**
  * Takes the raw type of a remote object in the other thread and returns the type as it is visible to the local thread
  * when proxied with `Comlink.proxy()`.
  *
  * This does not handle call signatures, which is handled by the more general `Remote<T>` type.
  *
  * @template T The raw type of a remote object as seen in the other thread.
  */
 export declare type RemoteObject<T> = {
     [P in keyof T]: RemoteProperty<T[P]>;
 };
 /**
  * Takes the type of an object as a remote thread would see it through a proxy (e.g. when passed in as a function
  * argument) and returns the type that the local thread has to supply.
  *
  * This does not handle call signatures, which is handled by the more general `Local<T>` type.
  *
  * This is the inverse of `RemoteObject<T>`.
  *
  * @template T The type of a proxied object.
  */
 export declare type LocalObject<T> = {
     [P in keyof T]: LocalProperty<T[P]>;
 };
 /**
  * Additional special comlink methods available on each proxy returned by `Comlink.wrap()`.
  */
 export interface ProxyMethods {
     [createEndpoint]: () => Promise<MessagePort>;
     [releaseProxy]: () => void;
 }
 /**
  * Takes the raw type of a remote object, function or class in the other thread and returns the type as it is visible to
  * the local thread from the proxy return value of `Comlink.wrap()` or `Comlink.proxy()`.
  */
 export declare type Remote<T> = RemoteObject<T> & (T extends (...args: infer TArguments) => infer TReturn ? (...args: {
     [I in keyof TArguments]: UnproxyOrClone<TArguments[I]>;
 }) => Promisify<ProxyOrClone<Unpromisify<TReturn>>> : unknown) & (T extends {
     new (...args: infer TArguments): infer TInstance;
 } ? {
     new (...args: {
         [I in keyof TArguments]: UnproxyOrClone<TArguments[I]>;
     }): Promisify<Remote<TInstance>>;
 } : unknown) & ProxyMethods;
 /**
  * Expresses that a type can be either a sync or async.
  */
 declare type MaybePromise<T> = Promise<T> | T;
 /**
  * Takes the raw type of a remote object, function or class as a remote thread would see it through a proxy (e.g. when
  * passed in as a function argument) and returns the type the local thread has to supply.
  *
  * This is the inverse of `Remote<T>`. It takes a `Remote<T>` and returns its original input `T`.
  */
 export declare type Local<T> = Omit<LocalObject<T>, keyof ProxyMethods> & (T extends (...args: infer TArguments) => infer TReturn ? (...args: {
     [I in keyof TArguments]: ProxyOrClone<TArguments[I]>;
 }) => MaybePromise<UnproxyOrClone<Unpromisify<TReturn>>> : unknown) & (T extends {
     new (...args: infer TArguments): infer TInstance;
 } ? {
     new (...args: {
         [I in keyof TArguments]: ProxyOrClone<TArguments[I]>;
     }): MaybePromise<Local<Unpromisify<TInstance>>>;
 } : unknown);
 /**
  * Customizes the serialization of certain values as determined by `canHandle()`.
  *
  * @template T The input type being handled by this transfer handler.
  * @template S The serialized type sent over the wire.
  */
 export interface TransferHandler<T, S> {
     /**
      * Gets called for every value to determine whether this transfer handler
      * should serialize the value, which includes checking that it is of the right
      * type (but can perform checks beyond that as well).
      */
     canHandle(value: unknown): value is T;
     /**
      * Gets called with the value if `canHandle()` returned `true` to produce a
      * value that can be sent in a message, consisting of structured-cloneable
      * values and/or transferrable objects.
      */
     serialize(value: T): [S, Transferable[]];
     /**
      * Gets called to deserialize an incoming value that was serialized in the
      * other thread with this transfer handler (known through the name it was
      * registered under).
      */
     deserialize(value: S): T;
 }
 /**
  * Allows customizing the serialization of certain values.
  */
 export declare const transferHandlers: Map<string, TransferHandler<unknown, unknown>>;
 export declare function expose(obj: any, ep?: Endpoint): void;
 export declare function wrap<T>(ep: Endpoint, target?: any): Remote<T>;
 export declare function transfer<T>(obj: T, transfers: Transferable[]): T;
 export declare function proxy<T>(obj: T): T & ProxyMarked;
 export declare function windowEndpoint(w: PostMessageWithOrigin, context?: EventSource, targetOrigin?: string): Endpoint;
