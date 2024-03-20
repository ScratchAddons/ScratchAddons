export default async function ({ addon, console }) {
  const profileImg = await addon.tab.waitForElement('#profile-avatar .avatar img');
  const userid = profileImg.getAttribute('src').match(/user\/(\d+|default)_60x60.png/)[1];
  (await addon.tab.waitForElement('#profile-avatar .avatar a'))
    .setAttribute('href', `//uploads.scratch.mit.edu/get_image/user/${userid}_500x500.png`)
}
