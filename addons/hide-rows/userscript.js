export default async function ({ addon, global, console }) {
  // Updates the page if any settings are changed
  addon.settings.addEventListener("change", Change());

  // Main Function
  function Change(argument) {
    // What's Happening
    if (addon.settings.get('whs_ha') === true) {
      document.getElementsByClassName('box')[0].style.display = 'none';
    }

    // Scratch News
    if (addon.settings.get('news') === true) {
      document.getElementsByClassName('box')[1].style.display = 'none';
    }

    // Featured Projects
    if (addon.settings.get('fea_pro') === true) {
      document.getElementsByClassName('box')[2].style.display = 'none';
    }

    // Featured Studios
    if (addon.settings.get('fea_stu') === true) {
      document.getElementsByClassName('box')[3].style.display = 'none';
    }

    // Projects Curated by -
    if (addon.settings.get('pro_cur') === true) {
      document.getElementsByClassName('box')[4].style.display = 'none';
    }

    // Scratch Design Studio -
    if (addon.settings.get('sds') === true) {
      document.getElementsByClassName('box')[5].style.display = 'none';
    }

    // Projects loved by Scratcher I'm following
    if (addon.settings.get('pro_lov') === true) {
      document.getElementsByClassName('box')[6].style.display = 'none';
    }

    // What the Community is remixing
    if (addon.settings.get('com_rem') === true) {
      document.getElementsByClassName('box')[7].style.display = 'none';
    }

    // What the Community is loving
    if (addon.settings.get('com_lov') === true) {
      document.getElementsByClassName('box')[8].style.display = 'none';
    }
  }
}