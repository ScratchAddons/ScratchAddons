export default async function ({ addon }) {
  addon.tab.addBlock('\u200B\u200Bcomment %s', {
    args: ["content"]
  });
}
