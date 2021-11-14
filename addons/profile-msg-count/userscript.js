export default async function ({ addon, console, msg }) {
  const profileDetailsBottom = document.createElement('div');
  const msgCount = document.createElement('span');
  const profileDetails = document.querySelector('.profile-details');
  const locationElement = document.querySelector('.header-text .profile-details .location');
  profileDetails.appendChild(profileDetailsBottom);
  profileDetailsBottom.appendChild(msgCount);
  profileDetailsBottom.insertBefore(locationElement, msgCount);
  locationElement.style.display = 'inline';
  profileDetailsBottom.style.display = 'flex';
  profileDetailsBottom.style.justifyContent = 'space-between';

  fetch(`https://api.scratch.mit.edu/users/${window.location.pathname.split('/')[2]}/messages/count`)
    .then(res => res.json())
    .then(res => res.count)
    .then(unreadMsgCount => {
      msgCount.textContent = `${msg('unread-messages')}: ${unreadMsgCount}`;
    });
}