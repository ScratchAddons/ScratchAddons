addons.register('invite-recent-users', {
  init() {
    const studioId = location.pathname.split('/')[2];
    if (!studioId) return;

    const buttonId = 'scratch-invite-recent-btn';
    const modalId = 'scratch-invite-modal';
    const PAGE_SIZE = 20;

    const sources = {
      'griffpatch-followers': {
        label: 'Griffpatch Followers',
        loader: fetchAllFollowersPaged.bind(null, 'griffpatch'),
      },
      'scratchcat-followers': {
        label: 'ScratchCat Followers',
        loader: fetchAllFollowersPaged.bind(null, 'ScratchCat'),
      },
      'griffpatch-commenters': {
        label: 'Recent Commenters on Griffpatch',
        loader: fetchCommentersOfUserPaged.bind(null, 'griffpatch'),
      }
    };

    let currentUsers = [];
    let loadedCount = 0;
    let loaderFunction = null;

    function createListItem(username) {
      const li = document.createElement('li');
      li.textContent = username;
      return li;
    }

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function inviteUser(username) {
      const csrfToken = (document.cookie.match(/scratchcsrftoken=([^;]+)/) || [])[1];
      if (!csrfToken) {
        console.warn('No CSRF token found');
        return false;
      }
      try {
        const res = await fetch(`/site-api/users/curators-in/${studioId}/invite_curator/?usernames=${username}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json'
          },
          body: '{}'
        });
        return res.ok;
      } catch {
        return false;
      }
    }

    async function inviteUsersSequentially(users, listEl) {
      for (const user of users) {
        // Show inviting status
        const li = [...listEl.children].find(li => li.textContent.includes(user));
        if (li) {
          li.style.color = 'blue';
          li.textContent = `${user} - inviting...`;
        }

        const success = await inviteUser(user);

        if (li) {
          li.style.color = success ? 'green' : 'red';
          li.textContent = success ? `${user} - invited` : `${user} - error`;
        }

        await delay(400);
      }
      alert('Invitation process finished.');
    }

    async function fetchAllFollowersPaged(username, offset = 0, limit = PAGE_SIZE) {
      try {
        const url = `https://api.scratch.mit.edu/users/${username}/followers/?limit=${limit}&offset=${offset}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return data.map(u => u.username);
      } catch {
        return [];
      }
    }

    async function fetchCommentersOfUserPaged(username, offset = 0, limit = PAGE_SIZE) {
      try {
        const url = `https://api.scratch.mit.edu/users/${username}/comments/?limit=${limit}&offset=${offset}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const comments = await res.json();
        const commenters = [...new Set(comments.map(c => c.author.username))];
        return commenters;
      } catch {
        return [];
      }
    }

    function showPanel() {
      if (document.getElementById(modalId)) return;

      currentUsers = [];
      loadedCount = 0;

      const modal = document.createElement('div');
      modal.id = modalId;
      Object.assign(modal.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '400px',
        height: '480px',
        backgroundColor: '#fff',
        border: '2px solid #333',
        padding: '15px',
        zIndex: 10000,
        overflowY: 'auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      });

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = 'position:absolute; top:5px; right:5px;';
      closeBtn.onclick = () => modal.remove();
      modal.appendChild(closeBtn);

      const title = document.createElement('h3');
      title.textContent = 'Invite users to studio';
      modal.appendChild(title);

      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.marginBottom = '10px';
      for (const [key, { label }] of Object.entries(sources)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = label;
        select.appendChild(opt);
      }
      modal.appendChild(select);

      const list = document.createElement('ul');
      list.style.flexGrow = '1';
      list.style.overflowY = 'auto';
      list.style.paddingLeft = '20px';
      modal.appendChild(list);

      const btnsDiv = document.createElement('div');
      btnsDiv.style.marginTop = '10px';
      modal.appendChild(btnsDiv);

      const loadMoreBtn = document.createElement('button');
      loadMoreBtn.textContent = 'Load more';
      loadMoreBtn.disabled = true;
      loadMoreBtn.style.marginRight = '10px';
      btnsDiv.appendChild(loadMoreBtn);

      const inviteAllBtn = document.createElement('button');
      inviteAllBtn.textContent = 'Invite all';
      inviteAllBtn.disabled = true;
      btnsDiv.appendChild(inviteAllBtn);

      document.body.appendChild(modal);

      select.onchange = async () => {
        currentUsers = [];
        loadedCount = 0;
        list.innerHTML = '';
        loadMoreBtn.disabled = true;
        inviteAllBtn.disabled = true;
        loaderFunction = sources[select.value].loader;
        if (!loaderFunction) return;
        await loadNextPage();
      };

      async function loadNextPage() {
        loadMoreBtn.disabled = true;
        const nextUsers = await loaderFunction(loadedCount, PAGE_SIZE);
        if (nextUsers.length === 0 && loadedCount === 0) {
          list.innerHTML = '<li>No users found.</li>';
          inviteAllBtn.disabled = true;
          return;
        }
        nextUsers.forEach(u => {
          if (!currentUsers.includes(u)) {
            currentUsers.push(u);
            list.appendChild(createListItem(u));
          }
        });
        loadedCount = currentUsers.length;

        loadMoreBtn.disabled = nextUsers.length === 0;
        inviteAllBtn.disabled = currentUsers.length === 0;
      }

      loadMoreBtn.onclick = loadNextPage;

      inviteAllBtn.onclick = async () => {
        inviteAllBtn.disabled = true;
        loadMoreBtn.disabled = true;
        await inviteUsersSequentially(currentUsers, list);
        inviteAllBtn.disabled = false;
        loadMoreBtn.disabled = false;
      };

      select.dispatchEvent(new Event('change'));
    }

    const interval = setInterval(() => {
      const refButton = document.querySelector('#sa-studio-followers-button');
      if (!refButton) return;
      clearInterval(interval);

      const btn = document.createElement('button');
      btn.id = buttonId;
      btn.className = 'button';
      btn.textContent = 'Invite Recent';
      btn.style.marginLeft = '10px';
      btn.onclick = showPanel;

      refButton.parentNode.insertBefore(btn, refButton.nextSibling);
    }, 500);

  }
});
