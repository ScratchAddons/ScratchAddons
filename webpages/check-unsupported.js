import checkIfUnsupported, { url } from "../background/handle-unsupported-version";

if (checkIfUnsupported()) {
  window.parent.location.href = url;
  window.location.href = url;
}
