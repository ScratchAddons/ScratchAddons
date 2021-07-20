export default async function ({ addon, global, console, msg }) {
  var isFetching = false
  let sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let postContainer = document.querySelector("#djangobbindex");
  let postEls = [].slice.apply(document.querySelectorAll(".blockpost.roweven.firstpost"));
  if (postEls.length === 20) return; // Return if no posts are avaliable to be loaded
  let posts = postEls.map((el) => ({ id: el.id.substr(1), el }));

  if (addon.settings.get('softPosting')) {
    let submitButton = document.querySelector("button[name='AddPostForm']")
    let markItUpEditor = document.getElementById('id_body')
    submitButton.addEventListener('click', (e) => {
      e.preventDefault()
      let data = new FormData()

      data.append('csrfmiddlewaretoken', addon.auth.csrfToken)
      data.append('body', markItUpEditor.value)
      data.append('AddPostForm', '')

      fetch(location.href, {
        method: 'POST',
        body: data,
        credentials: 'include'
      }).then(async res => {
        if (res.url.split('#')[0] !== location.href.split('#')[0]) {
          // We are now on the next page, go to the next page
          console.log(res.url, location.href, res.url == location.href)
        } else {
          // TODO: handle 60 second waits
          markItUpEditor.value = ''
          await getNewPosts(await res.text())
        }
      })
    })
  }

  function addPost(post) {
    posts[posts.length - 1].el.insertAdjacentHTML("afterend", post.outerHTML);
    scratchblocks.renderMatching(`#${post.id} pre.blocks`, { style: "scratch2" });
    posts.push({ id: post.id.substr(1), el: document.getElementById(post.id) });
  }

  async function getNewPosts(prefetched) {
    isFetching = true
    let html = prefetched ? prefetched : await fetch(location.href).then(r => r.text());

    let parser = new DOMParser();

    let doc = parser.parseFromString(html, "text/html");

    let gotPosts = doc.querySelectorAll(".blockpost.roweven.firstpost");

    for (let post of gotPosts) {
      let postIds = posts.map((e) => e.id);
      if (postIds.indexOf(post.id.substr(1)) !== -1) {
        // Lets check if the post has been edited
        let renderedPost = posts[postIds.indexOf(post.id.substr(1))].el;
        let renderedPostMsg = renderedPost.querySelector(".postmsg");
        let parsedPostMsg = post.querySelector(".postmsg");
        if (renderedPostMsg.innerHTML !== parsedPostMsg.innerHTML) {
          if (addon.settings.get("signature")) {
            renderedPostMsg.innerHTML = parsedPostMsg.innerHTML;
          } else {
            renderedPostMsg.childNodes[0].innerHTML = parsedPostMsg.childNodes[0].innerHTML;
            if (!renderedPostMsg.childNodes[1].className.includes("postedit")) {
              renderedPostMsg.childNodes[0].insertAdjacentHTML("afterend", parsedPostMsg.childNodes[1].outerHTML);
            } else renderedPostMsg.childNodes[1].innerHTML = parsedPostMsg.childNodes[1].innerHTML;
          }
          scratchblocks.renderMatching(`#p${renderedPost.id.substr(1)} pre.blocks`, { style: "scratch2" });
        }
        continue;
      }

      addPost(post)
    }
    if (gotPosts.length == 20) {
      // Update pagination divs
      let paginated = doc.querySelector(".pagination");

      document.querySelectorAll(".paginated").forEach(e => (e.innerHTML = paginated))
    }

    isFetching = false
  }
  while (true) {
    await sleep(addon.settings.get("waitTime") * 1000);
    await getNewPosts()
  }
}
