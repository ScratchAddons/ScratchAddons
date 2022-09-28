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
