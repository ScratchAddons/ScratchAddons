export default async function ({ addon, msg }) {
  let path = window.location.pathname;
  let username = path.split("/")[2];




  let eButton = document.createElement('button')

  function addButton() {
    let commentsText = Array.from(document.querySelectorAll('h4'))
    .find(el => el.innerText==('Comments'));
   
    function setButtonStyles(){
      eButton.innerHTML = eButton.enabled ? 'Live on' : 'Live off'
      eButton.classList.add(eButton.enabled ? 'live-button-enabled' : 'live-button-disabled')
      eButton.classList.remove((!eButton.enabled) ? 'live-button-enabled' : 'live-button-disabled')
      refreshComments()
    }

    eButton.onclick = (e)=>{
      eButton.enabled=!eButton.enabled;
      setButtonStyles()
    }

    eButton.classList.add('live-button')
    eButton.enabled = true
    setButtonStyles()
   
   
   // place button
    commentsText?.after(eButton)
  }
  addButton()


  async function refreshComments() {
    if(!eButton.enabled) {return}
    //// FUNCTIONS

    ///// CODE

    let oldComments = document.querySelector(".comments");
    let oldNum = Array.from(oldComments.children).filter((node) => node.classList?.contains("top-level-reply")).length;
    if (oldNum <= 1 && oldComments.childNodes.length > 1) {
      // console.log("NOT LOADED YET");
      return;
    }
    oldNum -= 2;
    oldNum = Math.min(30, oldNum);
    // console.log("LIMIT", oldNum);
    let newComments = await (
      await fetch(
        `https://scratch.mit.edu/site-api/comments/user/${username}/?page=1&limit=${oldNum}&rand=${Math.random()}`,
        {
          headers: {
            "Cache-Control": "no-store",
            pragma: "no-cache",
          },
          cache: "no-store",
          method: "GET",
        }
      )
    ).text();
    // console.log(newComments)
    let newDiv = document.createElement("div");
    newDiv.innerHTML = newComments;

    /// format reply for logged in
    newDiv.querySelectorAll("a.reply").forEach((div) => {
      div.style.display = "inline";
      div.setAttribute("data-control", "reply-to");
    });
    newDiv.querySelectorAll(".truncated").forEach((div) => {
      div.classList.remove("truncated");
    });

    // console.log(newDiv.children)

    for (let tlr of newDiv.children) {
      if (!tlr.classList.contains("top-level-reply")) {
        continue;
      }
      // console.log(tlr)

      let comment = tlr.firstElementChild;
      let commentId = comment.id;
      let alreadyOnPage = document.getElementById(commentId);
      // console.log(alreadyOnPage)

      if (alreadyOnPage) {
        // loop through replies
        let repliesElem = tlr.querySelector(".replies");
        let replies = repliesElem.children;
        for (let rli of replies) {
          let rcomment = rli.firstElementChild;
          let rcommentId = rcomment.id;
          let ralreadyOnPage = document.getElementById(rcommentId);

          if (!ralreadyOnPage) {
            // console.log("NEW REPLY!!!");
            let rolderSiblingId = rli.previousElementSibling?.firstElementChild?.id;
            // console.log("sib", rolderSiblingId);
            let rolderSiblingAlreadyOnPage = document.getElementById(rolderSiblingId)?.parentElement;
            // console.log("rolder", rolderSiblingAlreadyOnPage);
            rli.classList.remove("truncated"); // having truncated hides the comment element
            rli.classList.add("newCom");
            $(rli.querySelector("span.time"))?.timeago();
            if (rolderSiblingAlreadyOnPage) {
              rolderSiblingAlreadyOnPage.after(rli);
              rolderSiblingAlreadyOnPage.classList.remove("last");
            } else {
              alreadyOnPage.parentElement.querySelector(".replies").appendChild(rli);
            }
          }
        }
      } else {
        // console.log("SOMETHING NEW!!!");
        // get older sibling id, and append new comment after that sibling on the document
        let olderSiblingId = tlr.previousElementSibling?.firstElementChild?.id;
        tlr.classList.add("newCom");
        $(tlr.querySelector("span.time")).timeago();
        let olderSiblingAlreadyOnPage = document.getElementById(olderSiblingId)?.parentElement;
        if (olderSiblingAlreadyOnPage) {
          olderSiblingAlreadyOnPage.after(tlr);
          // console.log("AFTER!");
        } else if (!olderSiblingAlreadyOnPage && !olderSiblingId) {
          oldComments.firstElementChild.before(tlr);
          // console.log("AT TOP!");
        } else if (!olderSiblingAlreadyOnPage && olderSiblingId) {
          oldComments.lastElementChild.after(tlr);
          // console.log("AT BOTTOM!");
        }
      }

      /// TODO: populate replies

      // console.log(comment)
    }
  }

  setInterval(refreshComments, 3000);
}
