// This module should run after page load - only use this with `runAtComplete:true`
const getTopics = () => JSON.parse(sessionStorage.getItem("auto-follow-topics") || "[]");
const setTopics = (topics) => sessionStorage.setItem("auto-follow-topics", JSON.stringify(topics));
const postError = () => Boolean(document.querySelector(".errorlist"));
const topicID = location.href.split("/")[5];

document.querySelector("[name=AddPostForm]")?.addEventListener("click", (event) => {
  const ids = getTopics();
  ids.push(topicID);
  setTopics(ids);
  onPostCallbacks.forEach((callback) => callback());
});

const topics = getTopics();
let success = false;
const hasTopic = topics.includes(topicID);
if (hasTopic && !postError()) {
  success = true;
  setTopics(topics.filter((topic) => topic !== topicID));
}

const onPostCallbacks = [];
export const onPost = (callback) => {
  onPostCallbacks.push(callback);
};

export const onSuccessfulPost = (callback) => {
  if (hasTopic && success) callback(topicID);
};
export const onNonSuccessfulPost = (callback) => {
  if (hasTopic && !success) callback(topicID);
};
