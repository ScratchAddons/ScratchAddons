let isCurrentlyProcessing = false;
let currentPage = 0;
let hits = 10000; // elastic default
let currentQuery;
let currentSort = "relevance";
let locationQuery = "";

function cleanPost(post) {
  // Thanks Jeffalo
  const dom = new DOMParser();
  const readableDom = dom.parseFromString(post, "text/html");

  const codeSegments = readableDom.querySelectorAll("pre");

  for (const segment of codeSegments) {
    segment.innerHTML = segment.innerHTML.replace(/<br>/g, "\n");
    segment.innerHTML = segment.innerHTML.replace(/</g, "&lt;");
  }

  return readableDom.documentElement.innerHTML;
}

function triggerNewSearch(searchContent, query, sort, msg) {
  searchContent.style.display = "block";
  while (searchContent.firstChild) {
    searchContent.removeChild(searchContent.firstChild);
  }
  currentQuery = query;
  appendSearch(searchContent, query, 0, sort, msg);
}

function appendSearch(box, query, page, term, msg) {
  if (page * 50 > hits) return 0;
  isCurrentlyProcessing = true;
  let loading = document.createTextNode(msg("loading"));
  currentPage = page;
  box.appendChild(loading);
  window
    .fetch(`https://scratchdb.lefty.one/v3/forum/search?q=${encodeURIComponent(query)}&page=${page}&o=${term}`)
    .catch((err) => {
      box.removeChild(box.lastChild);
      box.appendChild(document.createTextNode(msg("error")));
    })
    .then((res) => res.json())
    .then((data) => {
      hits = data.hits;
      if (hits === 0) {
        //there were no hits
        box.removeChild(box.lastChild);
        box.appendChild(document.createTextNode(msg("none")));

        return;
      }
      box.removeChild(box.lastChild);
      for (let post of data.posts) {
        function createTextBox(data, classes, times) {
          let element = document.createElement("span");
          element.classList = classes;
          element.appendChild(document.createTextNode(data));
          for (let i = 0; i < times || 0; i++) {
            element.appendChild(document.createElement("br"));
          }
          return element;
        }
        // the post
        let postElem = document.createElement("div");
        postElem.classList = "blockpost roweven firstpost";

        // the post box
        let postBox = document.createElement("div");
        postBox.classList = ["box"];
        postElem.appendChild(postBox);

        // all header stuffs
        let boxHead = document.createElement("div");
        boxHead.classList = ["box-head"];
        postBox.appendChild(boxHead);

        let boxLink = document.createElement("a");
        boxLink.setAttribute("href", `https://scratch.mit.edu/discuss/post/${post.id}`);
        boxLink.appendChild(document.createTextNode(`${post.topic.category} » ${post.topic.title}`));
        boxHead.appendChild(boxLink);

        let boxTime = document.createElement("span");
        boxTime.classList = "conr";
        const localizedPostDate = scratchAddons.l10n.datetime(new Date(post.time.posted));
        boxTime.appendChild(document.createTextNode(localizedPostDate));
        boxHead.appendChild(boxTime);

        // post content
        let postContent = document.createElement("div");
        postContent.classList = "box-content";
        postBox.appendChild(postContent);

        let postLeft = document.createElement("div");
        postLeft.classList = "postleft";
        postContent.appendChild(postLeft);

        let postLeftDl = document.createElement("dl");
        postLeft.appendChild(postLeftDl);

        postLeftDl.appendChild(createTextBox(msg("username"), "black username", 1));
        let userLink = document.createElement("a"); // this one is an `a` and not a `span`, so it isnt in the createTextBox function
        userLink.setAttribute("href", `https://scratch.mit.edu/users/${post.username}`);
        userLink.appendChild(document.createTextNode(post.username));
        postLeftDl.appendChild(userLink);

        postLeftDl.appendChild(document.createElement("br"));
        postLeftDl.appendChild(document.createElement("br"));

        if (locationQuery !== "") {
          let userPostButton = document.createElement("a");
          userPostButton.appendChild(document.createTextNode(msg("posts-here")));
          userPostButton.addEventListener("click", () => {
            document.getElementById("forum-search-input").value = `+username:"${post.username}" ${locationQuery}`;
            triggerNewSearch(
              document.getElementById("forum-search-list"),
              document.getElementById("forum-search-input").value,
              document.getElementById("forum-search-dropdown").value,
              msg
            );
          });
          postLeftDl.appendChild(userPostButton);

          postLeftDl.appendChild(document.createElement("br"));
        }

        let userGlobalButton = document.createElement("a");
        userGlobalButton.appendChild(document.createTextNode(msg("posts-sitewide")));
        userGlobalButton.addEventListener("click", () => {
          document.getElementById("forum-search-input").value = `+username:"${post.username}"`;
          triggerNewSearch(
            document.getElementById("forum-search-list"),
            document.getElementById("forum-search-input").value,
            document.getElementById("forum-search-dropdown").value,
            msg
          );
        });
        postLeftDl.appendChild(userGlobalButton);

        postLeftDl.appendChild(document.createElement("br"));
        postLeftDl.appendChild(document.createElement("br"));

        postLeftDl.appendChild(createTextBox(msg("first-checked"), "black username", 1));
        postLeftDl.appendChild(createTextBox(scratchAddons.l10n.datetime(new Date(post.time.first_checked)), "", 2));

        postLeftDl.appendChild(createTextBox(msg("last-checked"), "black username", 1));
        postLeftDl.appendChild(
          createTextBox(scratchAddons.l10n.datetime(new Date(post.time.html_last_checked)), "", 2)
        );

        let postRight = document.createElement("div");
        postRight.classList = "postright";
        postContent.appendChild(postRight);

        let postMsg = document.createElement("div");
        postMsg.classList = "postmsg";
        postRight.appendChild(postMsg);

        let postHTML = document.createElement("div");
        postHTML.classList = "post_body_html";
        postHTML.insertAdjacentHTML("beforeend", cleanPost(post.content.html));
        postMsg.appendChild(postHTML);

        if (post.editor) {
          let postEdit = document.createElement("p");
          postEdit.classList = "postedit";
          let postEditMessage = document.createElement("em");
          postEditMessage.classList = "posteditmessage";
          postEditMessage.appendChild(
            document.createTextNode(
              msg("last-edited-by", {
                username: post.editor,
                datetime: scratchAddons.l10n.datetime(new Date(post.time.edited)),
              })
            )
          );
          postEdit.appendChild(postEditMessage);
          postMsg.appendChild(postEdit);
        }

        let clearer = document.createElement("div"); // i guess this is extremely important for formatting
        clearer.classList = "clearer";
        postContent.appendChild(clearer);

        box.appendChild(postElem);
      }
      scratchblocks.renderMatching("pre.blocks");
      isCurrentlyProcessing = false;
    });
}

