export default async function ({ addon, console }) {
  const ftsoEl = document.querySelector(
    "body > div:nth-child(69) > div > div > div > div.prompt_body_18Z-I.box_box_2jjDp > div:nth-child(3) > div.prompt_options-row_36JmB.box_box_2jjDp > label:nth-child(2) > input[type=radio]"
  );
  document.body.addEventListener("keydown", function (e) {
    console.log(e.target);
  });
}
