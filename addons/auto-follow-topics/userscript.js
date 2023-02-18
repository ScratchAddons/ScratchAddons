export default async function ({ addon, console, msg }) {
  const getTopics = () => JSON.parse(sessionStorage.getItem("auto-follow-topics") || "[]");
  const setTopics = (topics) => sessionStorage.setItem("auto-follow-topics", JSON.stringify(topics));
  const topicID = location.href.split("/")[5];

  document.querySelector("[name=AddPostForm]").addEventListener("click", (event) => {
    let ids = getTopics();
    ids.push(topicID);
    setTopics(ids);
  });

  let topics = getTopics();
  if (topics.includes(topicID)) {
    const followBtn = document.querySelectorAll(".follow-button")[1];
    followBtn.focus();
    followBtn.click();
    // Remove the topic we've followed now
    setTopics(topics.filter((topic) => topic !== topicID));
  }
}
