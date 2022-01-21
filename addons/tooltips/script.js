let regexDict = {
    project: [
        /^(?:(?:https?:)?\/\/scratch\.mit\.edu)?\/projects\/(\d+)/,
    ],
    studio: [
        /^(?:(?:https?:)?\/\/scratch\.mit\.edu)?\/studios\/(\d+)/,
    ],
    user: [
        /^(?:(?:https?:)?\/\/scratch\.mit\.edu)?\/users\/([a-zA-Z0-9-_]+)/,
    ],
    forumTopic: [
        /^(?:(?:https?:)?\/\/scratch\.mit\.edu)?\/discuss\/topic\/(\d+)(?!.+#post-\d)/,
    ],
    forumPost: [
        /^(?:(?:https?:)?\/\/scratch\.mit\.edu)?\/discuss\/post\/(\d+)/,
        /^(?:(?:https?:)?\/\/scratch\.mit\.edu)?\/discuss\/topic\/\d+(?:.+#post-(\d+))/
    ]
}

let selectorExclusionDict = {
    all: [
        "parent! parent! parent! parent! #navigation",    // Navigation bar on the top of the page
        ".page",                                          // Links to topic page
        "parent! parent! .linksb",                        // Bottom links on forums
        "[href^='#']",                                    // Links that starts with and hash (don't link to another page)
        ".thumbnail-image",                               // Thumbnail image (3.0)
        "parent! .thumbnail-title",                       // Thumbnail text (3.0)
        "parent! parent! .thumbnail-title",               // Thumbnail text (3.0)
        "parent! .thumb"                                  // Thumbnail image (2.0)
    ],
    project: [
        "parent! parent! .thumb",                         // Thumbnail text (2.0)
    ],
    studio: [
        "parent! .studio-tab-nav",                        // Tabs (such as the tab on the studio page)
        "parent! parent! .thumb"                          // Thumbnail text (2.0)
    ],
    user: [
        ".slider-carousel-control",                       // Control keys (next and prev) on user pages
        "[data-control='view-all']",                      // "View all" buttons
        "parent! .studio-member-tile",                    // Studio curator image
        ".studio-member-name",                            // Studio curator text 
        "parent! parent! .thumb",                         // Thumbnail text (2.0)
        "parent! parent! parent! .postleft"               // Forum user avatar
    ],
    forumPost: [
        "parent! .box-head"                               // Link on the post date 
    ]
}

// let themeOptions = {
//     _default: {
//         extendedInfo: false
//     },
//     extended: {
//         extendedInfo: true
//     }
// }

let tooltipContentFunctions = {
    _default: {
        async project(msg, id) {
            let data = await fetch(`https://api.scratch\.mit\.edu/projects/${id}`)
                .then(response => response.json())
                .catch(error => {
                    throw msg("error-request-failed", { error });
                })

            if (data.code) {
                if (data.code === "NotFound") throw msg("error-no-project")
                else throw msg("error-request-failed", { error: data.code })
            }    
            
            let imgInfo = document.createElement("img")
            let titleText = document.createElement("div")
            let authorText = document.createElement("div")
            let img = document.createElement("img")
            let imgWrapper = document.createElement("div")
            let infoWrapper = document.createElement("div")
            let wrapper = document.createElement("div")

            imgInfo.className = "sa-tooltips-project-author-img"
            titleText.className = "sa-tooltips-project-title"
            authorText.className = "sa-tooltips-project-author"
            img.className = "sa-tooltips-project-img"
            imgWrapper.className = "sa-tooltips-img-wrapper"
            infoWrapper.className = "sa-tooltips-info-wrapper"
            wrapper.className = "sa-tooltips-wrapper sa-tooltips-project"

            imgInfo.src = data.author.profile.images["32x32"]
            titleText.textContent = data.title
            authorText.textContent = data.author.username
            img.src = data.image

            imgWrapper.appendChild(img)
            infoWrapper.appendChild(imgInfo)
            infoWrapper.appendChild(titleText)
            infoWrapper.appendChild(authorText)
            wrapper.appendChild(imgWrapper)
            wrapper.appendChild(infoWrapper)
            return { wrapper, data }
        },

        async studio(msg, id) {
            let data = await fetch(`https://api.scratch\.mit\.edu/studios/${id}`)
            .then(response => response.json())
            .catch(error => {
                throw msg("error-request-failed", { error });
            })

            if (data.code) {
                if (data.code === "NotFound") throw msg("error-no-studio")
                else throw msg("error-request-failed", { error: data.code })
            }    
                
            let titleText = document.createElement("div")
            let img = document.createElement("img")
            let imgWrapper = document.createElement("div")
            let infoWrapper = document.createElement("div")
            let wrapper = document.createElement("div")

            titleText.className = "sa-tooltips-studio-title"
            img.className = "sa-tooltips-studio-img"
            imgWrapper.className = "sa-tooltips-img-wrapper"
            infoWrapper.className = "sa-tooltips-info-wrapper"
            wrapper.className = "sa-tooltips-wrapper sa-tooltips-studio"

            titleText.textContent = data.title.trim()
            img.src = data.image

            imgWrapper.appendChild(img)
            infoWrapper.appendChild(titleText)
            wrapper.appendChild(imgWrapper)
            wrapper.appendChild(infoWrapper)
            return { wrapper, data }
        },

        async user(msg, id) {
            let data = await fetch(`https://api.scratch\.mit\.edu/users/${id}`)
                .then(response => response.json())
                .catch(error => {
                    throw msg("error-request-failed", { error });
                })

            if (data.code) {
                if (data.code === "NotFound") throw msg("error-no-user")
                else throw msg("error-request-failed", { error: data.code })
            }

            let usernameText = document.createElement("div")
            let img = document.createElement("img")
            let imgWrapper = document.createElement("div")
            let infoWrapper = document.createElement("div")
            let wrapper = document.createElement("div")

            usernameText.className = "sa-tooltips-user-name"
            img.className = "sa-tooltips-user-img"
            imgWrapper.className = "sa-tooltips-img-wrapper"
            infoWrapper.className = "sa-tooltips-info-wrapper"
            wrapper.className = "sa-tooltips-wrapper sa-tooltips-user"

            usernameText.textContent = data.username.trim()
            img.src = data.profile.images["90x90"].replace("90x90", "150x150")

            imgWrapper.appendChild(img)
            infoWrapper.appendChild(usernameText)
            wrapper.appendChild(imgWrapper)
            wrapper.appendChild(infoWrapper)
            return { wrapper, data }
        },

        async forumTopic(msg, id) {
            let data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/info/${id}`)
                .then(response => response.json())
                .catch(error => {
                    throw msg("error-request-failed", { error });
                })

            if (data.error) {
                if (data.error === "TopicNotFoundError") throw msg("error-no-forum-topic");
                else throw msg("error-scratchdb", { error: data.error });
                // console.log(data)
            }

            if (data.deleted) {
                throw msg("error-scratchdb-deleted")
            }

            let categoryText = document.createElement("div")
            let titleText = document.createElement("div")
            let postCountText = document.createElement("div")
            let infoWrapper = document.createElement("div")
            let wrapper = document.createElement("div")

            categoryText.className = "sa-tooltips-topic-category"
            titleText.className = "sa-tooltips-topic-title"
            postCountText.className = "sa-tooltips-post-count"
            infoWrapper.className = "sa-tooltips-info-wrapper"
            wrapper.className = "sa-tooltips-wrapper sa-tooltips-forum-topic"

            categoryText.textContent = data.category
            titleText.textContent = data.title
            postCountText.textContent = msg("post-count", {count: data.post_count})

            infoWrapper.appendChild(categoryText)
            infoWrapper.appendChild(titleText)
            infoWrapper.appendChild(postCountText)
            wrapper.appendChild(infoWrapper)
            return wrapper
        },

        async forumPost(msg, id) {
            let data = await fetch(`https://scratchdb.lefty.one/v3/forum/post/info/${id}`)
                .then(response => response.json())
                .catch(error => {
                    throw msg("error-request-failed", { error });
                })

            if (data.error) {
                if (data.error === "post not found" || data.error === "NoMorePostsError") throw msg("error-no-forum-post");
                else throw msg("error-scratchdb", { error: data.error });
                // console.log(data)
            }        

            if (data.deleted) {
                throw msg("error-scratchdb-deleted")
                // console.log(data)
            }

            let categoryText = document.createElement("div")
            let titleText = document.createElement("div")
            let authorText = document.createElement("div")
            let postText = document.createElement("div")
            let postCountText = document.createElement("div")
            let infoWrapper = document.createElement("div")
            let wrapper = document.createElement("div")

            categoryText.className = "sa-tooltips-topic-category"
            titleText.className = "sa-tooltips-topic-title"
            authorText.className = "sa-tooltips-post-author"
            postText.className = "sa-tooltips-post"
            postCountText.className = "sa-tooltips-post-count"
            infoWrapper.className = "sa-tooltips-info-wrapper"
            wrapper.className = "sa-tooltips-wrapper sa-tooltips-forum-post"

            categoryText.textContent = data.topic.category
            titleText.textContent = data.topic.title
            authorText.textContent = data.username + ":"
            postText.textContent = data.content.bb.substr(0, 1024)

            infoWrapper.appendChild(categoryText)
            infoWrapper.appendChild(titleText)
            infoWrapper.appendChild(authorText)
            infoWrapper.appendChild(postText)
            wrapper.appendChild(infoWrapper)
            return { wrapper, data }
        },
    },

    scratch2: {
        async project(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.project(msg, id)

            wrapper.querySelector(".sa-tooltips-project-author").textContent = msg("info-by", {author: data.author.username})

            return wrapper
        }
    },

    extended: {
        async project(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.project(msg, id)

            let infoExtendedWrapper = document.createElement("div")
            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"    
            infoExtendedWrapper.textContent = data.description.replace(/^\n+|\n$/, "") || data.instructions.replace(/^\n+|\n$/, "")

            wrapper.appendChild(infoExtendedWrapper)

            return wrapper
        },

        async studio(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.studio(msg, id)

            let infoExtendedWrapper = document.createElement("div")
            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"    
            infoExtendedWrapper.textContent = data.description.replace(/^\n+|\n$/, "")

            wrapper.appendChild(infoExtendedWrapper)

            return wrapper
        },

        async user(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.user(msg, id)

            let infoExtendedWrapper = document.createElement("div")
            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"    
            infoExtendedWrapper.textContent = data.profile.bio.replace(/^\n+|\n$/, "")

            wrapper.appendChild(infoExtendedWrapper)

            return wrapper
        },

        async forumTopic(msg, id) {
            let wrapper = await tooltipContentFunctions._default.forumTopic(msg, id)

            let postText = document.createElement("div")
            postText.className = "sa-tooltips-post"

            let data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/posts/${id}?o=oldest`)
                .then(response => response.json())
                .catch(error => false)

            if (!data) return wrapper
            
            postText.textContent = data[0].content.bb.substr(0, 256)
            wrapper.lastChild.insertBefore(postText, wrapper.lastChild.children[2])

            return wrapper
        },

        async forumPost(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.forumPost(msg, id)

            let postCountText = document.createElement("div")
            postCountText.className = "sa-tooltips-post-count"

            data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/info/${data.topic.id}`)
                .then(response => response.json())
                .catch(error => false)

            if (!data) return wrapper
            
            postCountText.textContent = msg("post-count", {count: data.post_count})

            wrapper.lastChild.appendChild(postCountText)

            return wrapper
        }
    },

    extendedStatistics: {
        async project(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.project(msg, id)

            let viewsText = document.createElement("div")
            let lovesText = document.createElement("div")
            let favoritesText = document.createElement("div")
            let remixesText = document.createElement("div")
            let infoExtendedWrapper = document.createElement("div")

            viewsText.className = "sa-tooltips-views"
            lovesText.className = "sa-tooltips-loves"
            favoritesText.className = "sa-tooltips-favorites"
            remixesText.className = "sa-tooltips-remixes"
            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"

            viewsText.textContent = msg("info-views", { count: data.stats.views })
            lovesText.textContent = msg("info-loves", { count: data.stats.loves })
            favoritesText.textContent = msg("info-favorites", { count: data.stats.favorites })
            remixesText.textContent = msg("info-remixes", { count: data.stats.remixes })

            infoExtendedWrapper.appendChild(viewsText)
            infoExtendedWrapper.appendChild(lovesText)
            infoExtendedWrapper.appendChild(favoritesText)
            infoExtendedWrapper.appendChild(remixesText)
            wrapper.appendChild(infoExtendedWrapper)

            return wrapper
        },

        async studio(msg, id) {
            let { wrapper, data } = await tooltipContentFunctions._default.studio(msg, id)

            let projectsText = document.createElement("div")
            let commentsText = document.createElement("div")
            let followersText = document.createElement("div")
            let managersText = document.createElement("div")
            let infoExtendedWrapper = document.createElement("div")

            projectsText.className = "sa-tooltips-projects"
            commentsText.className = "sa-tooltips-comments"
            followersText.className = "sa-tooltips-followers"
            managersText.className = "sa-tooltips-managers"
            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"

            projectsText.textContent = data.stats.projects === 100 ? msg("info-projects-100") : msg("info-projects", { count: data.stats.projects })
            commentsText.textContent = data.stats.comments === 100 ? msg("info-comments-100") : msg("info-comments", { count: data.stats.comments })
            followersText.textContent = msg("info-followers", { count: data.stats.followers })
            managersText.textContent = msg("info-managers", { count: data.stats.managers })

            infoExtendedWrapper.appendChild(projectsText)
            infoExtendedWrapper.appendChild(commentsText)
            infoExtendedWrapper.appendChild(followersText)
            infoExtendedWrapper.appendChild(managersText)
            wrapper.appendChild(infoExtendedWrapper)

            return wrapper
        },

        async user(msg, id) {
            let { wrapper } = await tooltipContentFunctions._default.user(msg, id)

            let data = await fetch(`https://scratchdb.lefty.one/v3/user/info/${id}`)
                .then(response => response.json())
                .catch(error => false)

            if (!data) return wrapper

            let originText = document.createElement("div")
            let infoExtendedWrapper = document.createElement("div")

            originText.className = "sa-tooltips-origin"
            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"

            originText.textContent = msg("info-origin", { status: data.status, country: data.country })

            infoExtendedWrapper.appendChild(originText)

            if (!data.statistics) return wrapper
            
            let viewsText = document.createElement("div")
            let lovesText = document.createElement("div")
            let favoritesText = document.createElement("div")
            let followersText = document.createElement("div")
            let followingText = document.createElement("div")    

            viewsText.className = "sa-tooltips-views"
            lovesText.className = "sa-tooltips-loves"
            favoritesText.className = "sa-tooltips-favorites"
            followersText.className = "sa-tooltips-followers"
            followingText.className = "sa-tooltips-following"
            
            viewsText.textContent = msg("info-views", { count: data.statistics.views })
            lovesText.textContent = msg("info-loves", { count: data.statistics.loves })
            favoritesText.textContent = msg("info-favorites", { count: data.statistics.favorites })
            followersText.textContent = msg("info-followers", { count: data.statistics.followers })
            followingText.textContent = msg("info-following", { count: data.statistics.following })

            infoExtendedWrapper.appendChild(viewsText)
            infoExtendedWrapper.appendChild(lovesText)
            infoExtendedWrapper.appendChild(favoritesText)
            infoExtendedWrapper.appendChild(followersText)
            infoExtendedWrapper.appendChild(followingText)    

            wrapper.appendChild(infoExtendedWrapper)

            return wrapper
        },

        async forumTopic(msg, id) {
            return await tooltipContentFunctions.extended.forumTopic(msg, id)
        },

        async forumPost(msg, id) {
            return await tooltipContentFunctions.extended.forumPost(msg, id)
        },

        async _template(msg, id) {
            let { wrapper } = await tooltipContentFunctions._default.project(msg, id)

            return wrapper
        },

    }
}

let tippyGlobalOptions = {
    allowHTML: true,
    popperOptions: {
        strategy: 'fixed',
        modifiers: [
            {
                name: 'flip',
                options: {
                    fallbackPlacements: ['bottom'],
                },
            },
            {
                name: 'preventOverflow',
                options: {
                    altAxis: true,
                    tether: false,
                },
            },
        ],
    },
    onCreate(instance) {
        instance._isFetching = false;
        instance._src = null;
        instance._error = null;
    }
    //,
    // onHidden(instance) {
    //     instance.destroy()
    //     currentTarget = ""
    // }
}

let tippyGlobalOptionsChanging = {
    theme: 'sa-tooltips'
}

export default async function ({ addon, console, msg }) {

    let theme = addon.settings.get("theme")

    tippyGlobalOptions.content = msg("loading")

    let changeColorScheme = async () => {
        if (addon.settings.get("color-scheme") !== "auto") {
            tippyGlobalOptionsChanging.theme = `sa-tooltips-${addon.settings.get("color-scheme")}`
        } else {
            if (await (await addon.self.getEnabledAddons()).indexOf('dark-www') + 1) tippyGlobalOptionsChanging.theme = "sa-tooltips-dark"
            else tippyGlobalOptionsChanging.theme = "sa-tooltips-light"
        }
    }

    /*global tippy*/
    await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/popper.js")
    await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/tippy.js")

    tippy.setDefaultProps(tippyGlobalOptions)

    addon.settings.addEventListener("change", () => {
        changeColorScheme()
        // Placeholder for live style changes

    })

    changeColorScheme()

    const triggerTooltipUnified = (type, element, regexResult) => {

        const id = regexResult[1]

        let tippyOptions = {
            async onShow(instance) {
                instance.setProps(tippyGlobalOptionsChanging)
                if (instance._isFetching || instance._error) return
                instance._isFetching = true

                let themeKey
                if (tooltipContentFunctions[theme] && tooltipContentFunctions[theme][type]) themeKey = theme
                else themeKey = "_default"

                await tooltipContentFunctions[themeKey][type](msg, id)
                    .then(content => {
                        if (content.wrapper) instance.setContent(content.wrapper)
                        else instance.setContent(content)        
                    })
                    .catch(error => {
                        instance._error = error
                        instance.setContent(error)
                    })

            }
        }

        tippy(element, tippyOptions).show()

    }

    let currentTarget

    document.addEventListener("mousemove", () => {

        // const target = document.querySelector("a:hover")
        const target = document.querySelector("a:hover:not(.sa-tooltips-read)")
        if (!target || currentTarget === target) return
        target.classList.add("sa-tooltips-read")

        currentTarget = target

        // console.log(target)

        let type = ""
        let regexResult = []
        for (let regexType of Object.keys(regexDict)) {
            if (type) break
            for (let regex of regexDict[regexType]) {
                if (type) break
                if (regex.test(target.href)) {
                    regexResult = regex.exec(target.href)
                    type = regexType
                }
            }
        }

        if (!type) return

        // console.log(type)

        if (!addon.settings.get("forceAll")) {

            let selectorExclusions = [...selectorExclusionDict.all]
            if (selectorExclusionDict[type]) selectorExclusions.push(...selectorExclusionDict[type])
    
            for (let selector of selectorExclusions) {
                let elementToCheck = target
                while (selector.startsWith("parent! ")) {
                    elementToCheck = elementToCheck.parentElement
                    selector = selector.slice(8)
                }
                if (elementToCheck.matches(selector)) return
            }    

        }

        // let themeOption = {
        //     ...themeOptions._default
        // }

        // if (themeOptions[theme]) themeOption = {
        //     ...themeOption,
        //     ...themeOptions[theme]
        // }
        
        triggerTooltipUnified(type, target, regexResult)
    })

}