const blockTheme = window.getCookie("scratchtheme") === "high-contrast" ? "scratch3-high-contrast" : "scratch3";
let isCurrentlyProcessing = false;
let currentPage = 0;
let hits = 10000; // elastic default
let currentQuery;
let currentFilter;
let currentSort = "relevance";
let hasMoreResults = true;

const ALLOWED_TAGS = {
  A: ["href"],
  BR: [],
  BLOCKQUOTE: [],
  DIV: ["class", "style"],
  EM: ["class", "style"],
  I: ["class", "style"],
  IMG: ["src"],
  LI: [],
  OL: ["style"],
  P: ["class"],
  PRE: ["class"],
  SPAN: ["class", "style"],
  STRIKE: ["class", "style"],
  STRONG: ["class", "style"],
  UL: [],
};

class SanitizerFailed extends Error {}

function cleanPost(post) {
  // Thanks Jeffalo
  const dom = new DOMParser();
  const readableDom = dom.parseFromString(post, "text/html");

  const recursiveCheck = (elem) => {
    if (!(elem instanceof Element)) return;
    const allowed = ALLOWED_TAGS[elem.tagName];
    if (!allowed) {
      throw new SanitizerFailed(`forum-search: Warning: Potential XSS attempt found: ${elem.tagName} is not allowed`);
    }
    Array.prototype.forEach.call(elem.attributes, (attr) => {
      if (!allowed.includes(attr.name)) {
        throw new SanitizerFailed(
          `forum-search: Warning: Potential XSS attempt found: ${attr.name} is not allowed for ${elem.tagName}`
        );
      }
      if (attr.name === "href" && !(elem.protocol === "https:" || elem.protocol === "http:")) {
        throw new SanitizerFailed(
          `forum-search: Warning: Potential XSS attempt found: protocol ${elem.protocol} is not allowed`
        );
      }
    });
    Array.prototype.forEach.call(elem.children, recursiveCheck);
  };
  try {
    Array.prototype.forEach.call(readableDom.body.children, recursiveCheck);
  } catch (e) {
    if (!(e instanceof SanitizerFailed)) throw e;
    console.warn(e.message);
    return [document.createTextNode(readableDom.body.innerHTML)];
  }
  return readableDom.body.cloneNode(true).childNodes;
}

function triggerNewSearch(searchContent, query, filter, sort, msg) {
  searchContent.classList.add("show");
  while (searchContent.firstChild) {
    searchContent.removeChild(searchContent.firstChild);
  }
  currentQuery = query;
  currentFilter = filter;
  hasMoreResults = true;
  appendSearch(searchContent, query, filter, 0, sort, msg);
}

function parseFilterParams(filter) {
  if (!filter) return {};

  const params = {};
  const usernameMatch = filter.match(/username\s*=\s*"([^"]+)"/i);
  if (usernameMatch) params.author = usernameMatch[1];

  const topicMatch = filter.match(/topic\.id\s*=\s*(\d+)/i);
  if (topicMatch) params.topic = topicMatch[1];

  const categoryMatch = filter.match(/topic\.category\s*=\s*"([^"]+)"/i);
  if (categoryMatch) params.category = categoryMatch[1];

  const postMatch = filter.match(/post\.id\s*=\s*(\d+)/i);
  if (postMatch) params.post = postMatch[1];

  return params;
}

