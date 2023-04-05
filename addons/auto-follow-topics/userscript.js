export default async function ({ addon, console, msg }) {
  const getTopics = () => JSON.parse(sessionStorage.getItem("auto-follow-topics") || "[]");
  const setTopics = (topics) => sessionStorage.setItem("auto-follow-topics", JSON.stringify(topics));
  const postError = () => Boolean(document.querySelector(".errorlist"));
  const topicID = location.href.split("/")[5];

  document.querySelector("[name=AddPostForm]")?.addEventListener("click", (event) => {
    const ids = getTopics();
    ids.push(topicID);
    setTopics(ids);
  });

  const topics = getTopics();
  if (topics.includes(topicID) && !postError()) {
    // Check if the user ran into the 60 second rule as well
    const followBtn = document.querySelectorAll(".follow-button")[1];
    followBtn.focus();
    followBtn.click();
    // Remove the topic we've followed now
    setTopics(topics.filter((topic) => topic !== topicID));
  }
}
