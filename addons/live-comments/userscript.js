const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function ({ addon, global, console, msg }) {
    const { redux } = addon.tab;
    const [, type, id] = location.pathname.split("/");

    if (type === "studios") {
        await redux.waitForState(({ studio }) => studio.infoStatus === "FETCHED", { 
            actions: ["SET_INFO"]
        });
    } else {
        await redux.waitForState(({ preview }) => preview.status.project === "FETCHED", {
            actions: ["SET_PROJECT_INFO"]
        });
    }

    const typePath = type === "projects" ? `users/${redux.state.preview.projectInfo.author.username}` : "studios";
    const commentsURL = `https://api.scratch.mit.edu/${typePath}/${id}/comments`;

    const getAllComments = () => [...redux.state.comments.comments];
    const getAllReplies = () => {
        const replies = [];

        for (const reply of Object.values(redux.state.comments.replies)) {
            replies.push(...reply);
        }

        return replies
    };

    let newest = Date.now();

    while (true) {
        const loopOffset = 40;
        let offset = -loopOffset;
        while (true) {
            offset += loopOffset;

            const res = await fetch(`${commentsURL}?offset=${offset}&limit=${loopOffset}`);
            const data = await res.json();

            const comments = data.map(comment => {
                const commentCreatedTime = new Date(comment.datetime_created).getTime();

                if (commentCreatedTime > newest) {
                    return comment;
                } else {
                    return undefined;
                }
            });

            if (comments.length === 0) break;

            const loadedComments = getAllComments().map(comment => comment.id);

            for (const comment of comments) {
                if (!comment) continue;

                if (loadedComments.indexOf(comment.id) !== -1) {
                    break;
                }

                redux.dispatch({ type: "ADD_NEW_COMMENT", comment });
            }

            if (comments.length < loopOffset) break;
        }

        const comments = getAllComments();

        for (const comment of comments) {
            offset = -loopOffset;

            while (true) {
                offset += loopOffset;
                const res = await fetch(`${commentsURL}/${comment.id}/replies?offset=${offset}&limit=${loopOffset}`);
                const unprocReplies = await res.json();

                const replies = unprocReplies.map(reply => {
                    const replyCreatedTime = new Date(reply.datetime_created).getTime();

                    if (replyCreatedTime > newest) {
                        return reply;
                    } else {
                        return undefined;
                    }
                });

                if (replies.length === 0) break;

                const loadedReplies = getAllReplies().map(reply => reply.id);

                for (const reply of replies) {
                    if (!reply) continue;

                    if (loadedReplies.indexOf(reply.id) !== -1) continue;

                    redux.dispatch({ type: "ADD_NEW_COMMENT", comment: reply, topLevelCommentId: comment.id });
                }
            }
        }
    }
}