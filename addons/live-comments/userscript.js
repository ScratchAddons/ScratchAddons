export default async function ({ addon, global, console, msg }) {
    const { redux } = addon.tab;
    let [ , type, id ] = location.pathname.split('/')
    
    if (type == 'studios') {
        await redux.waitForState(state => redux.state.studio.infoStatus == "FETCHED", {
            actions: ['SET_INFO']
        })
    } else {
        await redux.waitForState((state) => state.preview.status.project === "FETCHED", {
            actions: ['SET_PROJECT_INFO']
        })
    }
    
    const URL = `https://api.scratch.mit.edu/${type == 'projects' ? `users/${redux.state.preview.projectInfo.author.username}/projects` : `studios`}/${id}/comments`
    

    setInterval(async () => {
        var loopOffset = 40
        var offset = -loopOffset
        while (true) {
            offset += loopOffset
            let res = await fetch(URL + `?offset=${offset}&limit=${loopOffset}`)
            let json = await res.json()
            if (json.length == 0) return
            let loadedComments = getAllComments().map(e => e.id)

            for (let j in json) {
                let comment = json[j]

                if (loadedComments.indexOf(comment.id) !== -1) {
                    break
                }

                redux.dispatch({ type: "ADD_NEW_COMMENT", comment })
            }

            if (json.length < loopOffset) break
        }

        offset = -loopOffset
        let comments = getAllComments()

        for (let comment of comments) {
            while (true) {
                offset += loopOffset
                let res = await fetch(URL + `/${comment.id}/replies?offset=${offset}&limit=${loopOffset}`)
                let json = await res.json()

                if (json.length == 0) break
                for (let reply of json) {
                    let loadedComments = getAllComments().map(r => r.id.toString())
                    

                    if (loadedComments.indexOf(reply.id.toString()) !== -1) break;
                    console.log(`NEW REPLY: `, reply, "MY PARENT IS", reply.parent_id)
                    
                    redux.dispatch({ type: "ADD_NEW_COMMENT", comment: reply, topLevelCommentId: reply.parent_id })
                }

                if (json.length < loopOffset) break
            }
        }

    }, 1000)

    function getAllComments() {
        let loadedComments = [...redux.state.comments.comments]
        for (let replies of Object.values(redux.state.comments.replies)) {
            loadedComments.push(...replies)
        }

        return loadedComments
    }

    function getTopLevelCommentId(rep) {

    }
}