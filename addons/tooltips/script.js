import Popper from "../../libraries/thirdparty/popper.js" 
import tippy from "../../libraries/thirdparty/tippy.js"

export default async function ({ addon, global, console, msg }) {

    let tippyGlobalOptions = {
        content: 'Loading...',
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
    }

    const triggerTooltip = {

        projects(element) {

            if (/\d+/.exec(element.href) === null) return
            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. project thumbnails)
            let id = /\d+/.exec(element.href)[0]
            // https://api.scratch.mit.edu/projects/
            let tippyOptions = {
                ...tippyGlobalOptions,
                onShow(instance) {
                    if (instance._isFetching || instance._error) {
                        return;
                    }
                    instance._isFetching = true;
                    fetch(`https://api.scratch.mit.edu/projects/${id}`).then(response => response.json()).then(data => {
                        let text1 = document.createElement("span")
                        text1.textContent = `${data.title}`
                        text1.style.margin = 0
                        text1.style.width = "200px"
                        text1.style.display = "block"
                        let text2 = document.createElement("span")
                        text2.textContent = `by ${data.author.username}`
                        text2.style.width = "200px"
                        text2.style.display = "block"
                        let img = document.createElement("img")
                        img.src = data.image
                        img.width = 200
                        img.height = 150
                        let imgWrapper = document.createElement("div")
                        let textWrapper = document.createElement("div")
                        let wrapper = document.createElement("div")
                        imgWrapper.appendChild(img)
                        textWrapper.appendChild(text1)
                        textWrapper.appendChild(text2)
                        wrapper.appendChild(imgWrapper)
                        wrapper.appendChild(textWrapper)
                        instance.setContent(wrapper)
                    }).catch((error) => {
                        instance._error = error;
                        instance.setContent(`Request failed. ${error}`);
                    })
                }
            }

            tippy(element, tippyOptions)

        },

        studios(element) {

            if (/\d+/.exec(element.href) === null) return
            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. studio thumbnails)
            let id = /\d+/.exec(element.href)[0]
            let tippyOptions = {
                ...tippyGlobalOptions,
                onShow(instance) {
                    if (instance._isFetching || instance._error) {
                        return;
                    }
                    instance._isFetching = true;
                    fetch(`https://api.scratch.mit.edu/studios/${id}`).then(response => response.json()).then(data => {
                        let text1 = document.createElement("span")
                        text1.textContent = `${data.title.trim()}`
                        text1.style.margin = 0
                        text1.style.width = "200px"
                        text1.style.display = "block"

                        let img = document.createElement("img")
                        img.src = data.image
                        img.width = 200
                        img.height = 150
                        let imgWrapper = document.createElement("div")
                        let textWrapper = document.createElement("div")
                        let wrapper = document.createElement("div")

                        imgWrapper.appendChild(img)
                        textWrapper.appendChild(text1)
                        wrapper.appendChild(imgWrapper)
                        wrapper.appendChild(textWrapper)
                        instance.setContent(wrapper)
                    }).catch((error) => {
                        instance._error = error;
                        instance.setContent(`Request failed. ${error}`);
                    })
                }
            }

            tippy(element, tippyOptions) // eslint-disable-line

        },

        users(element) {

            if (/\/users\/([a-zA-Z0-9-_]+)/.exec(element.href) === null) return
            // if (element.children.length !== 0) return // avoid doing it for links with more inside (eq. user following/followed)
            let id = /\/users\/([a-zA-Z0-9-_]+)/.exec(element.href)[1]
            let tippyOptions = {
                ...tippyGlobalOptions,
                onShow(instance) {
                    if (instance._isFetching || instance._error) {
                        return;
                    }
                    instance._isFetching = true;
                    fetch(`https://api.scratch.mit.edu/users/${id}`).then(response => response.json()).then(data => {
                        let text1 = document.createElement("span")
                        text1.textContent = `${data.username.trim()}`
                        text1.style.margin = 0
                        text1.style.width = "150px"
                        text1.style.display = "block"

                        let img = document.createElement("img")
                        img.src = data.profile.images["90x90"].replace("90x90", "150x150")
                        img.width = 150
                        img.height = 150
                        let imgWrapper = document.createElement("div")
                        let textWrapper = document.createElement("div")
                        let wrapper = document.createElement("div")

                        imgWrapper.appendChild(img)
                        textWrapper.appendChild(text1)
                        wrapper.appendChild(imgWrapper)
                        wrapper.appendChild(textWrapper)
                        instance.setContent(wrapper)
                    }).catch((error) => {
                        instance._error = error;
                        instance.setContent(`Request failed. ${error}`);
                    })
                }

            }

            tippy(element, tippyOptions)

        }
    }

    // This bulk of async is quite inefficient. 
    // If someone knows how to solve this problem better, I would appreciate the help.

    (async () => {
        while (true) {
            const element = await addon.tab.waitForElement("a[href^='https://scratch.mit.edu/projects/']", { markAsSeen: true })
            triggerTooltip.projects(element)
        }
    })()

    (async () => {
        while (true) {
            const element = await addon.tab.waitForElement("a[href^='/projects/']", { markAsSeen: true })
            triggerTooltip.projects(element)
        }
    })()

    (async () => {
        while (true) {
            const element = await addon.tab.waitForElement("a[href^='https://scratch.mit.edu/studios/']", { markAsSeen: true })
            triggerTooltip.studios(element)
        }
    })()

    (async () => {
        while (true) {
            const element = await addon.tab.waitForElement("a[href^='/studios/']", { markAsSeen: true })
            triggerTooltip.studios(element)
        }
    })()

    (async () => {
        while (true) {
            const element = await addon.tab.waitForElement("a[href^='https://scratch.mit.edu/users/']", { markAsSeen: true })
            triggerTooltip.users(element)
        }
    })()

    (async () => {
        while (true) {
            const element = await addon.tab.waitForElement("a[href^='/users/']", { markAsSeen: true })
            triggerTooltip.users(element)
        }
    })()

}
