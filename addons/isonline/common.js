export const isOnline = async (user) => {
  let res = await fetch(`https://isoffline.grahamsh.com/status/${user}`);
  let data = await res.json();
  if (data.statusCode == 404) {
    throw new Error();
  } 
  return data.online;
};
