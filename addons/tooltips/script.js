let regexDict = {
    project: [
        /^((https?:)?\/\/scratch.mit.edu)?\/projects\/\d+/,
    ],
    studio: [
        /^((https?:)?\/\/scratch.mit.edu)?\/studios\/\d+/,
    ],
    user: [
        /^((https?:)?\/\/scratch.mit.edu)?\/users\/[a-zA-Z0-9-_]+/,
    ],
    forumTopic: [
        /^((https?:)?\/\/scratch.mit.edu)?\/discuss\/topic\/\d+(?!.+#post-\d)/,
    ],
    forumPost: [
        /^((https?:)?\/\/scratch.mit.edu)?\/discuss\/post\/\d+/,
        /^((https?:)?\/\/scratch.mit.edu)?\/discuss\/topic\/\d+(.+#post-\d)/
    ]
}

let selectorExclusionDict = {
    all: [
        "parent! parent! parent! parent! #navigation",    // Navigation bar on the top of the page
        ".page",                                          // Links to topic page
        "parent! parent! parent .linksb",                 // Bottom links on forums
        "[href^='#']",                                    // Links that starts with and hash (don't link to another page)
        ".thumbnail-image",                               // Thumbnail image (3.0)
        "parent! .thumbnail-title",                       // Thumbnail text (3.0)
        "parent! .thumb"                                 // Thumbnail image (2.0)
    ],
    project: [
        "parent! parent! .thumb",                         // Thumbnail text (2.0)
    ],
    studio: [
        "parent! #studio-tab-nav",                        // Tabs (such as the tab on the studio page)
        "parent! parent! .thumb"                          // Thumbnail text (2.0)
    ],
    user: [
        ".slider-carousel-control",                       // Control keys (next and prev) on user pages
        "[data-control='view-all']",                      // "View all" buttons
        "parent! .studio-member-tile",                    // Studio curator image
        ".studio-member-name",                            // Studio curator text 
        "parent! parent! .thumb.user",                    // Thumbnail text (2.0)
        "parent! parent! parent! .postleft"               // Forum user avatar
    ],
    forumPost: [
        "parent! .box-head"                               // Link on the post date 
    ]
}

let themeOptions = {
    _default: {
        extendedInfo: false
    },
    extended: {
        extendedInfo: true
    }
}

let tippyGlobalOptions = {
    theme: 'sa-tooltips',
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

export default async function ({ addon, console, msg }) {

    let theme = addon.settings.get("theme")

    tippyGlobalOptions.content = msg("loading")

    if (addon.settings.get("color-scheme") !== "auto") {
        tippyGlobalOptions.theme = `sa-tooltips-${addon.settings.get("color-scheme")}`
    } else {
        // I believe that there's a better way to check if dark-www is turned on.
        // Please tell me if there is.
        if (document.querySelector("[data-addon-id=dark-www]")) tippyGlobalOptions.theme += "sa-tooltips-dark"
        else tippyGlobalOptions.theme = "sa-tooltips-light"
    }

    /*global tippy*/
    await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/popper.js")
    await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/tippy.js")

    const triggerTooltip = {

        project(element, options) {

            if (/\d+/.exec(element.href) === null) return
            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. project thumbnails)
            let id = /\d+/.exec(element.href)[0]
            // https://api.scratch.mit.edu/projects/
            let tippyOptions = {
                ...tippyGlobalOptions,
                async onShow(instance) {
                    if (instance._isFetching || instance._error) return
                    instance._isFetching = true;

                    let data = await fetch(`https://api.scratch.mit.edu/projects/${id}`)
                        .then(response => response.json())
                        .catch(error => {
                            instance._error = error;
                            instance.setContent(msg("error-request-failed", { error }));
                            return;
                        })

                    if (data.code) {
                        if (data.code === "NotFound") instance.setContent(msg("error-no-project"))
                        else instance.setContent(msg("error-request-failed", { error: data.code }))
                        return
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

                    if (options.extendedInfo) {
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
                    }

                    instance.setContent(wrapper)
                }
            }

            tippy(element, tippyOptions).show()

        },

        studio(element, options) {

            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. studio thumbnails)
            let id = /\d+/.exec(element.href)[0]
            let tippyOptions = {
                ...tippyGlobalOptions,
                async onShow(instance) {
                    if (instance._isFetching || instance._error) return
                    instance._isFetching = true;

                    let data = await fetch(`https://api.scratch.mit.edu/studios/${id}`)
                        .then(response => response.json())
                        .catch(error => {
                            instance._error = error;
                            instance.setContent(msg("error-request-failed", { error }));
                            return
                        })

                    if (data.code) {
                        if (data.code === "NotFound") instance.setContent(msg("error-no-studio"))
                        else instance.setContent(msg("error-request-failed", { error: data.code }))
                        return
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
                    instance.setContent(wrapper)
                }
            }

            tippy(element, tippyOptions).show()

        },

        user(element, options) {

            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. user following/followed)
            let id = /\/users\/([a-zA-Z0-9-_]+)/.exec(element.href)[1]
            let tippyOptions = {
                ...tippyGlobalOptions,
                async onShow(instance) {
                    if (instance._isFetching || instance._error) return
                    instance._isFetching = true;

                    let data = await fetch(`https://api.scratch.mit.edu/users/${id}`)
                        .then(response => response.json())
                        .catch(error => {
                            instance._error = error;
                            instance.setContent(msg("error-request-failed", { error }));
                            return
                        })

                    if (data.code) {
                        if (data.code === "NotFound") instance.setContent(msg("error-no-user"))
                        else instance.setContent(msg("error-request-failed", { error: data.code }))
                        return
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

                    if (options.extendedInfo) {

                        data = await fetch(`https://scratchdb.lefty.one/v3/user/info/${id}`)
                            .then(response => response.json())
                            .catch(error => false)

                        if (data) {

                            let originText = document.createElement("div")
                            let infoExtendedWrapper = document.createElement("div")
    
                            originText.className = "sa-tooltips-origin"
                            infoExtendedWrapper.className = "sa-tooltips-info-extended-wrapper"

                            originText.textContent = msg("info-origin", { status: data.status, country: data.country })

                            infoExtendedWrapper.appendChild(originText)

                            if (data.statistics) {

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

                            }

                            wrapper.appendChild(infoExtendedWrapper)

                        }

                    }

                    instance.setContent(wrapper)
                }

            }

            tippy(element, tippyOptions).show()

        },

        forumTopic(element, options) {

            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. user following/followed)
            let id = /\/topic\/(\d+)/.exec(element.href)[1]
            let tippyOptions = {
                ...tippyGlobalOptions,
                async onShow(instance) {
                    if (instance._isFetching || instance._error) return
                    instance._isFetching = true;

                    let data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/info/${id}`)
                        .then(response => response.json())
                        .catch(error => {
                            instance._error = error;
                            instance.setContent(msg("error-request-failed", { error }));
                            return
                        })

                    if (data.error) {
                        if (data.error === "TopicNotFoundError") instance.setContent(msg("error-no-forum-topic"));
                        else instance.setContent(msg("error-scratchdb", { error: data.error }));
                        // console.log(data)
                        return
                    }

                    if (data.deleted) {
                        instance.setContent(msg("error-scratchdb-deleted"))
                        return
                    }
    
                    let categoryText = document.createElement("div")
                    let titleText = document.createElement("div")
                    let postText = document.createElement("div")
                    let postCountText = document.createElement("div")
                    let infoWrapper = document.createElement("div")
                    let wrapper = document.createElement("div")

                    categoryText.className = "sa-tooltips-topic-category"
                    titleText.className = "sa-tooltips-topic-title"
                    postText.className = "sa-tooltips-post"
                    postCountText.className = "sa-tooltips-post-count"
                    infoWrapper.className = "sa-tooltips-info-wrapper"
                    wrapper.className = "sa-tooltips-wrapper sa-tooltips-forum-topic"

                    categoryText.textContent = data.category
                    titleText.textContent = data.title
                    postCountText.textContent = msg("post-count", {count: data.post_count})

                    if (options.extendedInfo) {

                        data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/posts/${id}?o=oldest`)
                        .then(response => response.json())
                        .catch(error => false)

                        if (data) postText.textContent = data[0].content.bb.substr(0, 256)

                    }

                    infoWrapper.appendChild(categoryText)
                    infoWrapper.appendChild(titleText)
                    if (options.extendedInfo && postText.textContent) infoWrapper.appendChild(postText)
                    infoWrapper.appendChild(postCountText)
                    wrapper.appendChild(infoWrapper)
                    instance.setContent(wrapper)

                }

            }

            tippy(element, tippyOptions).show()

        },

        forumPost(element, options) {

            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. user following/followed)
            let id = /post[-\/](\d+)/.exec(element.href)[1]
            // console.log(/post[-\/](\d+)/.exec(element.href))
            let tippyOptions = {
                ...tippyGlobalOptions,
                async onShow(instance) {
                    if (instance._isFetching || instance._error) return
                    instance._isFetching = true;

                    let data = await fetch(`https://scratchdb.lefty.one/v3/forum/post/info/${id}`)
                        .then(response => response.json())
                        .catch(error => {
                            instance._error = error;
                            instance.setContent(msg("error-request-failed", { error }));
                            return
                        })

                    if (data.error) {
                        if (data.error === "post not found" || data.error === "NoMorePostsError") instance.setContent(msg("error-no-forum-post"));
                        else instance.setContent(msg("error-scratchdb", { error: data.error }));
                        // console.log(data)
                        return
                    }        
    
                    if (data.deleted) {
                        instance.setContent(msg("error-scratchdb-deleted"))
                        // console.log(data)
                        return
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

                    if (options.extendedInfo) {

                        data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/info/${data.topic.id}`)
                            .then(response => response.json())
                            .catch(error => false)

                        if (data) postCountText.textContent = msg("post-count", {count: data.post_count})

                    }

                    infoWrapper.appendChild(categoryText)
                    infoWrapper.appendChild(titleText)
                    infoWrapper.appendChild(authorText)
                    infoWrapper.appendChild(postText)
                    if (options.extendedInfo && postCountText.textContent) infoWrapper.appendChild(postCountText)
                    wrapper.appendChild(infoWrapper)
                    instance.setContent(wrapper)

                }

            }

            tippy(element, tippyOptions).show()

        }

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
        for (let regexType of Object.keys(regexDict)) {
            if (type) break
            for (let regex of regexDict[regexType]) {
                if (type) break
                if (regex.test(target.href)) type = regexType
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

        let themeOption = {
            ...themeOptions._default
        }

        if (themeOptions[theme]) themeOption = {
            ...themeOption,
            ...themeOptions[theme]
        }

        triggerTooltip[type](target, themeOption)
    })

}