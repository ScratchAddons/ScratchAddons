import LocalizationProvider from "../../../libraries/common/cs/l10n.js";

const l10n = new LocalizationProvider();
const msgs = ["comments.lengthWarning", "comments.muted.duration", "comments.muted.moreInfoModal"];

// l10n api is broken lol
const corrections = {
  "comments.lengthWarning": "{remainingCharacters, plural, one {1 character left} other {# characters left}}",
};

export default ({ addon }) => {
  for (const msg of msgs) {
    l10n.messages[msg] = corrections[msg] || addon.tab.scratchMessage(msg);
  }

  const reduxState = addon.tab.redux.state;
  const scratchMessage = addon.tab.scratchMessage.bind(addon.tab);

  const token = addon.auth.xToken;
  const { username, userId, csrfToken } = addon.auth;

  // id of project/studio
  const [, pageType, pageId] = window.location.pathname.split("/");

  // API URLs
  const COMMENTS_API_URL = `https://api.scratch.mit.edu${
    pageType === "projects" ? `/users/${reduxState.preview.projectInfo.author.username}` : ""
  }/${pageType}/${pageId}/comments`;
  const PROXY_API_URL = `https://api.scratch.mit.edu/proxy/comments/${pageType.slice(0, -1)}/${pageId}`;

  // functions to check if the user can delete/report a specific comment
  const canDelete = (author) =>
    pageType === "studios"
      ? reduxState.studio.manager && author === username
      : reduxState.preview.projectInfo.author.id === userId;

  const canReport = (author) => pageType !== "studios" || author !== username;

  // regexes to look for URLs & mentions in comments
  const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*scratch\.mit\.edu[-A-Z0-9+&@#/%=~_|]*)/gi;
  const mentionRegex = /(?<=(^|[\s.,!])(?!\S*[:#]))[@|＠][a-z0-9_-]{1,20}(?=(?:\b(?!@|＠)|$))/gi;

  // adds the mentions and URLs to the text
  function addLinks(text) {
    return text
      .replace(urlRegex, (url) => `<a href="${url}">${url}</a>`)
      .replace(mentionRegex, (mention) => `<a href="https://scratch.mit.edu/users/${mention.slice(1)}">${mention}</a>`);
  }

  const timeUnits = {
    year: 24 * 60 * 60 * 1000 * 365,
    month: (24 * 60 * 60 * 1000 * 365) / 12,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000,
  };

  // relative time, for notice below comments
  const rtf = new Intl.RelativeTimeFormat(addon.auth.scratchLang, { numeric: "auto" });

  function getRelativeTime(time1, time2) {
    const elapsed = time1 - time2;

    if (Math.abs(elapsed) < 10000) return "now";

    for (const [unit, ms] of Object.entries(timeUnits)) {
      if (Math.abs(elapsed) > ms || unit === "second") return rtf.format(Math.round(elapsed / ms), unit);
    }

    return "now";
  }

  const newComments = {};

  let currentTime = Date.now();

  // opens modal for reports and deletions
  function openModal(type, id) {
    const modal = document.createElement("div");
    const modalTitle = scratchMessage(`comments.${type}Modal.title`);

    modal.id = "delete-report-modal";
    modal.classList.add("ReactModalPortal");
    // uses innerHTML because otherwise the code will be massive and unreadable
    modal.innerHTML = `
  <div class="modal-overlay modal-overlay">
    <div class="modal-content mod-report modal-sizes modal-content mod-report" tabindex="-1" role="dialog" aria-label="${modalTitle}">
      <div class="modal-content-close"><img alt="close-icon" class="modal-content-close-img" draggable="false" src="/svgs/modal/close-x.svg"></div>
      <div>
        <div class="report-modal-header">
          <div class="report-content-label"><span>${modalTitle}</span></div>
        </div>
        <div class="report-modal-content">
          <div>
            <div class="instructions"><span>${scratchMessage(
              type === "report" ? "comments.reportModal.prompt" : "comments.deleteModal.body"
            )}</span></div>
          </div>
        </div>
        <div class="flex-row action-buttons">
          <div class="action-buttons-overflow-fix">
            <button class="button action-button submit-button" type="button">
            <div class="action-button-text">
              <span>${scratchMessage("general.close")}</span>
            </div>
            </button>
            <button class="button action-button submit-button" type="button">
            <span>${scratchMessage("general.report")}</span></button>${
      type === "report"
        ? ""
        : `<button class="button action-button submit-button" type="button"><span>${scratchMessage(
            "comments.delete"
          )}</span></button>`
    }
          </div>
        </div>
      </div>
    </div>
  </div>`;

    // adds all event listeners
    modal.querySelector(".modal-content-close").addEventListener("click", closeModal);

    modal.querySelector(".action-buttons-overflow-fix button").addEventListener("click", closeModal);

    modal.querySelector(".action-buttons-overflow-fix :nth-child(2)").addEventListener("click", () => {
      reportComment(id);
      document.getElementById("delete-report-modal").querySelector(".instructions").textContent = scratchMessage(
        "comments.reportModal.reported"
      );
    });

    if (type !== "report") {
      modal.querySelector(".action-buttons-overflow-fix :nth-child(3)").addEventListener("click", () => {
        deleteComment(id);
      });
    }

    document.body.appendChild(modal);
  }

  function deleteComment(id) {
    fetch(`${PROXY_API_URL}/comment/${id}`, {
      headers: {
        "x-csrftoken": csrfToken,
        "x-requested-with": "XMLHttpRequest",
        referer: `https://scratch.mit.edu/${pageType}/${pageId}`,
        "x-token": token,
      },
      method: "DELETE",
      body: null,
      credentials: "include",
    });
    document.getElementById(`comments-${id}`).querySelector(".comment-bubble").classList.add("comment-bubble-reported");
    document
      .getElementById(`comments-${id}`)
      .querySelector(".action-list").innerHTML = `<span class="comment-visibility">${scratchMessage(
      "comments.status.deleted"
    )}</span>`;
    closeModal();
  }

  function reportComment(id) {
    fetch(`${PROXY_API_URL}/comment/${id}/report`, {
      headers: {
        "x-csrftoken": csrfToken,
        "x-requested-with": "XMLHttpRequest",
        referer: `https://scratch.mit.edu/${pageType}/${pageId}`,
        "x-token": token,
      },
      method: "POST",
      body: null,
      credentials: "include",
    });
    document
      .getElementById(`comments-${id}`)
      .querySelector(".action-list").innerHTML = `<span class="comment-visibility">${scratchMessage(
      "comments.status.reported"
    )}</span>`;
  }

  // opens new comment for when user clicks "reply"
  function openReplyBox(comment) {
    const bodyColumn = document.getElementById(`comments-${comment}`).querySelector(".flex-row.comment-body.column");
    const replyBox = document.createElement("div");

    replyBox.classList.add("flex-row", "comment-reply-row");
    replyBox.innerHTML = `
      <div class="flex-row comment">
        <a href="/users/${username}">
          <img class="avatar" src="//cdn2.scratch.mit.edu/get_image/user/${userId}_32x32.png">
        </a>
        <div class="flex-row compose-comment column">
          <form class="full-width-form">
            <div class="form-group row textarea-row no-label compose-input compose-valid">
              <div class="col-sm-offset-3 col-sm-9 grow">
                <textarea class="inplace-textarea" name="compose-comment" id="frc-compose-comment-3392903" rows="3"></textarea>
              </div>
            </div>
            <div class="flex-row compose-bottom-row">
              <button class="button compose-post">
                <span>${scratchMessage("comments.post")}</span>
              </button>
              <button class="button compose-cancel">
                <span>${scratchMessage("general.cancel")}</span>
              </button>
              <span class="compose-limit compose-valid">
                <span>${l10n.get("comments.lengthWarning", { remainingCharacters: 500 })}</span>
              </span>
            </div>
          </form>
        </div>
      </div>`;

    replyBox.querySelector(".button.compose-post").addEventListener("click", (evt) => {
      evt.preventDefault();

      postReply(comment, evt.target.parentNode.parentNode.parentNode.parentNode.parentNode);
    });

    replyBox.querySelector(".button.compose-cancel").addEventListener("click", () => {
      closeReplyBox(comment);
    });

    replyBox.querySelector("textarea").addEventListener("input", (evt) => {
      replyBox.querySelector(".compose-limit.compose-valid span").textContent = l10n.get("comments.lengthWarning", {
        remainingCharacters: 500 - evt.target.value.length,
      });
    });

    bodyColumn.insertBefore(replyBox, bodyColumn.querySelector(".comment-bubble").nextSibling);
  }

  function closeReplyBox(comment) {
    const commentElement = document.getElementById(`comments-${comment}`);

    commentElement
      .querySelector(".flex-row.comment-body.column")
      .removeChild(commentElement.querySelector(".flex-row.comment-reply-row"));
  }

  function getMuteMessageInfo() {
    const messageInfo = {
      pii: {
        muteStepContent: ["comment.pii.content1", "comment.pii.content2", "comment.pii.content3"],
      },
      unconstructive: {
        muteStepContent: ["comment.unconstructive.content1", "comment.unconstructive.content2"],
      },
      vulgarity: {
        muteStepContent: ["comment.vulgarity.content1", "comment.vulgarity.content2"],
      },
      spam: {
        muteStepContent: ["comment.spam.content1", "comment.spam.content2"],
      },
      general: {
        muteStepContent: ["comment.general.content1"],
      },
    };

    if (muteType) {
      return messageInfo[muteType];
    }

    return messageInfo.general;
  }

  function commentError(replyBox, key) {
    replyBox.querySelector(".button.compose-post span").textContent = scratchMessage("comments.post");

    const error = document.createElement("div");

    error.classList.add("flex-row", "compose-error-row");
    error.innerHTML = `
  <div class="compose-error-tip">
    <span>
      ${scratchMessage(key)}
    </span>
  </div>`;
    replyBox.querySelector(".flex-row.compose-comment.column").insertBefore(error, replyBox.querySelector("form"));
  }

  function showMutedStatus(replyBox, messageType, muteExpiresAt) {
    const mutedBox = document.createElement("div");

    mutedBox.classList.add("flex-row", "comment");
    mutedBox.innerHTML = `
  <div class="commenting-status">
    <div class="commenting-status-inner-content">
      <div class="flex-row comment-status-img">
        <img class="comment-status-icon" src="/svgs/project/comment-status.svg">
      </div>
      <div class="flex-row">
        <p>
          <span>${scratchMessage(`comment.type.${messageType}`)}</span>
        </p>
        <p>
          <span>${l10n.get("comments.muted.duration", {
            inDuration: getRelativeTime(muteExpiresAt, Date.now()),
          })}</span> <span>${scratchMessage("comments.muted.commentingPaused")}</span>
        </p>
        <p class="bottom-text">
          <span>${l10n.get("comments.muted.moreInfoModal", {
            clickHereLink: `<a href="/community_guidelines"><span>${scratchMessage(
              "comments.muted.clickHereLinkText"
            )}</span></a>.`,
          })}</span>
        </p>
      </div>
    </div>
  </div>`;

    replyBox.parentNode.insertBefore(mutedBox, replyBox);
  }

  function postReply(parent, replyBox) {
    // if there was an error before, remove it
    if (replyBox.querySelector(".flex-row.compose-error-row")) {
      replyBox
        .querySelector(".flex-row.compose-comment.column")
        .removeChild(replyBox.querySelector(".flex-row.compose-error-row"));
    }
    // attempt to post reply and load it
    replyBox.querySelector(".button.compose-post span").textContent = scratchMessage("comments.posting");

    if (replyBox.querySelector("textarea").value.length > 500) {
      commentError(replyBox, "comments.isTooLong");

      return;
    }

    if (replyBox.querySelector("textarea").value.length === 0) {
      commentError(replyBox, "comments.isEmpty");

      return;
    }

    const [commenteeId] = /\d+/g.exec(
      document.getElementById(`comments-${parent}`).querySelector(".avatar").src.slice(13)
    );

    fetch(PROXY_API_URL, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-csrftoken": csrfToken,
        "x-token": token,
        referer: "https://scratch.mit.edu/",
      },
      body: JSON.stringify({
        content: replyBox.querySelector("textarea").value,
        parent_id: parent,
        commentee_id: commenteeId,
      }),
      method: "POST",
      credentials: "include",
    })
      .then((resp) => {
        if (resp.status !== 200) {
          throw new Error();
        }

        return resp.json();
      })
      .then((replyData) => {
        if (replyData.rejected === "isBad") {
          replyBox.querySelector(".button.compose-post span").textContent = scratchMessage("comments.post");

          replyBox.querySelector("textarea").setAttribute("disabled", "");
          (replyBox.querySelector(".flex-row.comment") || replyBox).classList.add("compose-disabled");

          const messageType = replyData.status.mute_status.currentMessageType || "general";
          showMutedStatus(replyBox, messageType, replyData.status.mute_status.muteExpiresAt * 1000);

          return;
        }

        if (replyData.rejected) {
          commentError(replyBox, `comments.${replyData.rejected}`);

          return;
        }

        document
          .getElementById(`comments-${parent}`)
          .querySelector(".flex-row.comment-body.column")
          .removeChild(replyBox.closest(".flex-row.comment-reply-row"));

        const topLevelComment = document.getElementById(`comments-${parent}`).parentNode.classList.contains("replies")
          ? document
              .getElementById(`comments-${parent}`)
              .closest(".flex-row.comment-container")
              .querySelector(".flex-row.comment")
          : document.getElementById(`comments-${replyData.parent_id}`);

        if (!topLevelComment.parentNode.querySelector(".flex-row.replies.column")) {
          const replyColumn = document.createElement("div");

          replyColumn.classList.add("flex-row", "replies", "column");
          topLevelComment.parentNode.appendChild(replyColumn);
        }

        fetch(`${COMMENTS_API_URL}/${topLevelComment.id.slice(9)}`)
          .then((resp) => resp.json())
          .then((commentData) => {
            // if the comment took too long to post, it wil have already been generated, so no need to display it again
            if (document.getElementById(`comments-${commentData.id}`)) return;

            addReply(
              topLevelComment,
              commentData,
              replyData,
              {
                commenteeId: document.getElementById(`comments-${parent}`).querySelector(".username").textContent,
              },
              []
            );
          });
      })
      .catch((err) => {
        commentError(replyBox, "comments.error");
      });
  }

  function closeModal() {
    document.body.removeChild(document.getElementById("delete-report-modal"));
  }

  // loads a reply
  function addReply(comment, commentData, replyData, replyUsernames, repliesData) {
    const reply = document.createElement("div");

    reply.id = `comments-${replyData.id}`;
    reply.classList.add("flex-row", "comment");
    const replyUsername = replyUsernames[replyData.commentee_id] || commentData.author.username;

    reply.innerHTML = `
  <a href="/users/${replyData.author.username}">
    <img class="avatar" src="https://cdn2.scratch.mit.edu/get_image/user/${replyData.author.id}_60x60.png">
  </a>
  <div class="flex-row comment-body column">
    <div class="flex-row comment-top-row">
      <a class="username" href="/users/${replyData.author.username}">${replyData.author.username}
      </a>
      <div class="action-list">
        ${
          canDelete(replyData.author.username)
            ? `
        <span class="comment-delete">
          <span>${scratchMessage("comments.delete")}</span>
        </span>`
            : ""
        }
        ${
          canReport(replyData.author.username)
            ? `
        <span class="comment-report">
          <span>${scratchMessage("general.report")}</span>
        </span>`
            : ""
        }
      </div>
    </div>
    <div class="comment-bubble">
      <span class="comment-content">
        <span class="emoji-text"></span>
        <a href="/users/${replyUsername}">@${replyUsername}</a>
        <span class="emoji-text"> ${addLinks(replyData.content)}</span>
      </span>
      <div class="flex-row comment-bottom-row">
        <span class="comment-time">
          <span>${getRelativeTime(new Date(replyData.datetime_created), currentTime)}</span>
        </span>
        <span class="comment-reply">
          <span>${scratchMessage("comments.reply")}</span>
        </span>
      </div>
    </div>
  </div>`;
    if (reply.querySelector("span.comment-delete")) {
      reply.querySelector("span.comment-delete").addEventListener("click", () => {
        openModal("delete", replyData.id);
      });
    }

    if (reply.querySelector("span.comment-report")) {
      reply.querySelector("span.comment-report").addEventListener("click", () => {
        openModal("report", replyData.id);
      });
    }

    reply.querySelector("span.comment-reply").addEventListener("click", () => {
      openReplyBox(replyData.id);
    });

    comment.parentNode.querySelector(".flex-row.replies.column").appendChild(reply);
    newComments[replyData.id] = replyData.datetime_created;
    if (comment.querySelectorAll(".flex-row.comment").length === 4) {
      const seeMore = document.createElement("a");

      seeMore.classList.add("expand-thread");
      seeMore.innerHTML = `<span>${scratchMessage("comments.loadMoreReplies")}</span>`;
      seeMore.addEventListener("click", () => {
        for (let i = 3; i < repliesData.length; i++) addReply(comment, commentData, repliesData[i], replyUsernames);
        comment.querySelector(".flex-row.replies.column").classList.remove("collapsed");
        comment.querySelector(".flex-row.replies.column").removeChild(seeMore);
      });
      comment.querySelector(".flex-row.replies.column").classList.add("collapsed");
      comment.querySelector(".flex-row.replies.column").appendChild(seeMore);
    }
  }

  // loads all comments
  function refreshComments() {
    const containers = document.querySelectorAll(".flex-row.comment-container");
    let rows = Math.ceil(containers.length / 20);
    const [topComment] = containers;
    const bottomComment = containers[containers.length - 1].querySelector(".flex-row.comment");

    for (let i = 0; i < rows; i++) {
      fetch(`${COMMENTS_API_URL}?max=20&offset=${i * 20}`)
        .then((resp) => resp.json())
        .then((data) => {
          for (const [index, commentData] of data.entries()) {
            if (index + i * 20 >= containers.length - 1) {
              rows = 0;
              break;
            }
            let comment;

            if (!document.getElementById(`comments-${commentData.id}`)) {
              comment = document.createElement("div");
              comment.classList.add("flex-row", "comment-container");
              comment.innerHTML = `
          <div class="flex-row comment" id="comments-${commentData.id}">
            <a href="/users/${commentData.author.username}">
              <img class="avatar" src="https://cdn2.scratch.mit.edu/get_image/user/${commentData.author.id}_60x60.png">
            </a>
            <div class="flex-row comment-body column">
              <div class="flex-row comment-top-row">
                <a class="username" href="/users/${commentData.author.username}">${commentData.author.username}</a>
                <div class="action-list">
                  ${
                    canDelete(commentData.author.username)
                      ? `
                  <span class="comment-delete">
                    <span>${scratchMessage("comments.delete")}</span>
                  </span>`
                      : ""
                  }
                  ${
                    canReport(commentData.author.username)
                      ? `
                  <span class="comment-report">
                   <span>${scratchMessage("general.report")}</span>
                  </span>`
                      : ""
                  }
                </div>
              </div>
              <div class="comment-bubble">
                <span class="comment-content">
                  <span class="emoji-text">${addLinks(commentData.content)}</span>
                </span>
                <div class="flex-row comment-bottom-row">
                  <span class="comment-time">
                    <span>${getRelativeTime(new Date(commentData.datetime_created), currentTime)}</span>
                  </span>
                  <span class="comment-reply">
                    <span>${scratchMessage("comments.reply")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>`;
              if (comment.querySelector("span.comment-delete")) {
                comment.querySelector("span.comment-delete").addEventListener("click", () => {
                  openModal("delete", commentData.id);
                });
              }

              if (comment.querySelector("span.comment-report")) {
                comment.querySelector("span.comment-report").addEventListener("click", () => {
                  openModal("report", commentData.id);
                });
              }

              comment.querySelector("span.comment-reply").addEventListener("click", () => {
                openReplyBox(commentData.id);
              });

              (
                document.querySelector(".flex-row.comments-list") ||
                document.querySelector(".studio-compose-container").children[1]
              ).insertBefore(comment, topComment);
              newComments[commentData.id] = commentData.datetime_created;
            } else {
              comment = document.getElementById(`comments-${commentData.id}`).parentNode;
            }

            fetch(`${COMMENTS_API_URL}/${commentData.id}/replies`)
              .then((resp) => resp.json())
              .then((repliesData) => {
                const replyUsernames = {};

                replyUsernames[commentData.author.id] = commentData.author.username;
                for (const replyData of repliesData) replyUsernames[replyData.author.id] = replyData.author.username;

                for (const replyData of repliesData) {
                  if (
                    !document
                      .getElementById(`comments-${commentData.id}`)
                      .parentNode.querySelector(".flex-row.replies.column")
                  ) {
                    const replyColumn = document.createElement("div");

                    replyColumn.classList.add("flex-row", "replies", "column");
                    comment.appendChild(replyColumn);
                  }
                  if (
                    !document.getElementById(`comments-${replyData.id}`) &&
                    comment.querySelectorAll(".flex-row.comment").length < 4
                  )
                    addReply(comment, commentData, replyData, replyUsernames, repliesData);
                }
              });
            if (commentData.id === parseInt(bottomComment.id.slice(9), 10)) {
              rows = 0;
              break;
            }
          }
        });
    }
  }

  // update the relative time below comments
  setInterval(() => {
    currentTime = Date.now();
    for (const [id, commentTime] of Object.entries(newComments))
      document.getElementById(`comments-${id}`).querySelector(".comment-time").childNodes[1].textContent =
        getRelativeTime(new Date(commentTime), currentTime);
  }, 10000);

  // refresh comments every second
  setInterval(refreshComments, 1000);
};
