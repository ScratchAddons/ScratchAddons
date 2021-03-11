export default async function ({ addon, console }) {
  addon.storage.set("idddd", "valueneww");
  console.log(addon.storage.get("idddd"));
}
