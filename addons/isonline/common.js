export const isOnline = async (projectId) => {
  let res = await fetch(
    `https://cors.grahamsh.workers.dev/?${encodeURIComponent(
      `https://cdn2.scratch.mit.edu/get_image/project/${projectId}_100x80.png`
    )}`
  );
  let data = await res.text();
  let lastCheckIn = new Date(parseInt(data));
  return Date.now() - lastCheckIn <= 5 * 60 * 1000;
};
export const getProjectId = async (username) => {
  let res = await fetch(`https://api.scratch.mit.edu/users/${username}`, { cache: "no-store" });
  let data = await res.json();
  let { status } = data.profile;
  let projectId = status.split("IO:")[1]?.split(":")[0];
  return projectId;
};
