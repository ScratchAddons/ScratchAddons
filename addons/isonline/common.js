export const isOnline = async (user) => {
  let res = await fetch(`https://isoffline.grahamsh.com/isonline/${user}`);
  let data = await res.json();
  if (!data.isUser) {
    throw new Error();
  }
  return data.online;
};
