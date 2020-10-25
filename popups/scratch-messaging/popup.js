if (window.parent === window) {
  // We're not in popup mode!
  document.body.classList.add("fullscreen");
  document.documentElement.classList.add("fullscreen");
}

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
    };
  },
  methods: {
    openProfile: (username) => window.open(`https://scratch.mit.edu/users/${username}/`),
    openComment() {
      const urlPath = this.resourceType === "user" ? "users" : this.resourceType === "gallery" ? "studios" : "projects";
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
          if (res.error) alert("Error sending comment");
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
      this.thisComment.content = "Deleting comment...";
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
            alert("Error deleting comment - you might not have permission to do this.");
            this.thisComment.content = previousContent;
            this.deleteStep = 0;
            this.deleted = false;
          } else {
            if (this.isParent) this.thisComment.children = [];
            this.thisComment.content = "[deleted]";
          }
        }
      );
    },
  },
  computed: {
    thisComment() {
      return this.commentsObj[this.commentId];
    },
    lengthOfReplyBoxValue() {
      return this.replyBoxValue.length;
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
      forumActivity: false,
      studioActivity: false,
      remixes: false,
    },
  },
  watch: {
    showAllMessages(newVal) {
      this.commentsReady = false;
      this.commentsProgress = 0;
      this.follows = [];
      this.studioInvites = [];
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
        title: htmlToText(title),
        unreadComments: 0,
        commentChains: [],
        loves: 0,
        favorites: 0,
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
        title: htmlToText(title),
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
            for (const commentId in comments) {
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
      for (const indexString in this.messages.slice(0, messagesToCheck)) {
        const index = Number(indexString);
        const message = this.messages[index];
        if (message.type === "followuser") {
          this.follows.push(message.actor_username);
        } else if (message.type === "curatorinvite") {
          this.studioInvites.push({
            actor: message.actor_username,
            studioId: message.gallery_id,
            studioTitle: htmlToText(message.title),
          });
        } else if (message.type === "forumpost") {
          // We only want one message per forum topic
          if (!this.forumActivity.find((obj) => obj.topicId === message.topic_id)) {
            this.forumActivity.push({
              topicId: message.topic_id,
              topicTitle: htmlToText(message.topic_title),
            });
          }
        } else if (message.type === "remixproject") {
          this.remixes.push({
            parentTitle: htmlToText(message.parent_title),
            remixTitle: htmlToText(message.title),
            actor: message.actor_username,
            projectId: message.project_id,
          });
        } else if (message.type === "studioactivity") {
          // We only want one message per studio
          if (!this.studioActivity.find((obj) => obj.studioId === message.gallery_id)) {
            this.studioActivity.push({
              studioId: message.gallery_id,
              studioTitle: htmlToText(message.title),
            });
          }
        } else if (message.type === "loveproject") {
          this.getProjectObject(message.project_id, message.title).loves++;
        } else if (message.type === "favoriteproject") {
          this.getProjectObject(message.project_id, message.project_title).favorites++;
        } else if (message.type === "addcomment") {
          const resourceId = message.comment_type === 1 ? message.comment_obj_title : message.comment_obj_id;
          let location = commentLocations[message.comment_type].find((obj) => obj.resourceId === resourceId);
          if (!location) {
            location = { resourceId, commentIds: [] };
            commentLocations[message.comment_type].push(location);
          }
          location.commentIds.push(message.comment_id);
          let resourceObject;
          if (message.comment_type === 0) resourceObject = this.getProjectObject(resourceId, message.comment_obj_title);
          else if (message.comment_type === 1) resourceObject = this.getProfileObject(resourceId);
          else if (message.comment_type === 2)
            resourceObject = this.getStudioObject(resourceId, message.comment_obj_title);
          resourceObject.unreadComments++;
        }
      }
      this.messagesReady = true;

      const locationsToCheckAmt = commentLocations[0].length + commentLocations[1].length + commentLocations[2].length;
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
  },
});

function htmlToText(html) {
  if (html === undefined) return;
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
