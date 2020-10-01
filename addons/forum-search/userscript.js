let isCurrentlyProcessing = false
let currentPage = 0
let hits = 10000 // elastic default
let currentQuery;
function cleanPost(post) { // Thanks Jeffalo
    const dom = new DOMParser()
    const readableDom = dom.parseFromString(post, "text/html")

    const codeSegments = readableDom.querySelectorAll("pre")

    for (const segment of codeSegments) {
        segment.innerHTML = segment.innerHTML.replace(/<br>/g, "\n")
        segment.innerHTML = segment.innerHTML.replace(/</g, "&lt;")
    }

    return readableDom.documentElement.innerHTML
}

function appendSearch(box, query, page, term) {
    if (page*50 > hits) return 0
    isCurrentlyProcessing = true
    let loading = document.createTextNode("Loading...")
    currentPage = page
    box.appendChild(loading);
    window.fetch(`https://scratchdb.lefty.one/v2/forum/search?q=${encodeURIComponent(query)}&page=${page}&o=${term}`)
    .catch((err) => {
        box.removeChild(box.lastChild)
        box.appendChild(document.createTextNode("Error loading from ScratchDB!"))
    })
    .then((res) => res.json())
    .then((data) => {
        hits = data.hits
        console.log(data);
        box.removeChild(box.lastChild)
        for (let post of data.posts) {
            // the post
            let postElem = document.createElement("div")
            postElem.classList = 'blockpost roweven firstpost'

            // the post box
            let postBox = document.createElement('div')
            postBox.classList = ['box']
            postElem.appendChild(postBox)

            // all header stuffs
            let boxHead = document.createElement('div')
            boxHead.classList = ['box-head']
            postBox.appendChild(boxHead);

            let boxLink = document.createElement('a')
            boxLink.setAttribute('href', `https://scratch.mit.edu/discuss/post/${post.id}`)
            boxLink.appendChild(document.createTextNode(`${post.topic.category} » ${post.topic.title}`));
            boxHead.appendChild(boxLink)

            let boxTime = document.createElement('span')
            boxTime.classList = 'conr'
            boxTime.appendChild(document.createTextNode(new Date(post.time.posted).toLocaleString('en-US')))
            boxHead.appendChild(boxTime);

            // post content
            let postContent = document.createElement('div')
            postContent.classList = 'box-content'
            postBox.appendChild(postContent)

            let postLeft = document.createElement('div')
            postLeft.classList = 'postleft'
            postContent.appendChild(postLeft)

            let postLeftDl = document.createElement('dl')
            postLeft.appendChild(postLeftDl)
            
            let userLink = document.createElement('a')
            userLink.classList = 'black username'
            userLink.setAttribute('href', `https://scratch.mit.edu/users/${post.username}`)
            userLink.appendChild(document.createTextNode(post.username))
            postLeftDl.appendChild(userLink)

            let postRight = document.createElement('div')
            postRight.classList = 'postright'
            postContent.appendChild(postRight)

            let postMsg = document.createElement('div')
            postMsg.classList = 'postmsg'
            postRight.appendChild(postMsg)

            let postHTML = document.createElement('div')
            postHTML.classList = 'post_body_html'
            postHTML.insertAdjacentHTML('beforeend', cleanPost(post.content.html))
            postMsg.appendChild(postHTML)

            if (post.editor != null) {
                console.log('edited')
                let postEdit = document.createElement("p")
                postEdit.classList = 'postedit'
                let postEditMessage = document.createElement('em')
                postEditMessage.classList = 'posteditmessage'
                postEditMessage.appendChild(document.createTextNode(`Last edited by ${post.editor} (${new Date(post.time.edited).toLocaleString('en-US')})`))
                postEdit.appendChild(postEditMessage)
                postMsg.appendChild(postEdit)
            }
            box.appendChild(postElem)
        }
        scratchblocks.renderMatching('pre.blocks')
        isCurrentlyProcessing = false
    });
}


export default async function ({ addon, global, console }) {
    await addon.tab.loadScript("https://scratchblocks.github.io/js/scratchblocks-v3.5-min.js");
    // create the search bar
    let search = document.createElement("form")
    let searchBar = document.createElement("input")
    searchBar.id = "forum-search-input"
    searchBar.setAttribute("type", "text")
    searchBar.setAttribute("placeholder", "Search the Forums")
    search.appendChild(searchBar);
    
    let searchContent = document.createElement("div")
    searchContent.addEventListener('scroll', (e) => {
        let et = e.target
        if (et.scrollHeight - et.scrollTop === et.clientHeight) {
            if (!isCurrentlyProcessing) {
                appendSearch(searchContent, currentQuery, currentPage+1, "relevance")
            }
        }
    });

    searchContent.classList = "forum-search-list"
 
    // now add the search bar
    let navIndex = document.querySelector("ul.conr")
    navIndex.parentNode.after(searchContent)
    navIndex.parentNode.after(search)

    
    search.addEventListener("submit", (e) => {
        while (searchContent.firstChild) {
            searchContent.removeChild(searchContent.firstChild);
        }
        currentQuery = searchBar.value
        appendSearch(searchContent, currentQuery, 0, "relevance");
        e.preventDefault()
    });
};