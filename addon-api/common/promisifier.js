export default function promisify(obj, protectFromSets = true) {
  return new Proxy(obj, {
    get(obj, prop) {
      const original = obj[prop];
      const typeOfOriginal = typeof original;
      if (typeOfOriginal === "object") return new Proxy(original, this);
      else if (typeOfOriginal === "function")
        return function () {
          return promisifyFunction(original, obj, arguments);
        };
      else return original;
    },
    set(obj, prop, value) {
      if (protectFromSets) throw "ScratchAddons exception: an addon tried to set a property in a browser API";
      else obj[prop] = value;
      return true;
    },
  });
}

function promisifyFunction(func, thisArg, args) {
  let resolveWith;
  const promise = new Promise((resolve) => (resolveWith = resolve));
  let returnPromise = false;
  const argsArray = [...args];
  if (typeof argsArray[argsArray.length - 1] !== "function") {
    argsArray.push(function () {
      if (arguments.length === 0) resolveWith(undefined);
      else if (arguments.length === 1) resolveWith(arguments[0]);
      else resolveWith(Array.prototype.slice.call(arguments));
    });
    returnPromise = true;
  }
  // In case the last non-callback argument has to be a function
  // and we want to promisify the call, we can do so by setting
  // the last argument to Symbol.for("promisify")
  if (argsArray[argsArray.length - 2] === Symbol.for("promisify")) {
    argsArray.splice(argsArray.length - 2, 1);
  }
  func.apply(thisArg, argsArray);
  if (returnPromise) return promise;
  else return undefined;
}
