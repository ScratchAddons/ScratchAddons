const Comment = Vue.extend({
  template: document.querySelector("template#comment-component").innerHTML,
  props: ["comment-id", "comments-arr", "is-parent", "unread", "resource-type", "resource-id"],
  data() {
    return {
      replying: false,
      replyBoxValue: ""
    }
  },
  methods: {
    openProfile: username => window.open(`https://scratch.mit.edu/users/${username}/`),
    postComment: function() {
      chrome.runtime.sendMessage({scratchMessaging: {postComment: {
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        content: this.replyBoxValue,
        parent_id: this.isParent ?  Number(this.commentId.substring(3)) : Number(this.thisComment.childOf.substring(3)),
        commentee_id: this.thisComment.authorId
      }}});
    }
  },
  computed: {
    thisComment() {
      return this.commentsArr[this.commentId]
    },
    lengthOfReplyBoxValue() {
      console.log(this);
      return this.replyBoxValue.length;
    }
  },
  watch: {
    replying(newVal) {
      if(newVal === true) this.$el.querySelector("textarea").focus();
    }
  }
});
Vue.component("comment", Comment);

const commentLocationPrefixes = {
  0: "p", // Projects
  1: "u", // Users
  2: "g", // Studios (galleries)
};

const vue = new Vue({
    el: "body",
    data: {
      data: {},

      follows: [],
      studioInvites: [],
      forumActivity: [],
      remixes: [],
      profiles: [],
      studios: [],
      projects: [],
      messageTypeExtended: {
        follows: false,
        studioInvites: false,
        forumActivity: false,
        remixes: false
      },
      ready: false,
      mounted: true, // Always true
      comments: {}
    },
    computed: {
      profilesOrdered() {
        return [
          ...this.profiles.filter(profile => profile.username === this.data.username),
          ...this.profiles.filter(profile => profile.username !== this.data.username),
        ];
      },
      projectsOrdered() {
        return [
          ...this.projects.filter(proj => proj.commentChains.length !== 0),
          ...this.projects.filter(proj => proj.commentChains.length === 0)
        ];
      },
    },
    created() {
      (async () => {
        let fetched = await this.getData();
        if(fetched) this.readData(this.data);
        else {
          this.ready = false;
          const interval = setInterval(async () => {
            fetched = await this.getData();
            if(fetched) {
              clearInterval(interval);
              this.readData(this.data);
            }
          }, 500);
        }
      })();
    },
    methods: {
      getData() {
        return new Promise(resolve => {
          let responded = false;
          chrome.runtime.sendMessage({scratchMessaging: "getData"}, res => {
            console.log(res);
            responded = true;
            if(res) {
              this.data = res;
              resolve(res.error ? false : true);
            }
          });
          setTimeout(() => {
            if(!responded) {
              this.data = { error: "addonDisabled" }
              resolve(undefined);
            }
          }, 1000);
        });
      },
      getProjectObject(projectId, title) {
        const search = this.projects.find(obj => obj.id === projectId);
        if(search) return search;
        const obj = {
            id: projectId,
            title,
            unreadComments: 0,
            commentChains: [],
            loves: 0,
            favorites: 0
        };
        this.projects.push(obj);
        return obj;
      },
      getProfileObject(username) {
        const search = this.profiles.find(obj => obj.username === username);
        if(search) return search;
        const obj = {
            username,
            unreadComments: 0,
            commentChains: []
        };
        this.profiles.push(obj);
        return obj;
      },
      getStudioObject(studioId, title) {
        const search = this.studios.find(obj => obj.id === studioId);
        if(search) return search;
        const obj = {
            id: studioId,
            title,
            unreadComments: 0,
            commentChains: []
        };
        this.studios.push(obj);
        return obj;
      },
      openProfile: username => window.open(`https://scratch.mit.edu/users/${username}/`),
      openProject: projectId => window.open(`https://scratch.mit.edu/projects/${projectId}/`),
      openStudio: (studioId, tab = "") => window.open(`https://scratch.mit.edu/studios/${studioId}/${tab}`),
      openUnreadPostsForums: topicId => window.open(`https://scratch.mit.edu/discuss/topic/${topicId}/unread/`),
      readData(data) {
        this.comments = data.comments;
        for(const indexString in data.messages) {
          const index = Number(indexString);
          const message = data.messages[index];
          if(message.type === "followuser") {
            this.follows.push(message.actor_username);
          }
          else if(message.type === "curatorinvite") {
            this.studioInvites.push({
              actor: message.actor_username,
              studioId: message.gallery_id,
              studioTitle: message.title
            });
          }
          else if(message.type === "forumpost") {
            // We only want one message per forum topic
            if(!this.forumActivity.find(obj => obj.topicId !== message.topic_id)) {
              this.forumActivity.push({
                topicId: message.topic_id,
                topicTitle: message.topic_title
              });
            }
          }
          else if(message.type === "remixproject") {
            console.log(message);
            this.remixes.push({
              parentTitle: message.parent_title,
              remixTitle: message.title,
              actor: message.actor_username,
              projectId: message.project_id
            });
          }
          else if(message.type === "loveproject") {
            this.getProjectObject(message.project_id, message.title).loves++;
          }
          else if(message.type === "favoriteproject") {
            this.getProjectObject(message.project_id, message.project_title).favorites++;
          }
          else if(message.type === "addcomment") {
            const commentId = `${commentLocationPrefixes[message.comment_type]}_${message.comment_id}`;
            const commentObject = data.comments[commentId];
            if(!commentObject) continue;
            commentObject._unread = index < data.lastMsgCount;
            const chainId = commentObject.childOf || commentId;
            if(message.comment_type === 0) {
              // Project comment
              const projectObject = this.getProjectObject(message.comment_obj_id, message.comment_obj_title);
              projectObject.unreadComments++;
              if(!projectObject.commentChains.includes(chainId)) projectObject.commentChains.push(chainId);
            }
            else if(message.comment_type === 1) {
              // Profile comment
              const profileObject = this.getProfileObject(message.comment_obj_title);
              console.log(profileObject);
              profileObject.unreadComments++;
              if(!profileObject.commentChains.includes(chainId)) profileObject.commentChains.push(chainId);
            }
            else if(message.comment_type === 2) {
              // Studio comment
              console.log(message);
              const studioObject = this.getStudioObject(message.comment_obj_id, message.comment_obj_title);
              studioObject.unreadComments++;
              if(!studioObject.commentChains.includes(chainId)) studioObject.commentChains.push(chainId);
            }
          }
      }
      this.ready = true;

      // Make links work and open in a new tab
      setTimeout(() => {
        const links = document.querySelectorAll("a[href]");
        for(const link of links) {
          link.target = "_blank";
          link.href = new URL(link.getAttribute("href"), "https://scratch.mit.edu").href;
        }
      });
    },
  }
});

window.parent.vue = vue;