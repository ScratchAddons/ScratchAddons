export const isOnline = async (user) => {
  let res = await fetch(`https://isoffline.grahamsh.com/status/${user}`);
  let data = await res.json();
  return data.online;
};
