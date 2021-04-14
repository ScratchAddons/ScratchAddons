export default async function ({ addon, global, console }) {
function inviteToStudio(user) {
  return fetch(`https://scratch.mit.edu/site-api/users/curators-in/27922756/invite_curator/?usernames=${user}`, {
    headers: {
      'x-csrftoken': addon.auth.csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      referer: 'https://scratch.mit.edu',

    },
    body: null,
    method: 'PUT',
  });
}
if (document.getElementById('description').classList.contains('editable')) {
  Array.from(document.getElementsByClassName('comment')).forEach((comment) => {
    const inviteButton = document.createElement('span');
    inviteButton.innerHTML = 'Invite';
    inviteButton.classList.add('actions');
    inviteButton.style.visibility = 'hidden';
    inviteButton.style.color = 'rgb(157, 157, 157)';

    comment.querySelector('.actions-wrap').appendChild(inviteButton);
    comment.addEventListener('mouseover', () => {
      inviteButton.style.visibility = 'visible';
    });
    comment.addEventListener('mouseout', () => {
      inviteButton.style.visibility = 'hidden';
    });
    const listener = inviteButton.addEventListener('click', () => {
      invite(comment.querySelector('.name').textContent.trim()).then((t) => t.text()).then((t) => {
        try {
          const parsed = JSON.parse(t);
          if (parsed.status === 'success') {
            inviteButton.innerHTML = 'Invited!';
          } else if (parsed.message.endsWith('is already a curator of this studio')) {
            inviteButton.innerHTML = 'This user is already a curator';
          } else { throw Error(0); }
        } catch (err) {
          inviteButton.innerHTML = 'Whoops, something went wrong';
        }
        comment.querySelector('.reply').click();
        inviteButton.innerHTML = inviteButton.innerHTML.bold();
        inviteButton.removeEventListener('click', listener);
        inviteButton.classList.remove('actions');
      });
    });
  });
}
}
