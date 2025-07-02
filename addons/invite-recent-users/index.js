import { addons, storage } from 'scratch-addons';

const DEFAULT_USERNAME = 'griffpatch';
let studioId = null;

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

async function inviteUser(studioId, username) {
  try {
    const csrfToken = getCookie('scratchcsrftoken');
    if (!csrfToken) throw new Error('No CSRF token found');

    const res = await fetch(
      `https://scratch.mit.edu/site-api/users/curators-in/${studioId}/invite_curator/?usernames=${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: null
      }
    );
    if (!res.ok) throw new Error('Invite failed');
    return true;
  } catch (e) {
    console.error('Invite error:', e);
    return false;
  }
}

async function fetchFollowers(username, offset = 0) {
  const url = `https://api.scratch.mit.edu/users/${encodeURIComponent(username)}/followers?limit=40&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch followers failed');
  const data = await res.json();
  return data.map(u => u.username);
}

async function checkUserExists(username) {
  try {
    const res = await fetch(`https://api.scratch.mit.edu/users/${encodeURIComponent(username)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.username;
  } catch {
    return false;
  }
}

function getInvitedUsers(studioId) {
  const data = storage.get(`inviteRecentInvited_${studioId}`);
  return data ? JSON.parse(data) : [];
}

function saveInvitedUser(studioId, username) {
  const invited = getInvitedUsers(studioId);
  if (!invited.includes(username)) {
    invited.push(username);
    storage.set(`inviteRecentInvited_${studioId}`, JSON.stringify(invited));
  }
}

function insertInviteButton() {
  const managersSection = document.querySelector('.studio-managers');
  if (!managersSection) return;
  if (document.getElementById('invite-recent-users-button')) return;

  const btn = document.createElement('button');
  btn.id = 'invite-recent-users-button';
  btn.textContent = 'Invite Recent';
  btn.className = 'button';
  btn.style.marginBottom = '10px';
  btn.style.display = 'block';

  managersSection.parentNode.insertBefore(btn, managersSection);

  btn.addEventListener('click', () => {
    const panel = document.getElementById('invite-recent-users-panel');
    if (panel) panel.remove();
    else showPanel();
  });
}

async function showPanel() {
  if (!studioId) return;

  const panel = document.createElement('div');
  panel.id = 'invite-recent-users-panel';
  panel.style = `
    position: fixed; top: 80px; right: 20px; width: 400px; height: 500px;
    background: white; border: 2px solid #444; padding: 12px; z-index: 9999;
    overflow-y: auto; font-family: Arial, sans-serif; border-radius: 6px;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
  `;

  panel.innerHTML = `
    <button id="close-invite-panel" style="float:right; font-size: 20px; background:none; border:none; cursor:pointer;">×</button>
    <h3>Invite Recent Followers</h3>
    <label for="username-input">Username:</label>
    <input id="username-input" type="text" value="${DEFAULT_USERNAME}" style="width: 100%; padding: 6px; margin-bottom: 10px;">
    <button id="load-followers-btn" class="button" style="margin-bottom: 10px;">Load Followers</button>
    <ul id="followers-list" style="list-style:none; padding-left: 0; max-height: 300px; overflow-y: auto; background: #f0f0f0; border-radius: 4px; margin-bottom: 10px;"></ul>
    <button id="invite-all-btn" class="button">Invite All</button>
    <div id="status-text" style="margin-top: 10px; font-size: 0.9em;"></div>
  `;

  document.body.appendChild(panel);

  panel.querySelector('#close-invite-panel').onclick = () => panel.remove();

  const usernameInput = panel.querySelector('#username-input');
  const loadBtn = panel.querySelector('#load-followers-btn');
  const inviteAllBtn = panel.querySelector('#invite-all-btn');
  const followersList = panel.querySelector('#followers-list');
  const statusText = panel.querySelector('#status-text');

  let offset = 0;
  let followers = [];
  let invitedUsers = getInvitedUsers(studioId);
  let currentUsername = usernameInput.value.trim();

  function updateStatus(text) {
    statusText.textContent = text;
  }

  function renderFollowers() {
    followersList.innerHTML = '';
    followers.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      followersList.appendChild(li);
    });
  }

  async function loadFollowers(reset = false) {
    if (reset) {
      offset = 0;
      followers = [];
      invitedUsers = getInvitedUsers(studioId);
      followersList.innerHTML = '';
    }
    updateStatus('Loading followers...');
    try {
      const newFollowers = await fetchFollowers(currentUsername, offset);
      const filtered = newFollowers.filter(u => !invitedUsers.includes(u));
      if (filtered.length === 0) {
        updateStatus('No new followers found.');
        return;
      }
      followers.push(...filtered);
      offset += newFollowers.length;
      renderFollowers();
      updateStatus(`Loaded ${followers.length} followers.`);
    } catch (err) {
      updateStatus('Failed to load followers.');
      console.error(err);
    }
  }

  async function inviteAllFollowers() {
    if (followers.length === 0) {
      updateStatus('No followers to invite.');
      return;
    }
    inviteAllBtn.disabled = true;
    loadBtn.disabled = true;
    updateStatus(`Inviting ${followers.length} users...`);

    for (const user of followers) {
      updateStatus(`Inviting ${user}...`);
      const success = await inviteUser(studioId, user);
      if (success) {
        saveInvitedUser(studioId, user);
        updateStatus(`✅ Invited ${user}`);
      } else {
        updateStatus(`❌ Failed to invite ${user}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    updateStatus('Invitation process finished.');

    invitedUsers = getInvitedUsers(studioId);
    followers = followers.filter(u => !invitedUsers.includes(u));
    renderFollowers();

    inviteAllBtn.disabled = false;
    loadBtn.disabled = false;
  }

  loadBtn.addEventListener('click', async () => {
    const name = usernameInput.value.trim();
    if (!name) {
      updateStatus('Please enter a username.');
      return;
    }
    updateStatus('Checking username...');
    loadBtn.disabled = true;
    const exists = await checkUserExists(name);
    if (!exists) {
      updateStatus('Username not found.');
      loadBtn.disabled = false;
      return;
    }
    currentUsername = name;
    await loadFollowers(true);
    loadBtn.disabled = false;
  });

  inviteAllBtn.addEventListener('click', inviteAllFollowers);

  loadFollowers(true);
}

addons.register({
  id: 'invite-recent-users',
  name: 'Invite Recent Followers',
  description: 'Adds a button to invite recent followers of a chosen user to your studio, skipping already invited users.',
  options: {},
  load() {
    const urlMatch = /^\/studios\/(\d+)/.exec(location.pathname);
    if (!urlMatch) return;
    studioId = urlMatch[1];
    insertInviteButton();
  }
});
