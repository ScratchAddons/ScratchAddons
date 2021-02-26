import WebsiteLocalizationProvider from "../../libraries/website-l10n.js";
import { escapeHTML } from "../../libraries/autoescaper.js";

(async () => {
  if (window.parent === window) {
    // We're not in popup mode!
    document.body.classList.add("fullscreen");
    document.documentElement.classList.add("fullscreen");
  }

  const l10n = new WebsiteLocalizationProvider();

  //theme
  const lightThemeLink = document.createElement("link");
  lightThemeLink.setAttribute("rel", "stylesheet");
  lightThemeLink.setAttribute("href", "light.css");

  chrome.storage.sync.get(["globalTheme"], function (r) {
    let rr = false; //true = light, false = dark
    if (r.globalTheme) rr = r.globalTheme;
    if (rr) {
      document.head.appendChild(lightThemeLink);
    }
  });

  await l10n.loadByAddonId("scratch-messaging");

  let dateNow = Date.now();

  // <comment> component
  const Comment = Vue.extend({
    template: document.querySelector("template#comment-component").innerHTML,
    props: ["comment-id", "comments-obj", "is-parent", "unread", "resource-type", "resource-id"],
    data() {
      return {
        replying: false,
        replyBoxValue: "",
        deleted: false,
        deleteStep: 0,
        postingComment: false,
        messages: {
          openNewTabMsg: l10n.get("scratch-messaging/open-new-tab"),
          deleteMsg: l10n.get("scratch-messaging/delete"),
          deleteConfirmMsg: l10n.get("scratch-messaging/delete-confirm"),
          replyMsg: l10n.get("scratch-messaging/reply"),
          postingMsg: l10n.get("scratch-messaging/posting"),
          postMsg: l10n.get("scratch-messaging/post"),
          cancelMsg: l10n.get("scratch-messaging/cancel"),
        },
      };
    },
    methods: {
      openProfile: (username) => window.open(`https://scratch.mit.edu/users/${username}/`),
      openComment() {
        const urlPath =
          this.resourceType === "user" ? "users" : this.resourceType === "gallery" ? "studios" : "projects";
        const commentPath = this.resourceType === "gallery" ? "comments/" : "";
        const url = `https://scratch.mit.edu/${urlPath}/${
          this.resourceId
        }/${commentPath}#comments-${this.commentId.substring(2)}`;
        window.open(url);
      },
      postComment() {
        this.postingComment = true;
        const parent_pseudo_id = this.isParent ? this.commentId : this.thisComment.childOf;
        const parent_id = Number(parent_pseudo_id.substring(2));
        chrome.runtime.sendMessage(
          {
            scratchMessaging: {
              postComment: {
                resourceType: this.resourceType,
                resourceId: this.resourceId,
                content: this.replyBoxValue,
                parent_id,
                commentee_id: this.thisComment.authorId,
              },
            },
          },
          (res) => {
            this.postingComment = false;
            dateNow = Date.now();
            if (res.error) alert(l10n.get("scratch-messaging/send-error"));
            else {
              this.replying = false;
              const newCommentPseudoId = `${this.resourceType[0]}_${res.commentId}`;
              Vue.set(this.commentsObj, newCommentPseudoId, {
                author: res.username,
                authorId: res.userId,
                content: res.content,
                date: new Date().toISOString(),
                children: null,
                childOf: parent_pseudo_id,
              });
              this.commentsObj[parent_pseudo_id].children.push(newCommentPseudoId);
              this.replyBoxValue = "";
            }
          }
        );
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
        const previousContent = this.thisComment.content;
        this.thisComment.content = l10n.escaped("scratch-messaging/deleting");
        chrome.runtime.sendMessage(
          {
            scratchMessaging: {
              deleteComment: {
                resourceType: this.resourceType,
                resourceId: this.resourceId,
                commentId: Number(this.commentId.substring(2)),
              },
            },
          },
          (res) => {
            if (res.error) {
              alert(l10n.get("scratch-messaging/delete-error"));
              this.thisComment.content = previousContent;
              this.deleteStep = 0;
              this.deleted = false;
            } else {
              if (this.isParent) this.thisComment.children = [];
              this.thisComment.content = l10n.escaped("scratch-messaging/deleted");
            }
          }
        );
      },
    },
    computed: {
      thisComment() {
        return this.commentsObj[this.commentId];
      },
      replyBoxLeftMsg() {
        return l10n.get("scratch-messaging/chars-left", { num: 500 - this.replyBoxValue.length });
      },
      username() {
        return vue.username;
      },
      commentTimeAgo() {
        const timeFormatter = new Intl.RelativeTimeFormat("en", {
          localeMatcher: "best fit",
          numeric: "auto",
          style: "short",
        });
        const commentTimestamp = new Date(this.thisComment.date).getTime();
        const timeDiffSeconds = (dateNow - commentTimestamp) / 1000;
        let options = { unit: null, divideBy: null };
        if (timeDiffSeconds < 60) return timeFormatter.format(0, "second");
        else if (timeDiffSeconds < 3600) options = { unit: "minute", divideBy: 60 };
        else if (timeDiffSeconds < 86400) options = { unit: "hour", divideBy: 60 * 60 };
        else options = { unit: "day", divideBy: 60 * 60 * 24 };
        return timeFormatter.format(-Math.round(timeDiffSeconds / options.divideBy), options.unit);
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
      mounted: true, // Always true

      messages: [],
      comments: {},
      error: null,

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
      forumActivity: [],
      studioActivity: [],
      remixes: [],
      profiles: [],
      studios: [],
      projects: [],

      // For UI
      messageTypeExtended: {
        follows: false,
        studioInvites: false,
        studioPromotions: false,
        forumActivity: false,
        studioActivity: false,
        remixes: false,
      },

      uiMessages: {
        followsMsg: l10n.get("scratch-messaging/follows"),
        studioInvitesMsg: l10n.get("scratch-messaging/studio-invites"),
        forumMsg: l10n.get("scratch-messaging/forum"),
        studioActivityMsg: l10n.get("scratch-messaging/studio-activity"),
        remixesMsg: l10n.get("scratch-messaging/remixes"),
        yourProfileMsg: l10n.get("scratch-messaging/your-profile"),
        loadingMsg: l10n.get("scratch-messaging/loading"),
        loggedOutMsg: l10n.get("scratch-messaging/logged-out"),
        loadingCommentsMsg: l10n.get("scratch-messaging/loading-comments"),
        reloadMsg: l10n.get("scratch-messaging/reload"),
        noUnreadMsg: l10n.get("scratch-messaging/no-unread"),
        showMoreMsg: l10n.get("scratch-messaging/show-more"),
        markAsReadMsg: l10n.get("scratch-messaging/mark-as-read"),
        markedAsReadMsg: l10n.get("scratch-messaging/marked-as-read"),
        openMessagesMsg: l10n.get("scratch-messaging/open-messages"),
        studioPromotionsMsg: l10n.get("scratch-messaging/studio-promotions"),
      },
    },
    watch: {
      showAllMessages(newVal) {
        this.commentsReady = false;
        this.commentsProgress = 0;
        this.follows = [];
        this.studioInvites = [];
        this.studioPromotions = [];
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
          this.showAllMessages === false &&
          this.messages.length > this.showingMessagesAmt
        );
      },
    },
    created() {
      document.title = l10n.get("scratch-messaging/popup-title");
      (async () => {
        let fetched = await this.getData();
        if (fetched) this.analyzeMessages();
        else {
          const interval = setInterval(async () => {
            fetched = await this.getData();
            if (fetched) {
              clearInterval(interval);
              this.analyzeMessages();
            }
          }, 500);
        }
      })();
    },
    methods: {
      getData() {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            this.error = "addonDisabled";
            resolve(undefined);
          }, 500);
          chrome.runtime.sendMessage({ scratchMessaging: "getData" }, (res) => {
            if (res) {
              clearTimeout(timeout);
              this.messages = res.messages;
              this.msgCount = res.lastMsgCount;
              this.username = res.username;
              this.error = res.error;
              resolve(res.error ? false : true);
            }
          });
        });
      },

      // For UI
      markAsRead() {
        chrome.runtime.sendMessage({ scratchMessaging: "markAsRead" });
        this.markedAsRead = true;
      },
      reloadPage() {
        location.reload();
      },
      openProfile: (username) => window.open(`https://scratch.mit.edu/users/${username}/`),
      openProject: (projectId) => window.open(`https://scratch.mit.edu/projects/${projectId}/`),
      openStudio: (studioId, tab = "") => window.open(`https://scratch.mit.edu/studios/${studioId}/${tab}`),
      openUnreadPostsForums: (topicId) => window.open(`https://scratch.mit.edu/discuss/topic/${topicId}/unread/`),

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
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              scratchMessaging: {
                retrieveComments: {
                  resourceType,
                  resourceId,
                  commentIds: commentIds,
                },
              },
            },
            (comments) => {
              if (Object.keys(comments).length === 0) elementObject.unreadComments = 0;
              for (const commentId of Object.keys(comments)) {
                const commentObject = comments[commentId];
                Vue.set(this.comments, commentId, commentObject);
                const chainId = commentObject.childOf || commentId;
                const resourceGetFunction =
                  resourceType === "project"
                    ? "getProjectObject"
                    : resourceType === "user"
                    ? "getProfileObject"
                    : "getStudioObject";
                const resourceObject = this[resourceGetFunction](resourceId);
                if (!resourceObject.commentChains.includes(chainId)) resourceObject.commentChains.push(chainId);
              }
              elementObject.loadedComments = true;
              resolve();
            }
          );
        });
      },

      async analyzeMessages(showAll = false) {
        const commentLocations = {
          0: [], // Projects
          1: [], // Profiles
          2: [], // Studios
        };
        const messagesToCheck =
          this.msgCount > 40 ? this.messages.length : showAll ? this.messages.length : this.msgCount;
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
        return l10n.escaped("scratch-messaging/curate-invite", { actor, title });
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
        return l10n.escaped("scratch-messaging/studio-promotion", { actor, title });
      },
      forumHTML(forumTopic) {
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/discuss/topic/${forumTopic.topicId}/unread/"
            style="text-decoration: underline"
        >${escapeHTML(forumTopic.topicTitle)}</a>`;
        return l10n.escaped("scratch-messaging/forum-new-post", { title });
      },
      studioActivityHTML(studio) {
        const title = `<a target="_blank"
            rel="noopener noreferrer"
            href="https://scratch.mit.edu/studios/${studio.studioId}/activity/"
            style="text-decoration: underline"
        >${escapeHTML(studio.studioTitle)}</a>`;
        return l10n.escaped("scratch-messaging/new-activity", { title });
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
        return l10n.escaped("scratch-messaging/remix-as", {
          actor,
          title,
          parentTitle: escapeHTML(remix.parentTitle),
        });
      },
      othersProfile(username) {
        return l10n.get("scratch-messaging/others-profile", { username });
      },
      studioText(title) {
        return l10n.get("scratch-messaging/studio", { title });
      },
      projectLoversAndFavers(project) {
        // First lovers&favers, then favers-only, then lovers only. Lower is better
        const priorityOf = (obj) => (obj.loved && obj.faved ? 0 : obj.faved ? 1 : 2);
        let str = "";
        const arr = project.loversAndFavers.slice(0, 20).sort((a, b) => {
          const priorityA = priorityOf(a);
          const priorityB = priorityOf(b);
          if (priorityA > priorityB) return 1;
          else if (priorityB > priorityA) return -1;
          else return 0;
        });
        arr.forEach((obj, i) => {
          if (obj.loved) str += `<img class="small-icon colored" src="../../images/icons/heart.svg">`;
          if (obj.faved) str += `<img class="small-icon colored" src="../../images/icons/star.svg">`;
          str += " ";
          str += `<a href="https://scratch.mit.edu/users/${obj.username}/">${obj.username}</a>`;
          if (i !== arr.length - 1) str += "<br>";
        });
        return str;
      },
    },
  });
})();
