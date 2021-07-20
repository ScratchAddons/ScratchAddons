export default async function ({ addon, global, console, msg }) {
  let sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  let postContainer = document.querySelector("#djangobbindex");
  let postEls = [].slice.apply(document.querySelectorAll(".blockpost.roweven.firstpost"));
  if (postEls.length === 20) return; // Return if no posts are avaliable to be loaded
  let posts = postEls.map((el) => ({ id: el.id.substr(1), el }));

  while (true) {
    await sleep(addon.settings.get('waitTime') * 1000);
    let res = await fetch(location.href);

    let html = await res.text();

    let parser = new DOMParser();

    let doc = parser.parseFromString(html, "text/html");

    let gotPosts = doc.querySelectorAll(".blockpost.roweven.firstpost");

    for (let post of gotPosts) {
      let postIds = posts.map((e) => e.id)
      if (postIds.indexOf(post.id.substr(1)) !== -1) {
        // Lets check if the post has been edited
        let renderedPost = posts[postIds.indexOf(post.id.substr(1))].el;
        let renderedPostMsg = renderedPost.querySelector('.postmsg')
        let parsedPostMsg = post.querySelector('.postmsg')
        if (renderedPostMsg.innerHTML !== parsedPostMsg.innerHTML) {
          if (addon.settings.get('signature')) {
            renderedPostMsg.innerHTML = parsedPostMsg.innerHTML
          } else {
            renderedPostMsg.childNodes[0].innerHTML = parsedPostMsg.childNodes[0].innerHTML;
            if (!renderedPostMsg.childNodes[1].className.includes('postedit')) {
              renderedPostMsg.childNodes[0].insertAdjacentHTML("afterend", parsedPostMsg.childNodes[1].outerHTML)
            } else renderedPostMsg.childNodes[1].innerHTML = parsedPostMsg.childNodes[1].innerHTML
          }
          scratchblocks.renderMatching(`#p${renderedPost.id.substr(1)} pre.blocks`, { style: 'scratch2' })
        }
        continue
      };

      posts[posts.length - 1].el.insertAdjacentHTML("afterend", post.outerHTML);
      scratchblocks.renderMatching(`#${post.id} pre.blocks`, { style: 'scratch2' })
      posts.push({ id: post.id.substr(1), el: document.getElementById(post.id) });
    }
    if (gotPosts.length == 20) {
      // Update pagination divs
      let paginated = doc.querySelector('.pagination')

      document.querySelectorAll('.paginated').innerHTML = paginated
    }
  }
}
