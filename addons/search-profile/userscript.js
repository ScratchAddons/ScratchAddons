export default async function ({ addon, console, msg }) {
  const nav = await addon.tab.waitForElement(".sub-nav.tabs");

  const tab = nav.appendChild(document.createElement("button")),
    img = tab.appendChild(document.createElement("img")),
    span = tab.appendChild(document.createElement("span")),
    user = document.querySelector('[name="q"]').value.trim(),
    valid = /^[\w-]{3,20}$/g.test(user);
  const exceptions = [
    "aa",
    "ao",
    "cj",
    "dp",
    "dv",
    "FB",
    "gl",
    "hi",
    "jc",
    "jm",
    "jq",
    "JR",
    "k9",
    "kc",
    "kd",
    "kg",
    "LT",
    "lu",
    "mo",
    "mq",
    "nj",
    "no",
    "Q9",
    "ra",
    "rd",
    "rr",
    "sa",
    "si",
    "ta",
    "tg",
    "tu",
    "tv",
    "vh",
    "ya",
    "yt",
    "gasstationwithoutpumps",
    "programmingwithpurpose",
    "scratchcoder123forlife",
    "scratchteacheralpha001",
    "scratchteacheralpha002",
    "scratchteacheralpha003",
    "scratchteacheralpha004",
    "scratchteacheralpha005",
    "scratchteacheralpha006",
    "scratchteacheralpha007",
    "scratchteacheralpha008",
    "scratchteacheralpha009",
    "scratchteacheralpha010",
    "scratchteacheralpha011",
    "scratchteacheralpha012",
    "scratchteacheralpha013",
    "scratchteacheralpha014",
    "scratchteacheralpha015",
    "scratchteacheralpha016",
    "scratchteacheralpha017",
    "scratchteacheralpha018",
    "scratchteacheralpha019",
    "scratchteacheralpha020",
    "scratchteacheralpha021",
    "scratchteacheralpha022",
    "scratchteacheralpha023",
    "scratchteacheralpha024",
    "scratchteacheralpha025",
    "scratchteacheralpha026",
    "scratchteacheralpha027",
    "scratchteacheralpha028",
    "scratchteacheralpha029",
    "scratchteacheralpha030",
    "scratchteacheralpha031",
    "scratchteacheralpha033",
    "scratchteacheralpha034",
    "scratchteacheralpha035",
    "scratchteacheralpha036",
    "scratchteacheralpha037",
    "scratchteacheralpha038",
    "scratchteacheralpha039",
    "scratchteacheralpha040",
    "scratchteacheralpha041",
    "scratchteacheralpha042",
    "scratchteacheralpha043",
    "scratchteacheralpha044",
    "scratchteacheralpha045",
    "scratchteacheralpha046",
    "scratchteacheralpha047",
    "scratchteacheralpha048",
    "scratchteacheralpha049",
    "scratchteacheralpha050",
    "scratchteacheralpha051",
    "scratchteacheralpha052",
    "scratchteacheralpha053",
    "scratchteacheralpha054",
    "scratchteacheralpha055",
    "scratchteacheralpha056",
    "scratchteacheralpha057",
    "scratchteacheralpha058",
    "scratchteacheralpha059",
    "scratchteacheralpha060",
    "scratchteacheralpha061",
    "scratchteacheralpha063",
    "scratchteacheralpha064",
    "scratchteacheralpha065",
    "scratchteacheralpha066",
    "scratchteacheralpha067",
    "scratchteacheralpha068",
    "scratchteacheralpha069",
    "scratchteacheralpha070",
    "scratchteacheralpha071",
    "scratchteacheralpha072",
    "scratchteacheralpha073",
    "scratchteacheralpha074",
    "scratchteacheralpha075",
    "scratchteacheralpha076",
    "scratchteacheralpha077",
    "Spongebobrectanglepants",
    "gdpr533f604550b2f20900645890",
    "gdpr6d746b4e0e92767d4d76ca39",
    "gdpr86fe38473d91f98d8cf9d247",
    "gdpr8e0f8747d5b59e360814647f",
  ];
  tab.type = "button";
  tab.classList.add("sa-search-profile-btn");
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-selected", false);
  tab.tabIndex = -1; // unselected tabs should only be focusable using arrow keys
  img.src = addon.self.dir + "/user.svg";
  img.className = "tab-icon sa-search-profile-icon";
  span.innerText = msg("profile");
  addon.tab.displayNoneWhileDisabled(tab);

  const setInvalidUsername = () => {
    tab.disabled = true;
    tab.title = msg("invalid-username", { username: user });
  };

  // Check if a valid username is entered
  if (valid || exceptions.includes(user)) {
    tab.addEventListener("click", () => {
      location = `/users/${user}/`;
    });
    fetch(`https://api.scratch.mit.edu/users/${user}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "NotFound") {
          setInvalidUsername();
        } else if (!data.code) {
          span.innerText = "@" + data.username;
          img.src = data.profile.images["32x32"];
          img.onload = () => img.classList.add("sa-search-profile-profilepic");
        }
      });

    nav.addEventListener("keydown", (event) => {
      // Keyboard navigation
      // Modified code from scratch-www/src/components/tabs/tabs.jsx
      if (!["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) {
        return;
      }
      const tabElements = Array.from(nav.children);
      const focusedIndex = tabElements.findIndex((el) => el === document.activeElement);
      if (focusedIndex === -1) return;
      event.preventDefault();
      // Disable Scratch's event listener, which is set on the parent element
      event.stopPropagation();
      if (event.key === "ArrowLeft") {
        let nextIndex;
        if (focusedIndex === 0) {
          nextIndex = tabElements.length - 1;
        } else {
          nextIndex = focusedIndex - 1;
        }
        tabElements[nextIndex].focus();
      } else if (event.key === "ArrowRight") {
        let nextIndex;
        if (focusedIndex === tabElements.length - 1) {
          nextIndex = 0;
        } else {
          nextIndex = focusedIndex + 1;
        }
        tabElements[nextIndex].focus();
      } else if (event.key === "Home") {
        tabElements[0].focus();
      } else if (event.key === "End") {
        tabElements.at(-1).focus();
      } else if (event.key === "Enter" || event.key === " ") {
        tabElements[focusedIndex].click();
      }
    });
  } else {
    setInvalidUsername();
  }
}
