const checkIn = async (username) => {
  let res = await fetch(`https://isoffline.grahamsh.com/ping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
    }),
  });
};
export default async function ({ addon, global, console, msg }) {
  let isLoggedIn = await addon.auth.fetchIsLoggedIn();
  if (!isLoggedIn) return;

  let username = await addon.auth.fetchUsername();

  await checkIn(username);
  setInterval(() => checkIn(username), 1000 * 60 * 5);
}
