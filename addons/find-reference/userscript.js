export default async function ({ addon, console }) {
  async function sayHelloToUser() {
    console.log("Hello, " + await addon.auth.fetchUsername());
  }

  await sayHelloToUser();
  console.log("How are you today?");
}
