export default async function ({
  addon,
  console
}) {
  console.log("style",chrome)
  addon.storage.set("idddd", "valueneww")
  console.log(addon.storage.get("idddd"));
}
