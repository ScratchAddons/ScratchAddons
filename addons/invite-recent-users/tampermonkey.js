# No se que archivos ni que contenido tiene que tener el addon, asi que os dejo un codigo de Tampermonkey, haber si alguien puedeayudarme (@VIGARPAST_777 en Scratch)
// ==UserScript==
// @name         Invite Recent Users (Auto-load all followers in batches)
// @version      1.7.0
// @description  Automatically load and invite all followers of any user in batches of 40 with status colors
// @match        https://scratch.mit.edu/studios/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const studioId = location.pathname.split('/')[2];
  if (!studioId) return;

  const STORAGE_KEY = `invite_recent_users_invited_${studioId}`;

  function getInvitedUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  function saveInvitedUser(username, success) {
    const invited = getInvitedUsers();
    invited[username] = success;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invited));
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function waitForElement(selector, timeout = 7000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const elNow = document.querySelector(selector);
        if (elNow) {
          observer.disconnect();
          resolve(elNow);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      if (timeout) setTimeout(() => {
        observer.disconnect();
        reject(new Error('Timeout waiting for element ' + selector));
      }, timeout);
    });
  }

  waitForElement('#sa-studio-followers-button').then(refButton => {
    const btn = document.createElement('button');
    btn.id = 'scratch-invite-recent-btn';
    btn.className = 'button';
    btn.textContent = 'Invite Recent';
    btn.style.marginLeft = '10px';
    btn.onclick = () => {
      if (document.querySelector('#scratch-invite-modal')) {
        document.querySelector('#scratch-invite-modal').remove();
      } else {
        showPanel();
      }
    };
    refButton.parentNode.insertBefore(btn, refButton.nextSibling);
  }).catch(console.warn);

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

  async function fetchUsers(username, offset) {
    const url = `https://api.scratch.mit.edu/users/${encodeURIComponent(username)}/followers?limit=40&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Fetch failed');
    const data = await res.json();
    return data.map(u => u.username);
  }

  async function inviteUser(username) {
    try {
      const csrfToken = getCookie('scratchcsrftoken');
      if (!csrfToken) throw new Error('No CSRF token found');

      const res = await fetch(
        `https://scratch.mit.edu/site-api/studios/${studioId}/curators/invite/`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'X-CSRFToken': csrfToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({ usernames: [username] })
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error(`Invite failed for ${username}. Status: ${res.status}`, text);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Invite error:', e);
      return false;
    }
  }

  function createUserListItem(username, status = 'pending') {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '4px';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = username;

    const statusSpan = document.createElement('span');
    statusSpan.style.minWidth = '80px';
    statusSpan.style.textAlign = 'right';
    statusSpan.style.fontWeight = 'bold';

    updateStatusSpan(statusSpan, status);

    li.appendChild(nameSpan);
    li.appendChild(statusSpan);

    return { li, statusSpan };
  }

  function updateStatusSpan(statusSpan, status) {
    switch (status) {
      case 'success':
        statusSpan.textContent = '✅ Invited';
        statusSpan.style.color = '#28a745';
        break;
      case 'fail':
        statusSpan.textContent = '❌ Failed';
        statusSpan.style.color = '#dc3545';
        break;
      case 'pending':
      default:
        statusSpan.textContent = '⚪ Pending';
        statusSpan.style.color = '#6c757d';
        break;
    }
  }

  async function showPanel() {
    const modal = document.createElement('div');
    modal.id = 'scratch-invite-modal';
    modal.style = `
      position: fixed; top: 20px; right: 20px; width: 420px; height: 540px;
      background: white; border: 2px solid #333; padding: 15px;
      z-index: 10000; overflow-y: auto; font-family: Arial,sans-serif;
      display: flex; flex-direction: column; border-radius: 5px;
      box-shadow: 0 0 15px rgba(0,0,0,0.3);
    `;

    modal.innerHTML = `
      <button title="Close" style="position:absolute;top:5px;right:5px; font-size: 18px; background:none; border:none; cursor:pointer;">×</button>
      <h3>Invite Recent Users (Auto-batch)</h3>
      <label for="username-input" style="margin-top:10px;">Username to fetch followers:</label>
      <input id="username-input" type="text" value="griffpatch" style="width:100%; padding:6px; margin-bottom:10px;"/>
      <button id="load-user-btn" style="margin-bottom:10px;">Load Followers</button>
      <ul id="user-list" style="flex-grow:1; overflow-y:auto; border:1px solid #ccc; padding-left:20px; background:#fafafa; border-radius:3px; min-height: 200px;"></ul>
      <button id="invite-all-btn" style="margin-top:10px;">Invite All</button>
      <div id="status" style="margin-top:10px; font-size:0.9rem; color:#333; min-height: 24px;"></div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('button[title="Close"]').onclick = () => modal.remove();

    const userInput = modal.querySelector('#username-input');
    const loadUserBtn = modal.querySelector('#load-user-btn');
    const userListEl = modal.querySelector('#user-list');
    const inviteAllBtn = modal.querySelector('#invite-all-btn');
    const statusEl = modal.querySelector('#status');

    let offset = 0;
    let currentUsers = [];
    let currentUsername = userInput.value.trim();
    let invitedUsers = getInvitedUsers();
    let stopLoading = false;

    function updateStatus(msg) {
      statusEl.textContent = msg;
    }

    async function loadAllUsers(reset = false) {
      if (reset) {
        offset = 0;
        currentUsers = [];
        invitedUsers = getInvitedUsers();
        userListEl.innerHTML = '';
        stopLoading = false;
      }

      loadUserBtn.disabled = true;
      updateStatus('Loading all followers in batches...');

      while (!stopLoading) {
        try {
          const batch = await fetchUsers(currentUsername, offset);
          if (batch.length === 0) break;

          const filtered = batch.filter(u => !(u in invitedUsers));
          currentUsers.push(...filtered);

          for (const user of filtered) {
            const { li } = createUserListItem(user, 'pending');
            userListEl.appendChild(li);
          }

          offset += 40;
          updateStatus(`Loaded ${currentUsers.length} new users...`);
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          updateStatus('Failed to fetch more users.');
          break;
        }
      }

      updateStatus(`Finished loading ${currentUsers.length} new followers`);
      loadUserBtn.disabled = false;
    }

    async function inviteAll() {
      if (currentUsers.length === 0) {
        updateStatus('No users to invite.');
        return;
      }
      inviteAllBtn.disabled = true;
      loadUserBtn.disabled = true;

      const userItems = {};
      for (const li of userListEl.children) {
        const username = li.firstChild.textContent;
        userItems[username] = li.children[1];
      }

      for (const user of currentUsers) {
        updateStatus(`Inviting ${user}...`);
        const success = await inviteUser(user);
        saveInvitedUser(user, success);

        if (userItems[user]) {
          updateStatusSpan(userItems[user], success ? 'success' : 'fail');
        }

        await new Promise(r => setTimeout(r, 1000));
      }

      updateStatus('All invitations complete!');
      currentUsers = [];
      inviteAllBtn.disabled = false;
      loadUserBtn.disabled = false;
    }

    loadUserBtn.onclick = async () => {
      const inputUser = userInput.value.trim();
      if (!inputUser) {
        updateStatus('Please enter a username.');
        return;
      }
      updateStatus('Checking user...');
      loadUserBtn.disabled = true;
      const exists = await checkUserExists(inputUser);
      if (!exists) {
        updateStatus('User not found.');
        loadUserBtn.disabled = false;
        return;
      }
      currentUsername = inputUser;
      await loadAllUsers(true);
    };

    inviteAllBtn.onclick = inviteAll;

    await loadAllUsers(true);
  }

})();
