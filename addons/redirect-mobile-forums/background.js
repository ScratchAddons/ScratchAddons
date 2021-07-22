export default async function ({ addon, global, console, msg }) {
  chrome.webRequest.onBeforeRequest.addListener((details) => {
    let url = details.url.replace(/\/discuss\/m\/(.*)/g, "/discuss/$1")
    return {
      redirectUrl: url
    }
  }, {
    urls: [
      "https://scratch.mit.edu/discuss/m/*"
    ],
    types: ["main_frame"]
  }, ["blocking"])
}
