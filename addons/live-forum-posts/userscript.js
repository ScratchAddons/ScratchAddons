export default async function ({ addon, global, console, msg }) {
  var isFetching = false;
  let sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let postContainer = document.querySelector("#djangobbindex");
  let postEls = [].slice.apply(document.querySelectorAll(".blockpost.roweven.firstpost"));
  if (postEls.length === 20) return; // Return if no posts are avaliable to be loaded
  let posts = postEls.map((el) => ({ id: el.id.substr(1), el }));

  if (addon.settings.get('softPosting')) {
    let submitButton = document.querySelector("button[name='AddPostForm']")
    let markItUpEditor = document.getElementById('id_body')
    let errorList = document.querySelector('.error-list')
    if (!errorList) {
      errorList = document.createElement('ul')
      errorList.className = 'error-list'
      errorList.style.display = 'none'
     document.querySelector('#reply form label strong').insertAdjacentElement('afterend', errorList)
    }


    submitButton.addEventListener('click', function clickListener(e) {
      e.preventDefault()
      let data = new FormData()

      data.append("csrfmiddlewaretoken", addon.auth.csrfToken);
      data.append("body", markItUpEditor.value);
      data.append("AddPostForm", "");

      fetch(location.href, {
        method: "POST",
        body: data,
        credentials: "include",
      }).then(async (res) => {
        if (res.url.split("#")[0] !== location.href.split("#")[0]) {
          // We are now on the next page, go to the next page
          location.href = res.url;
        } else {
          let parser = new DOMParser()
          let doc = parser.parseFromString(await res.text(), 'text/html')
          
          let parsedErrorList = doc.querySelector('.error-list')
          if (parsedErrorList) {
            errorList.innerHTML = parsedErrorList.innerHTML
            errorList.style.display = 'block'
          } else {
            errorList.innerHTML = ''
            errorList.style.display = 'none'
          }
          markItUpEditor.value = ''
          await getNewPosts(doc)
        }
      })

    })
    addon.self.addEventListener('disabled', () => submitButton.removeEventListener('click', clickListener))
    addon.self.addEventListener('reenabled', () => submitButton.addEventListener('click', clickListener))
  }

  function addPost(post) {
    posts[posts.length - 1].el.insertAdjacentHTML("afterend", post.outerHTML);
    scratchblocks.renderMatching(`#${post.id} pre.blocks`, { style: "scratch2" });
    posts.push({ id: post.id.substr(1), el: document.getElementById(post.id) });
  }

  async function getNewPosts(prefetched) {
    isFetching = true
    let doc = prefetched ? prefetched : (new DOMParser()).parseFromString(await fetch(location.href).then(r => r.text()), 'text/html');


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

      addPost(post);
    }
    if (gotPosts.length == 20) {
      // Update pagination divs
      let paginated = doc.querySelector(".pagination").innerHTML;

      document.querySelectorAll(".paginated").forEach((e) => (e.innerHTML = paginated));
    }

    isFetching = false;
  }
  
  async function main() {
    while (true) {
      if (addon.self.disabled) break
  
      await sleep(addon.settings.get("waitTime") * 1000);
      await getNewPosts()
    }
  }

  main()

  addon.self.addEventListener('reenabled', main)
}