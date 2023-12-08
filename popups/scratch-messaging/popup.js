import { escapeHTML } from "../../libraries/common/cs/autoescaper.js";
import * as MessageCache from "../../libraries/common/message-cache.js";
import * as API from "./api.js";
import fixCommentContent from "./fix-comment-content.js";

const parser = new DOMParser();

const errorCodes = {
  isEmpty: "comment-error-empty",
  // Two errors can be raised for rate limit;
  // isFlood is the actual error, 429 is the status code
  // ratelimit error will be unnecessary when #2505 is implemented
  isFlood: "comment-error-ratelimit",
  429: "comment-error-ratelimit",
  isBad: "comment-error-filterbot-generic",
  hasChatSite: "comment-error-filterbot-chat",
  isSpam: "comment-error-filterbot-spam",
  replyLimitReached: "comment-error-reply-limit",
  // isDisallowed, isIPMuted, isTooLong, isNotPermitted use default error
  500: "comment-error-down",
  503: "comment-error-down",
};

export default async ({ addon, msg, safeMsg }) => {
  let dateNow = Date.now();

  // <dom-element-renderer> component
  // This component renders an element.
  // Inspired by DOMElementRenderer in scratch-gui
  const DOMElementRenderer = Vue.extend({
    template: document.querySelector("template#dom-element-renderer-component").innerHTML,
    props: ["element"],
    compiled() {
      this.$el.appendChild(this.element);
    },
    beforeDestroy() {
      this.$el.removeChild(this.element);
    },
    watch: {
      element(newElement, oldElement) {
        oldElement.replaceWith(newElement);
      },
    },
  });
  Vue.component("dom-element-renderer", DOMElementRenderer);

  // <comment> component
  const Comment = Vue.extend({
    template: document.querySelector("template#comment-component").innerHTML,
    props: ["comment-id", "comments-obj", "is-parent", "unread", "resource-type", "resource-id"],
    data() {
      return {
        replying: false,
        replyBoxValue: "",
        deleted: false,
        deleting: false,
        deleteStep: 0,
        postingComment: false,
        messages: {
          openNewTabMsg: msg("open-new-tab"),
          deleteMsg: msg("delete"),
          deleteConfirmMsg: msg("delete-confirm"),
          replyMsg: msg("reply"),
          postingMsg: msg("posting"),
          postMsg: msg("post"),
          cancelMsg: msg("cancel"),
          deletedMsg: msg("deleted"),
          deletingMsg: msg("deleting"),
        },
      };
    },
    methods: {
      postComment() {
        const removeReiteratedChars = (string) =>
          string
            .split("")
            .filter((char, i, charArr) => (i === 0 ? true : charArr[i - 1] !== char))
            .join("");
        const shouldCaptureComment = (value) => {
          // From content-scripts/cs.js
          const trimmedValue = value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""); // Trim like scratchr2
          const limitedValue = removeReiteratedChars(trimmedValue.toLowerCase().replace(/[^a-z]+/g, ""));
          const regex = /scratchadons/;
          return regex.test(limitedValue);
        };
        if (shouldCaptureComment(this.replyBoxValue)) {
          alert(chrome.i18n.getMessage("captureCommentError", [chrome.i18n.getMessage("captureCommentPolicy")]));
          return;
        }
        this.postingComment = true;
        const parent_pseudo_id = this.isParent ? this.commentId : this.thisComment.childOf;
        const parent_id = Number(parent_pseudo_id.substring(2));
        Promise.all([
          addon.auth.fetchUsername(),
          addon.auth.fetchUserId(),
          API.sendComment(addon, {
            resourceType: this.resourceType,
            resourceId: this.resourceId,
            content: this.replyBoxValue,
            parentId: parent_id,
            commenteeId: this.thisComment.authorId,
          }),
          addon.self.getEnabledAddons(),
        ])
          .then(([username, userId, { id, content }, enabledAddons]) => {
            this.replying = false;
            let domContent = fixCommentContent(content, enabledAddons);
            if (this.resourceType !== "user") {
              // We need to append the replyee ourselves
              const newElement = document.createElement("div");
              newElement.append(
                Object.assign(document.createElement("a"), {
                  href: `https://scratch.mit.edu/users/${this.thisComment.author}`,
                  textContent: "@" + this.thisComment.author,
                })
              );
              newElement.append(" ");
              newElement.append(...domContent.childNodes);
              domContent = newElement;
            }
            const newCommentPseudoId = `${this.resourceType[0]}_${id}`;
            Vue.set(this.commentsObj, newCommentPseudoId, {
              author: username,
              authorId: userId,
              content: domContent,
              date: new Date().toISOString(),
              children: null,
              childOf: parent_pseudo_id,
              projectAuthor: this.thisComment.projectAuthor,
            });
            this.commentsObj[parent_pseudo_id].children.push(newCommentPseudoId);
            this.replyBoxValue = "";
          })
          .catch((e) => {
            // Error comes from sendComment
            let errorMsg;
            if (e instanceof API.DetailedError) {
              if (e.details.muteStatus) {
                errorMsg = msg("comment-mute") + " ";
                errorMsg += msg("comment-cannot-post-for", {
                  mins: Math.max(Math.ceil((e.details.muteStatus.muteExpiresAt - Date.now() / 1000) / 60), 1),
                });
              } else {
                errorMsg = msg(errorCodes[e.details?.error] || "send-error");
              }
            } else if (e instanceof API.HTTPError) {
              errorMsg = msg(errorCodes[e.code] || "send-error");
            } else {
              errorMsg = e.toString();
            }
            alert(errorMsg);
          })
          .finally(() => {
            this.postingComment = false;
          });
      },
      deleteComment() {
        if (this.deleteStep === 0) {
          setTimeout(() => (this.deleteStep = 1), 250);
          setTimeout(() => {
            if (this.deleteStep === 1) this.deleteStep = 0;
          }, 5000);
          return;
        }
        this.deleted = true;
        this.deleting = true;
        API.deleteComment(addon, {
          resourceType: this.resourceType,
          resourceId: this.resourceId,
          commentId: Number(this.commentId.substring(2)),
        })
          .then(() => {
            if (this.isParent) this.thisComment.children = [];
          })
          .catch((e) => {
            console.error("Error while deleting a comment: ", e);
            alert(msg("delete-error"));
            this.deleteStep = 0;
            this.deleted = false;
          })
          .finally(() => {
            this.deleting = false;
          });
      },
    },
    computed: {
      canDeleteComment() {
        switch (this.resourceType) {
          case "user":
            return this.resourceId === this.username;
          case "project":
            return this.thisComment.projectAuthor === this.username;
          default:
            return true; // Studio comment deletion is complex, just assume we can
        }
      },
      thisComment() {
        return this.commentsObj[this.commentId];
      },
      replyBoxLeftMsg() {
        return msg("chars-left", { num: 500 - this.replyBoxValue.length });
      },
      username() {
        return vue.username;
      },
      commentTimeAgo() {
        const timeFormatter = new Intl.RelativeTimeFormat(msg.locale, {
          localeMatcher: "best fit",
          numeric: "auto",
          style: "short",
        });
        const commentTimestamp = new Date(this.thisComment.date).getTime();
        const timeDiffSeconds = (dateNow - commentTimestamp) / 1000;
        let options;
        if (timeDiffSeconds < 60) return timeFormatter.format(0, "second");
        else if (timeDiffSeconds < 3600) options = { unit: "minute", divideBy: 60 };
        else if (timeDiffSeconds < 86400) options = { unit: "hour", divideBy: 60 * 60 };
        else options = { unit: "day", divideBy: 60 * 60 * 24 };
        return timeFormatter.format(-Math.round(timeDiffSeconds / options.divideBy), options.unit);
      },
      commentURL() {
        const urlPath =
          this.resourceType === "user" ? "users" : this.resourceType === "gallery" ? "studios" : "projects";
        const commentPath = this.resourceType === "gallery" ? "comments/" : "";
        return `https://scratch.mit.edu/${urlPath}/${
          this.resourceId
        }/${commentPath}#comments-${this.commentId.substring(2)}`;
      },
    },
    watch: {
      replying(newVal) {
        if (newVal === true) this.$el.querySelector("textarea").focus();
      },
    },
  });
  Vue.component("comment", Comment);

  const vue = new Vue({
    el: "body",
    data: {
      stMessages: [],
      messages: [],
      comments: {},
      error: "notReady",
      hasCustomError: false,

      username: null,
      msgCount: null,

      messagesReady: false,
      commentsReady: false,
      commentsProgress: 0,
      showAllMessages: false,
      showingMessagesAmt: null,
      markedAsRead: false,

      follows: [],
      studioInvites: [],
      studioPromotions: [],
      studioHostTransfers: [],
      forumActivity: [],
      studioActivity: [],
      remixes: [],
      profiles: [],
      studios: [],
      projects: [],

      // For UI
      messageTypeExtended: {
        stMessages: false,
        follows: false,
        studioInvites: false,
        studioPromotions: false,
        studioHostTransfers: false,
        forumActivity: false,
        studioActivity: false,
        remixes: false,
      },

      uiMessages: {
        stMessagesMsg: msg("stMessages"),
        followsMsg: msg("follows"),
        studioInvitesMsg: msg("studio-invites"),
        forumMsg: msg("forum"),
        studioActivityMsg: msg("studio-activity"),
        remixesMsg: msg("remixes"),
        yourProfileMsg: msg("your-profile"),
        loadingMsg: msg("loading"),
        loggedOutMsg: msg("logged-out"),
        loggedOutLinkMsg: msg("logged-out-link"),
        serverErrorMsg: msg("server-error"),
        networkErrorMsg: msg("network-error"),
        unknownFatalErrorMsg: msg("unknown-fatal-error"),
        reportBugMsg: msg("report-bug"),
        copyMsg: msg("copy"),
        loadingCommentsMsg: msg("loading-comments"),
        reloadMsg: msg("reload"),
        dismissMsg: msg("dismiss"),
        noUnreadMsg: msg("no-unread"),
        showMoreMsg: msg("show-more"),
        markAsReadMsg: msg("mark-as-read"),
        markedAsReadMsg: msg("marked-as-read"),
        openMessagesMsg: msg("open-messages"),
        studioPromotionsMsg: msg("studio-promotions"),
        studioHostTransfersMsg: msg("studio-host-transfers"),
      },
    },
    watch: {
      showAllMessages(newVal) {
        this.commentsReady = false;
        this.commentsProgress = 0;
        this.follows = [];
        this.studioInvites = [];
        this.studioPromotions = [];
        this.studioHostTransfers = [];
        this.forumActivity = [];
        this.studioActivity = [];
        this.remixes = [];
        this.profiles = [];
        this.studios = [];
        this.projects = [];
        this.analyzeMessages(newVal);
      },
    },
    computed: {
      feedbackUrl() {
        const manifest = chrome.runtime.getManifest();
        return `https://scratchaddons.com/feedback/?ext_version=${manifest.version_name}&utm_source=extension&utm_medium=messagingcrash&utm_campaign=v${manifest.version}`;
      },
      profilesOrdered() {
        // Own profile first, then others
        return [
          ...this.profiles.filter((profile) => profile.username === this.username),
          ...this.profiles.filter((profile) => profile.username !== this.username),
        ];
      },
      projectsOrdered() {
        // Projects with comments first, then others
        return [
          ...this.projects.filter((proj) => proj.unreadComments !== 0),
          ...this.projects.filter((proj) => proj.unreadComments === 0),
        ];
      },
      canShowMoreMessages() {
        return (
          this.messagesReady &&
          this.commentsReady &&
          !this.error &&
          this.showAllMessages === false &&
          this.messages.length > this.showingMessagesAmt
        );
      },
    },
    created() {
      document.title = msg("popup-title");
      (async () => {
        let fetched = await this.getData();
        if (fetched) this.analyzeMessages();
      })();
    },
    methods: {
      getData() {
        return Promise.all([addon.auth.fetchUsername(), addon.auth.fetchXToken()])
          .then(([username, xToken]) => {
            if (scratchAddons.cookieFetchingFailed) throw new TypeError("NetworkError");
            if (!username) throw new MessageCache.HTTPError("Not logged in", 401);
            this.username = username;
            return Promise.all([
              MessageCache.updateMessages(scratchAddons.cookieStoreId, false, username, xToken),
              API.fetchAlerts(addon),
            ]);
          })
          .then(async ([newMessages, alerts]) => {
            chrome.runtime.sendMessage({
              forceBadgeUpdate: { store: scratchAddons.cookieStoreId },
              notifyNewMessages: { store: scratchAddons.cookieStoreId, messages: newMessages },
            });
            const db = await MessageCache.openDatabase();
            try {
              this.messages = await db.get("cache", scratchAddons.cookieStoreId);
              this.msgCount = await db.get("count", scratchAddons.cookieStoreId);
            } finally {
              await db.close();
            }
            this.stMessages = (Array.isArray(alerts) ? alerts : []).map((alert) => {
              const element = parser.parseFromString(alert.message, "text/html");
              for (const link of element.getElementsByTagName("a")) {
                link.href = new URL(link.getAttribute("href"), "https://scratch.mit.edu/").toString();
              }
              const wrapped = document.createElement("div");
              wrapped.append(...element.body.childNodes);
              return {
                ...alert,
                element: wrapped,
                datetime_created: new Date(alert.datetime_created).toDateString(),
              };
            });
            this.error = undefined;
            return true;
          })
          .catch((e) => {
            if (e instanceof MessageCache.HTTPError) {
              if (e.code === 401 || e.code === 403) {
                this.error = "loggedOut";
                return false;
              } else if (e.code >= 500) {
                this.error = "serverError";
                return false;
              }
            } else if (e instanceof TypeError && String(e).includes("NetworkError")) {
              this.error = "networkError";
              return false;
            }
            console.error("Error while initial getData", e);
            this.hasCustomError = true;
            this.error = String(e);
            return false;
          });
      },

      async updateMessageCount(bypassCache = false) {
        const username = await addon.auth.fetchUsername();
        const msgCountData = await MessageCache.fetchMessageCount(username, { bypassCache });
        const count = await MessageCache.getUpToDateMsgCount(scratchAddons.cookieStoreId, msgCountData);

        const db = await MessageCache.openDatabase();
        try {
          // We obtained the up-to-date message count, so we can safely override the cached count in IDB.
          await db.put("count", count, scratchAddons.cookieStoreId);

          if (!bypassCache && msgCountData.resId && !(db instanceof MessageCache.IncognitoDatabase)) {
            // Note: as of Oct 2023, this method is never called with bypassCache:false, so this never happens
            await db.put("count", msgCountData.resId, `${scratchAddons.cookieStoreId}_resId`);
          }
        } finally {
          await db.close();
        }

        chrome.runtime.sendMessage({
          forceBadgeUpdate: { store: scratchAddons.cookieStoreId },
        });
      },

      // For UI
      markAsRead() {
        MessageCache.markAsRead(addon.auth.csrfToken)
          .then(() => this.updateMessageCount(true))
          .then(() => {
            this.markedAsRead = true;
          })
          .catch((e) => console.error("Marking messages as read failed:", e));
      },
      dismissAlert(id) {
        const confirmation = confirm(msg("stMessagesConfirm"));
        if (!confirmation) return;
        API.dismissAlert(addon, id)
          .then(() => {
            this.stMessages.splice(
              this.stMessages.findIndex((alert) => alert.id === id),
              1
            );
            this.updateMessageCount(true);
          })
          .catch((e) => console.error("Dismissing alert failed:", e));
      },
      reloadPage() {
        location.reload();
      },
      copyToClipboard(message) {
        navigator.clipboard.writeText(message);
      },

      // Objects
      getProjectObject(projectId, title) {
        const search = this.projects.find((obj) => obj.id === projectId);
        if (search) return search;
        const obj = {
          id: projectId,
          title,
          unreadComments: 0,
          commentChains: [],
          loveCount: 0,
          favoriteCount: 0,
          loversAndFavers: [],
          loadedComments: false,
        };
        this.projects.push(obj);
        return obj;
      },
      getProfileObject(username) {
        const search = this.profiles.find((obj) => obj.username === username);
        if (search) return search;
        const obj = {
          username,
          unreadComments: 0,
          commentChains: [],
          loadedComments: false,
        };
        this.profiles.push(obj);
        return obj;
      },
      getStudioObject(studioId, title) {
        const search = this.studios.find((obj) => obj.id === studioId);
        if (search) return search;
        const obj = {
          id: studioId,
          title,
          unreadComments: 0,
          commentChains: [],
          loadedComments: false,
        };
        this.studios.push(obj);
        return obj;
      },

      // Comments
      isCommentUnread: function (commentId) {
        const realCommentId = Number(commentId.substring(2));
        const messageIndex = this.messages.findIndex((msg) => msg.comment_id === realCommentId);
        if (messageIndex === -1) return false;
        else if (messageIndex < this.msgCount) {
          if (this.comments[commentId].childOf) {
            if (this.isCommentUnread(this.comments[commentId].childOf)) return false;
            else return true;
          } else return true;
        } else return false;
      },
      checkCommentLocation(resourceType, resourceId, commentIds, elementObject) {
        return Promise.all([
          API.fetchComments(addon, {
            resourceType,
            resourceId,
            commentIds,
          }),
          addon.self.getEnabledAddons(),
        ])
          .then(([comments, enabledAddons]) => {
            if (Object.keys(comments).length === 0) elementObject.unreadComments = 0;
            for (const commentId of Object.keys(comments)) {
              const commentObject = comments[commentId];
              let domContent = fixCommentContent(commentObject.content, enabledAddons);
              if (this.resourceType !== "user") {
                // Re-wrap elements from <body> to <div>
                const newElement = document.createElement("div");
                if (commentObject.replyingTo) {
                  // We need to append the replyee ourselves
                  newElement.append(
                    Object.assign(document.createElement("a"), {
                      href: `https://scratch.mit.edu/users/${commentObject.replyingTo}`,
                      textContent: "@" + commentObject.replyingTo,
                    })
                  );
                  newElement.append(" ");
                }
                newElement.append(...domContent.childNodes);
                domContent = newElement;
              }
              commentObject.content = domContent;
              Vue.set(this.comments, commentId, commentObject);
            }

            // Preserve chronological sort when using JSON API
            const parentComments = Object.entries(comments).filter((c) => c[1].childOf === null);
            const sortedParentComments = parentComments.sort((a, b) => new Date(b[1].date) - new Date(a[1].date));
            const sortedIds = sortedParentComments.map((arr) => arr[0]);
            const resourceGetFunction =
              resourceType === "project"
                ? "getProjectObject"
                : resourceType === "user"
                  ? "getProfileObject"
                  : "getStudioObject";
            const resourceObject = this[resourceGetFunction](resourceId);
            for (const sortedId of sortedIds) resourceObject.commentChains.push(sortedId);

            elementObject.loadedComments = true;
          })
          .catch((e) => {
            if (e instanceof API.HTTPError && e.code > 400) {
              this.error = e.code < 500 ? "loggedOut" : "serverError";
              return;
            } else if (String(e).includes("NetworkError")) {
              this.error = "networkError";
              return;
            }
            console.error(e);
            this.error = String(e);
            this.hasCustomError = true;
          });
      },

      async analyzeMessages(showAll = false) {
        const commentLocations = {
          0: [], // Projects
          1: [], // Profiles
          2: [], // Studios
        };
        let realMsgCount = this.msgCount - this.stMessages.length;
        const messagesToCheck = showAll ? this.messages.length : realMsgCount;
        this.showingMessagesAmt = messagesToCheck;
        for (const message of this.messages.slice(0, messagesToCheck)) {
          if (message.type === "followuser") {
            this.follows.push(message.actor_username);
          } else if (message.type === "curatorinvite") {
            this.studioInvites.push({
              actor: message.actor_username,
              studioId: message.gallery_id,
              studioTitle: message.title,
            });
          } else if (message.type === "becomeownerstudio") {
            this.studioPromotions.push({
              actor: message.actor_username,
              studioId: message.gallery_id,
              studioTitle: message.gallery_title,
            });
          } else if (message.type === "becomehoststudio") {
            this.studioHostTransfers.push({
              actorAdmin: message.admin_actor,
              actor: message.actor_username,
              studioId: message.gallery_id,
              studioTitle: message.gallery_title,
            });
          } else if (message.type === "forumpost") {
            // We only want one message per forum topic
            if (!this.forumActivity.find((obj) => obj.topicId === message.topic_id)) {
              this.forumActivity.push({
                topicId: message.topic_id,
                topicTitle: message.topic_title,
              });
            }
          } else if (message.type === "remixproject") {
            this.remixes.push({
              parentTitle: message.parent_title,
              remixTitle: message.title,
              actor: message.actor_username,
              projectId: message.project_id,
            });
          } else if (message.type === "studioactivity") {
            // We only want one message per studio
            if (!this.studioActivity.find((obj) => obj.studioId === message.gallery_id)) {
              this.studioActivity.push({
                studioId: message.gallery_id,
                studioTitle: message.title,
              });
            }
          } else if (message.type === "loveproject") {
            const projectObject = this.getProjectObject(message.project_id, message.title);
            projectObject.loveCount++;
            const findLover = projectObject.loversAndFavers.find((obj) => obj.username === message.actor_username);
            if (findLover) findLover.loved = true;
            else projectObject.loversAndFavers.push({ username: message.actor_username, loved: true, faved: false });
          } else if (message.type === "favoriteproject") {
            const projectObject = this.getProjectObject(message.project_id, message.project_title);
            projectObject.favoriteCount++;
            const findFaver = projectObject.loversAndFavers.find((obj) => obj.username === message.actor_username);
            if (findFaver) findFaver.faved = true;
            else projectObject.loversAndFavers.push({ username: message.actor_username, loved: false, faved: true });
          } else if (message.type === "addcomment") {
            const resourceId = message.comment_type === 1 ? message.comment_obj_title : message.comment_obj_id;
            let location = commentLocations[message.comment_type].find((obj) => obj.resourceId === resourceId);
            if (!location) {
              location = { resourceId, commentIds: [] };
              commentLocations[message.comment_type].push(location);
            }
            location.commentIds.push(message.comment_id);
            let resourceObject;
            if (message.comment_type === 0)
              resourceObject = this.getProjectObject(resourceId, message.comment_obj_title);
            else if (message.comment_type === 1) resourceObject = this.getProfileObject(resourceId);
            else if (message.comment_type === 2)
              resourceObject = this.getStudioObject(resourceId, message.comment_obj_title);
            resourceObject.unreadComments++;
          }
        }
        this.messagesReady = true;

        const locationsToCheckAmt =
          commentLocations[0].length + commentLocations[1].length + commentLocations[2].length;
        let locationsChecked = 0;
        for (const profile of this.profilesOrdered) {
          const location = commentLocations[1].find((obj) => obj.resourceId === profile.username);
          if (location) {
            await this.checkCommentLocation("user", location.resourceId, location.commentIds, profile);
            locationsChecked++;
            this.commentsProgress = Math.round((locationsChecked / locationsToCheckAmt) * 100);
          }
        }
        for (const studio of this.studios) {
          const location = commentLocations[2].find((obj) => obj.resourceId === studio.id);
          if (location) {
            await this.checkCommentLocation("gallery", location.resourceId, location.commentIds, studio);
            locationsChecked++;
            this.commentsProgress = Math.round((locationsChecked / locationsToCheckAmt) * 100);
          }
        }
        for (const project of this.projectsOrdered) {
          const location = commentLocations[0].find((obj) => obj.resourceId === project.id);
          if (location) {
            await this.checkCommentLocation("project", location.resourceId, location.commentIds, project);
            locationsChecked++;
            this.commentsProgress = Math.round((locationsChecked / locationsToCheckAmt) * 100);
          }
        }
        this.commentsReady = true;
      },
      studioInviteHTML(invite) {
        const actor = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/users/${invite.actor}/"
        >${invite.actor}</a>`;
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/studios/${invite.studioId}/curators/"
            style="text-decoration: underline"
        >${escapeHTML(invite.studioTitle)}</a>`;
        return safeMsg("curate-invite", { actor, title });
      },
      studioPromotionHTML(promotion) {
        const actor = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/users/${promotion.actor}/"
        >${promotion.actor}</a>`;
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/studios/${promotion.studioId}/curators/"
            style="text-decoration: underline"
        >${escapeHTML(promotion.studioTitle)}</a>`;
        return safeMsg("studio-promotion", { actor, title });
      },
      studioHostTransferHTML(promotion) {
        const actor = promotion.actorAdmin
          ? safeMsg("st")
          : `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/users/${escapeHTML(promotion.actor)}/"
        >${escapeHTML(promotion.actor)}</a>`;
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/studios/${promotion.studioId}/"
            style="text-decoration: underline"
        >${escapeHTML(promotion.studioTitle)}</a>`;
        return safeMsg("studio-host-transfer", { actor, title });
      },
      forumHTML(forumTopic) {
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/discuss/topic/${forumTopic.topicId}/unread/"
            style="text-decoration: underline"
        >${escapeHTML(forumTopic.topicTitle)}</a>`;
        return safeMsg("forum-new-post", { title });
      },
      studioActivityHTML(studio) {
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/studios/${studio.studioId}/activity/"
            style="text-decoration: underline"
        >${escapeHTML(studio.studioTitle)}</a>`;
        return safeMsg("new-activity", { title });
      },
      remixHTML(remix) {
        const actor = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/users/${remix.actor}/"
        >${remix.actor}</a>`;
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/projects/${remix.projectId}/"
            style="text-decoration: underline"
        >${escapeHTML(remix.remixTitle)}</a>`;
        return safeMsg("remix-as", {
          actor,
          title,
          parentTitle: escapeHTML(remix.parentTitle),
        });
      },
      othersProfile(username) {
        return msg("others-profile", { username });
      },
      studioText(title) {
        return msg("studio", { title });
      },
      projectLoversAndFavers(project) {
        // First lovers&favers, then favers-only, then lovers only. Lower is better
        const priorityOf = (obj) => (obj.loved && obj.faved ? 0 : obj.faved ? 1 : 2);
        return project.loversAndFavers.slice(0, 20).sort((a, b) => {
          const priorityA = priorityOf(a);
          const priorityB = priorityOf(b);
          if (priorityA > priorityB) return 1;
          else if (priorityB > priorityA) return -1;
          else return 0;
        });
      },
    },
  });
};
