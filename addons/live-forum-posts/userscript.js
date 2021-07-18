
export default async function ({ addon, global, console, msg }) {
    let sleep = ms => new Promise(r => setTimeout(r, ms))

    let postContainer = document.querySelector('#djangobbindex')
    let posts = [].slice.apply(document.querySelectorAll('.blockpost.roweven.firstpost'))
    if (posts.length === 20) return // Return if no posts are avaliable to be loaded

    window.postIds = posts.map(el => ({ id: el.id.substr(1), el }))

    while (true) {
        await sleep(2000)
        let res = await fetch(location.href)
        
        let html = await res.text()

        let parser = new DOMParser()

        let doc = parser.parseFromString(html, 'text/html')

        let posts = doc.querySelectorAll('.blockpost.roweven.firstpost')

        for (let post of posts) {
            if (postIds.map(e => e.id).indexOf(post.id.substr(1)) !== -1) continue

            postIds[postIds.length - 1].el.insertAdjacentHTML("afterend", post.outerHTML)
            postIds.push({ id: post.id.substr(1), el: document.getElementById(post.id)})
        }
    }
}