export default async function ({ addon, global, console, msg }) {
  await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/scratchblocks-v3.5-min.js");
  // create the search bar
  let search = document.createElement("form");
  search.id = "forum-search-form";
  let searchBar = document.createElement("input");
  searchBar.id = "forum-search-input";
  searchBar.setAttribute("type", "text");
  let pathSplit = window.location.pathname.split("/");
  let searchPlaceholder = msg("placeholder");
  switch (pathSplit.length) {
    case 5: {
      let topicTitle = document
        .getElementsByClassName("linkst")[0]
        .getElementsByTagName("li")[2]
        .innerText.substring(2)
        .trim();
      locationQuery = ` +topic:${pathSplit[3]}`;
      searchPlaceholder = msg("search-topic", { topic: topicTitle });
      break;
    }
    case 4: {
      let category = document.getElementsByClassName("box-head")[1].getElementsByTagName("span")[0].innerHTML;
      locationQuery = ` +category:"${category}"`;
      searchPlaceholder = msg("search-cat", { cat: category });
      break;
    }
  }
  searchBar.setAttribute("placeholder", searchPlaceholder);
  search.appendChild(searchBar);

  let searchDropdown = document.createElement("select");
  searchDropdown.id = "forum-search-dropdown";
  let types = ["relevance", "newest", "oldest"];
  for (let type of types) {
    let dropdownOption = document.createElement("option");
    dropdownOption.value = type;
    dropdownOption.appendChild(document.createTextNode(msg(type)));
    searchDropdown.appendChild(dropdownOption);
  }
  search.appendChild(searchDropdown);

  let searchContent = document.createElement("div");
  searchContent.addEventListener("scroll", (e) => {
    let et = e.target;
    if (et.scrollHeight - et.scrollTop === et.clientHeight) {
      if (!isCurrentlyProcessing) {
        appendSearch(searchContent, currentQuery, currentPage + 1, currentSort, msg);
      }
    }
  });

  searchContent.classList = "forum-search-list";
  searchContent.id = "forum-search-list";

  // now add the search bar
  let navIndex = document.querySelector("#brdmenu");
  navIndex.after(searchContent);
  navIndex.after(search);

  search.addEventListener("submit", (e) => {
    triggerNewSearch(searchContent, searchBar.value + locationQuery, searchDropdown.value, msg);
    e.preventDefault();
  });

  searchDropdown.addEventListener("change", (e) => {
    if (searchBar.value !== "") {
      triggerNewSearch(searchContent, searchBar.value + locationQuery, searchDropdown.value, msg);
    }
  });
}
