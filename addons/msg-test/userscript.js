export default async function ({ addon, console }) {
  console.log("testing");
  addon.messaging.sendMessage({ req: "getEnabled" }, function (res) {
    console.log(res);
  });
}
