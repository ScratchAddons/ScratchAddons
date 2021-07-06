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
        "parent! parent! #tabs",                          // Tabs (such as the tab on the studio page) (TODO: CHECK ON 3.0 STUDIO UPDATE)
        ".thumbnail-image",                               // Thumbnail image (3.0)
        "parent! .thumbnail-title",                       // Thumbnail text (3.0)
        "parent! .thumb",                                 // Thumbnail image (2.0)
    ],
    project: [
        "parent! parent! .thumb",                         // Thumbnail text (2.0)
    ],
    studio: [
        "parent! parent! .thumb",                         // Thumbnail text (2.0)
    ],
    user: [
        ".slider-carousel-control",                       // Control keys (next and prev) on user pages
        "[data-control='view-all']",                      // "View all" buttons
        "parent! parent! parent! parent! .curators",      // Studio curator image (TODO: CHECK ON 3.0 STUDIO UPDATE)
        "parent! parent! parent! .curators",              // Studio curator text (TODO: CHECK ON 3.0 STUDIO UPDATE)
        "parent! parent! .thumb.user",                    // Thumbnail text (2.0)
    ],
    forumPost: [
        "parent! .box-head"
    ]
}

export default async function ({ addon, console, msg }) {

    let tippyGlobalOptions = {
        content: msg("loading"),
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

    document.body.dataset.saTooltipsTheme = addon.settings.get("theme")
    document.body.style.setProperty("--sa-tooltips-font-size", window.getComputedStyle(document.body).getPropertyValue('font-size'))

    /*global tippy*/
    await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/popper.js")
    await addon.tab.loadScript(addon.self.lib + "/thirdparty/cs/tippy.js")

    const triggerTooltip = {

        project(element) {

            if (/\d+/.exec(element.href) === null) return
            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. project thumbnails)
            let id = /\d+/.exec(element.href)[0]
            // https://api.scratch.mit.edu/projects/
            let tippyOptions = {
                ...tippyGlobalOptions,
                async onShow(instance) {
                    if (instance._isFetching || instance._error) return
                    instance._isFetching = true;

                    const data = await fetch(`https://api.scratch.mit.edu/projects/${id}`)
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
                    let text1 = document.createElement("div")
                    let text2 = document.createElement("div")
                    let img = document.createElement("img")
                    let imgWrapper = document.createElement("div")
                    let infoWrapper = document.createElement("div")
                    let wrapper = document.createElement("div")

                    imgInfo.className = "sa-tooltips-author-img"
                    text1.className = "sa-tooltips-title"
                    text2.className = "sa-tooltips-author"
                    img.className = "sa-tooltips-img"
                    imgWrapper.className = "sa-tooltips-img-wrapper"
                    infoWrapper.className = "sa-tooltips-info-wrapper"
                    wrapper.className = "sa-tooltips-wrapper sa-tooltips-project"

                    imgInfo.src = data.author.profile.images["32x32"]
                    text1.textContent = data.title
                    text2.textContent = data.author.username
                    img.src = data.image

                    imgWrapper.appendChild(img)
                    infoWrapper.appendChild(imgInfo)
                    infoWrapper.appendChild(text1)
                    infoWrapper.appendChild(text2)
                    wrapper.appendChild(imgWrapper)
                    wrapper.appendChild(infoWrapper)
                    instance.setContent(wrapper)
                }
            }

            tippy(element, tippyOptions).show()

        },

        studio(element) {

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
                        
                    let text1 = document.createElement("div")
                    let img = document.createElement("img")
                    let imgWrapper = document.createElement("div")
                    let infoWrapper = document.createElement("div")
                    let wrapper = document.createElement("div")

                    text1.className = "sa-tooltips-title"
                    img.className = "sa-tooltips-img"
                    imgWrapper.className = "sa-tooltips-img-wrapper"
                    infoWrapper.className = "sa-tooltips-info-wrapper"
                    wrapper.className = "sa-tooltips-wrapper sa-tooltips-studio"

                    text1.textContent = data.title.trim()
                    img.src = data.image

                    imgWrapper.appendChild(img)
                    infoWrapper.appendChild(text1)
                    wrapper.appendChild(imgWrapper)
                    wrapper.appendChild(infoWrapper)
                    instance.setContent(wrapper)
                }
            }

            tippy(element, tippyOptions).show()

        },

        user(element) {

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

                    let text1 = document.createElement("div")
                    let img = document.createElement("img")
                    let imgWrapper = document.createElement("div")
                    let infoWrapper = document.createElement("div")
                    let wrapper = document.createElement("div")

                    text1.className = "sa-tooltips-username"
                    img.className = "sa-tooltips-img"
                    imgWrapper.className = "sa-tooltips-img-wrapper"
                    infoWrapper.className = "sa-tooltips-info-wrapper"
                    wrapper.className = "sa-tooltips-wrapper sa-tooltips-user"

                    text1.textContent = data.username.trim()
                    img.src = data.profile.images["90x90"].replace("90x90", "150x150")

                    imgWrapper.appendChild(img)
                    infoWrapper.appendChild(text1)
                    wrapper.appendChild(imgWrapper)
                    wrapper.appendChild(infoWrapper)
                    instance.setContent(wrapper)
                }

            }

            tippy(element, tippyOptions).show()

        },

        forumTopic(element) {

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
                        instance.setContent(msg("error-scratchdb", { error: data.error }));
                        // console.log(data)
                        return
                    }

                    if (data.deleted) {
                        instance.setContent(msg("error-scratchdb-deleted"))
                        return
                    }
    
                    let text1 = document.createElement("div")
                    let text2 = document.createElement("div")
                    let text3 = document.createElement("div")
                    let text4 = document.createElement("div")
                    let infoWrapper = document.createElement("div")
                    let wrapper = document.createElement("div")

                    text1.className = "sa-tooltips-category"
                    text2.className = "sa-tooltips-title"
                    text3.className = "sa-tooltips-post"
                    text4.className = "sa-tooltips-post-count"
                    infoWrapper.className = "sa-tooltips-info-wrapper"
                    wrapper.className = "sa-tooltips-wrapper sa-tooltips-forum-topic"

                    text1.textContent = data.category
                    text2.textContent = data.title
                    text4.textContent = msg("post-count", {count: data.post_count})

                    data = await fetch(`https://scratchdb.lefty.one/v3/forum/topic/posts/${id}?o=oldest`)
                        .then(response => response.json())
                        .catch(error => false)

                    if (data) text3.textContent = data[0].content.bb.substr(0, 128)

                    infoWrapper.appendChild(text1)
                    infoWrapper.appendChild(text2)
                    if (data) infoWrapper.appendChild(text3)
                    infoWrapper.appendChild(text4)
                    wrapper.appendChild(infoWrapper)
                    instance.setContent(wrapper)

                }

            }

            tippy(element, tippyOptions).show()

        },

        forumPost(element) {

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
                        if (data.error === "post not found") instance.setContent(msg("error-no-forum-post"));
                        instance.setContent(msg("error-scratchdb", { error: data.error }));
                        // console.log(data)
                        return
                    }        
    
                    if (data.deleted) {
                        instance.setContent(msg("error-scratchdb-deleted"))
                        // console.log(data)
                        return
                    }

                    let text1 = document.createElement("div")
                    let text2 = document.createElement("div")
                    let text3 = document.createElement("div")
                    let text4 = document.createElement("div")
                    let infoWrapper = document.createElement("div")
                    let wrapper = document.createElement("div")

                    text1.className = "sa-tooltips-category"
                    text2.className = "sa-tooltips-title"
                    text3.className = "sa-tooltips-author"
                    text4.className = "sa-tooltips-post"
                    infoWrapper.className = "sa-tooltips-info-wrapper"
                    wrapper.className = "sa-tooltips-wrapper sa-tooltips-forum-post"

                    text1.textContent = data.topic.category
                    text2.textContent = data.topic.title
                    text3.textContent = data.username + ":"
                    text4.textContent = data.content.bb.substr(0, 512)

                    infoWrapper.appendChild(text1)
                    infoWrapper.appendChild(text2)
                    infoWrapper.appendChild(text3)
                    infoWrapper.appendChild(text4)
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

        triggerTooltip[type](target)
    })

}