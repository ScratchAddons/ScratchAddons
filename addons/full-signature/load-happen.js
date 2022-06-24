export default async function getWhatsHappeningData({ addon, console, dataLoaded }) {
  const username = await addon.auth.fetchUsername();
  const xToken = await addon.auth.fetchXToken();
  let fetched = [];
  await fetch(
    `
          https://api.scratch.mit.edu/users/${username}/following/users/activity?limit=40&offset=${
      Math.floor(dataLoaded / 40) * 40
    }`,
    {
      headers: {
        "X-Token": xToken,
      },
    }
  )
    .then((response) => response.json())
    .then((rows) => {
      rows
        .filter((item) => fetched.find((item2) => item2.id === item.id) === undefined)
        .forEach((item) => fetched.push(item));
    });
  return fetched;
}