function appendSearch(box, query, filter, page, term, msg) {
  if (!hasMoreResults && page > 0) {
    return 0;
  }
  isCurrentlyProcessing = true;
  let loading = document.createTextNode(msg("loading"));
  currentPage = page;
  box.appendChild(loading);
  const limit = 50;
  const offset = page * limit;
  let mode = "relevance";
  let sortParam;
  if (term === "popularity" || term === "relevance") {
    mode = term;
  }
  if (term === "oldest" || term === "newest") {
    mode = "sort";
    sortParam = term;
  }

  const filterParams = parseFilterParams(filter);
  const categoryParam = filterParams.category || "all";
  delete filterParams.category;

  const searchParams = new URLSearchParams({
    q: query,
    mode,
    category: categoryParam,
    limit: String(limit),
    offset: String(offset),
    detail: "3",
    displayAuthor: "true",
    ...filterParams,
  });
  if (sortParam) {
    searchParams.set("sort", sortParam);
  }

  window
    .fetch(`https://api.scratchpost.quuq.dev/search/posts?${searchParams.toString()}`)
    .catch((err) => {
      box.removeChild(box.lastChild);
      box.appendChild(document.createTextNode(msg("error")));
    })
    .then((res) => res.json())
    .then((data) => {
      const results = Array.isArray(data) ? data : data?.hits || [];
      hits = results.length;
      hasMoreResults = results.length === limit;

      if (hits === 0) {
        //there were no hits
        box.removeChild(box.lastChild);
        box.appendChild(document.createTextNode(msg("none")));

        return;
      }
      box.removeChild(box.lastChild);
      currentPage = page;
      for (let post of results) {
        function createTextBox(data, classes, times) {
          let element = document.createElement("span");
          element.classList = classes;
          element.appendChild(document.createTextNode(data));
          for (let i = 0; i < times || 0; i++) {
            element.appendChild(document.createElement("br"));
          }
          return element;
        }
        function createLabel(text) {
          let container = document.createElement("div");
          let textElement = document.createElement("strong");
          container.appendChild(textElement);
          textElement.innerText = text;
          return container;
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
        boxLink.appendChild(document.createTextNode(`${post.category_name} » ${post.topic_name}`));
        boxHead.appendChild(boxLink);

        let boxTime = document.createElement("span");
        boxTime.classList = "conr";
        const localizedPostDate = scratchAddons.l10n.datetime(new Date(post.date));
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

        postLeftDl.appendChild(createLabel(msg("username")));
        let userLink = document.createElement("a"); // this one is an `a` and not a `span`, so it isnt in the createTextBox function
        userLink.setAttribute("href", `https://scratch.mit.edu/users/${post.author}`);
        userLink.appendChild(document.createTextNode(post.author));
        postLeftDl.appendChild(userLink);

        postLeftDl.appendChild(document.createElement("br"));
        postLeftDl.appendChild(document.createElement("br"));
        const filterBar = document.querySelector("#forum-search-filter-input");
        if (filterBar.value !== "") {
          let userPostButton = document.createElement("a");
          userPostButton.appendChild(document.createTextNode(msg("posts-here")));
          userPostButton.addEventListener("click", () => {
            document.getElementById("forum-search-input").value = "";
            filterBar.value = `username = "${post.author}" AND (${filterBar.value})`;
            triggerNewSearch(
              document.getElementById("forum-search-list"),
              document.getElementById("forum-search-input").value,
              document.getElementById("forum-search-filter-input").value,

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
          document.getElementById("forum-search-input").value = "";
          document.getElementById("forum-search-filter-input").value = `username = "${post.author}"`;
          triggerNewSearch(
            document.getElementById("forum-search-list"),
            document.getElementById("forum-search-input").value,
            document.getElementById("forum-search-filter-input").value,
            document.getElementById("forum-search-dropdown").value,
            msg
          );
        });
        postLeftDl.appendChild(userGlobalButton);

        postLeftDl.appendChild(document.createElement("br"));
        postLeftDl.appendChild(document.createElement("br"));

        let postRight = document.createElement("div");
        postRight.classList = "postright";
        postContent.appendChild(postRight);

        let postMsg = document.createElement("div");
        postMsg.classList = "postmsg";
        postRight.appendChild(postMsg);

        let postHTML = document.createElement("div");
        postHTML.classList = "post_body_html";
        postHTML.append(...cleanPost(post.content));
        postMsg.appendChild(postHTML);

        if (post.time_last_edited && post.last_edited_by) {
          let postEdit = document.createElement("p");
          postEdit.classList = "postedit";
          let postEditMessage = document.createElement("em");
          postEditMessage.classList = "posteditmessage";
          postEditMessage.appendChild(
            document.createTextNode(
              msg("last-edited-by", {
                username: post.last_edited_by,
                datetime: scratchAddons.l10n.datetime(new Date(post.time_last_edited)),
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
      scratchblocks.renderMatching(".forum-search-list pre.blocks", {
        style: blockTheme,
        scale: 0.675,
      });
      isCurrentlyProcessing = false;
    });
}

export default async function ({ addon, console, msg }) {
  // create the search bar
  let search = document.createElement("form");
  addon.tab.displayNoneWhileDisabled(search);
  search.id = "forum-search-form";
  let searchBar = document.createElement("input");
  searchBar.id = "forum-search-input";
  searchBar.setAttribute("type", "text");

  let filterBar = document.createElement("input");
  filterBar.id = "forum-search-filter-input";
  filterBar.setAttribute("type", "text");

  let pathSplit = window.location.pathname.split("/");
  let searchPlaceholder = msg("placeholder");
  if (pathSplit[2] !== "settings") {
    switch (pathSplit.length) {
      case 5: {
        filterBar.value = `topic.id = ${pathSplit[3]}`;
        break;
      }
      case 4: {
        filterBar.value = ` topic.category = "${pathSplit[2]}"`;
        break;
      }
    }
  }

  searchBar.setAttribute("placeholder", searchPlaceholder);
  filterBar.setAttribute("placeholder", msg("filter-placeholder"));
  search.appendChild(searchBar);
  search.appendChild(filterBar);

  let searchDropdown = document.createElement("select");
  searchDropdown.id = "forum-search-dropdown";
  let types = ["relevance", "popularity", "newest", "oldest"];
  for (let type of types) {
    let dropdownOption = document.createElement("option");
    dropdownOption.value = type;
    dropdownOption.appendChild(document.createTextNode(msg(type)));
    searchDropdown.appendChild(dropdownOption);
  }
  search.appendChild(searchDropdown);

  search.appendChild(
    Object.assign(document.createElement("input"), {
      type: "submit",
      className: "button small grey",
    })
  );

  let searchContent = document.createElement("div");
  searchContent.addEventListener("scroll", (e) => {
    let et = e.target;
    if (et.scrollHeight - et.scrollTop - et.clientHeight < 10) {
      if (!isCurrentlyProcessing) {
        appendSearch(searchContent, currentQuery, currentFilter, currentPage + 1, currentSort, msg);
      }
    }
  });

  searchContent.classList = "forum-search-list";
  searchContent.id = "forum-search-list";
  searchContent.style.display = "none"; // overridden by userstyle if the addon is enabled

  // now add the search bar
  let navIndex = document.querySelector("#brdmenu");
  navIndex.after(searchContent);
  navIndex.after(search);

  search.addEventListener("submit", (e) => {
    triggerNewSearch(searchContent, searchBar.value, filterBar.value, searchDropdown.value, msg);
    e.preventDefault();
  });

  searchDropdown.addEventListener("change", (e) => {
    if (searchBar.value !== "") {
      triggerNewSearch(searchContent, searchBar.value, filterBar.value, searchDropdown.value, msg);
    }
  });
}
