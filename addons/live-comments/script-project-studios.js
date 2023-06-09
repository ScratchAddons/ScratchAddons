const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function ({ addon, global, console, msg }) {



  let eButton = document.createElement('button')
  let enabled = false

  async function addButton() {
    await addon.tab.waitForElement('h4>span, h2>span',{markAsSeen:true})
    let commentsText = Array.from(document.querySelectorAll('h4>span, h2>span'))
    .find(el => el.innerText==('Comments'));
   
    function setButtonStyles(){
      eButton.innerHTML = enabled ? 'Live on' : 'Live off'
      eButton.classList.add(enabled ? 'live-button-enabled' : 'live-button-disabled')
      eButton.classList.remove((!enabled) ? 'live-button-enabled' : 'live-button-disabled')
    //   refreshComments()
    }

    eButton.onclick = (e)=>{
      enabled=!enabled;
      setButtonStyles()
    }

    eButton.classList.add('live-button')
    setButtonStyles()
   
   
   // place button
    commentsText?.after(eButton)
  }


    ;(async()=>{while(true){await addButton(); /*await wait(1000)*/}})();







    ///////////
  const { redux } = addon.tab;
  const [, type, id] = location.pathname.split("/");

  if (type === "studios") {
    await redux.waitForState(({ studio }) => studio.infoStatus === "FETCHED", {
      actions: ["SET_INFO"],
    });
  } else {
    await redux.waitForState(({ preview }) => preview.status.project === "FETCHED", {
      actions: ["SET_PROJECT_INFO"],
    });
  }

  const typePath = type === "projects" ? `users/${redux.state.preview.projectInfo.author.username}/projects` : "studios";
  const commentsURL = `https://api.scratch.mit.edu/${typePath}/${id}/comments`;

  const getAllComments = () => [...redux.state.comments.comments];
  const getAllReplies = () => {
    const replies = [];

    for (const reply of Object.values(redux.state.comments.replies)) {
      replies.push(...reply);
    }

    return replies;
  };

  let newest = Date.now();

  while (true) {
        console.log('y0o')

        if(enabled) {

    const loopOffset = 40;
    let offset = -loopOffset;
    // while (true) { // dont while true because this spams and loads every single comment ever on the project
    for (let iii=0; iii<3; iii++){ 
      offset += loopOffset;

      const res = await fetch(`${commentsURL}?offset=${offset}&limit=${loopOffset}`);
      // const res = await fetch(`${commentsURL}?offset=${offset}&limit=${loopOffset}&rand=${Math.random()}`);
      const data = await res.json();

      const comments = data.map((comment) => {
        const commentCreatedTime = new Date(comment.datetime_created).getTime();

        if (commentCreatedTime > newest) {
          return comment;
        } else {
          return undefined;
        }
      });

      if (comments.length === 0) break;

      const loadedComments = getAllComments().map((comment) => comment.id);

      for (const comment of comments) {
        if (!comment) continue;

        if (loadedComments.indexOf(comment.id) !== -1) {
          break;
        }

        redux.dispatch({ type: "ADD_NEW_COMMENT", comment });
        document.getElementById('comments-' + comment.id)?.parentElement?.classList.add('newCom')
      }

      if (comments.length < loopOffset) break;
    }

    const comments = getAllComments();

    for (const comment of comments) {
      offset = -loopOffset;

      while (true) {
        console.log('yo')
        if(!enabled) {break}
        offset += loopOffset;
        // const res = await fetch(`${commentsURL}/${comment.id}/replies?offset=${offset}&limit=${loopOffset}&rand=${Math.random()}`);
        const res = await fetch(`${commentsURL}/${comment.id}/replies?offset=${offset}&limit=${loopOffset}`);
        const unprocReplies = await res.json();

        const replies = unprocReplies.map((reply) => {
          const replyCreatedTime = new Date(reply.datetime_created).getTime();

          if (replyCreatedTime > newest) {
            return reply;
          } else {
            return undefined;
          }
        });

        if (replies.length === 0) {break;}

        const loadedReplies = getAllReplies().map((reply) => reply.id);

        for (const reply of replies) {
          if (!reply) continue;

          if (loadedReplies.indexOf(reply.id) !== -1) continue;

          redux.dispatch({ type: "ADD_NEW_COMMENT", comment: reply, topLevelCommentId: comment.id });
            document.getElementById('comments-' + reply.id)?.classList.add('newCom')

        }

        if (replies.length < loopOffset) {break;}


      
        // await wait(3 * 1000);
      }
    }


  }
        await wait(3 * 1000);

}
}
