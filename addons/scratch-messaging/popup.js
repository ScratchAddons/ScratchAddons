// <comment> component
const Comment = Vue.extend({
  template: document.querySelector("template#comment-component").innerHTML,
  props: ["comment-id", "comments-arr", "is-parent", "unread", "resource-type", "resource-id"],
  data() {
    return {
      replying: false,
      replyBoxValue: "",
    };
  },
  methods: {
    openProfile: (username) => window.open(`https://scratch.mit.edu/users/${username}/`),
    postComment() {
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
          if (res.error) alert("Error sending comment");
          else {
            const newCommentPseudoId = `${this.resourceType[0]}_${res.commentId}`;
            this.commentsArr[newCommentPseudoId] = {
              author: res.username,
              authorId: res.userId,
              content: res.content,
              date: new Date().toISOString(),
              children: null,
              childOf: parent_pseudo_id,
            };
            this.commentsArr[parent_pseudo_id].children.push(newCommentPseudoId);
            this.replyBoxValue = "";
            this.replying = false;
          }
        }
      );
    },
  },
  computed: {
    thisComment() {
      return this.commentsArr[this.commentId];
    },
    lengthOfReplyBoxValue() {
      return this.replyBoxValue.length;
    },
    username() {
      return vue.username;
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
        let responded = false;
        chrome.runtime.sendMessage({ scratchMessaging: "getData" }, (res) => {
          responded = true;
          if (res) {
            this.messages = res.messages;
            this.msgCount = res.lastMsgCount;
            this.username = res.username;
            this.error = res.error;
            resolve(res.error ? false : true);
          }
        });
        setTimeout(() => {
          if (!responded) {
            this.error = "addonDisabled";
            resolve(undefined);
          }
        }, 1000);
      });
    },

    // For UI
    showMoreOrLess() {
      if (this.messagesReady && this.commentsReady && this.msgCount < 40) this.showAllMessages = !this.showAllMessages;
    },
    markAsRead() {
      chrome.runtime.sendMessage({ scratchMessaging: "markAsRead" });
      this.follows = [];
      this.studioInvites = [];
      this.forumActivity = [];
      this.remixes = [];
      this.profiles = [];
      this.studios = [];
      this.projects = [];
      this.msgCount = 0;
      this.showingMessagesAmt = 0;
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
            studioTitle: message.title,
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
