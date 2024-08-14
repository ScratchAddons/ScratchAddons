export default async function () {
  const boxHeads = [...document.querySelectorAll('.box .box-head')];
  const boxContents = [...document.querySelectorAll('.box .box-content')];
  const userLinks = [...document.querySelectorAll('a[href^="/users"]')]
  boxHeads[5].style.background = "#855cd6"
  boxHeads[6].style.background = "#855cd6"
  boxHeads[5].style.color = "white"
  boxHeads[6].style.color = "white"
  boxContents[5].style.background = "#cabbed"
  boxContents[6].style.background = "#cabbed"

  userLinks.forEach((link) => {
    link.style.color = "black"
    link.style.padding="2px"
    link.style.borderRadius = "4px"
    link.style.background = "#cabbed"
    innerText = link.innerText
    innerText = innerText.slice(1)
    const userUrl = `https://api.scratch.mit.edu/users/${innerText}`;
    const user = await fetch(userUrl, { method: "HEAD" });

    if (user.status >= 400) {
      link.addEventListener("mouseover", (e) => {
        e.target.setAttribute("data-prev", e.target.innerText);
        e.target.innerText = "User doesn't exist";
      });

      link.addEventListener("mouseout", (e) => {
        e.target.innerText = e.target.getAttribute("data-prev");
      });
    } else {
      try {
        const response = await fetch(userUrl);
        const data = await response.json();

        console.log(data);
        if(data.country = "United States"){
          country = "USA"
        }
        else if(data.country = "United Kingdom"){
          country = "UK"
        }
        else if(data.country = "United Arab Emirates"){
          country = "Emirates"
        }
        else if(data.country = "United States Minor Outlying Islands"){
          country = "US Outlying Islands"
        }
        else if(data.country = "Virgin Islands, U.S."){
          country = "USA"
        }
        else if(data.country = "Virgin Islands, British"){
          country = "British Virgin Islands"
        }
        else if(data.country = "Svalbard and Jan Mayen"){
          country = "Svalbard"
        }
        else if(data.country = "South Georgia and the South Sandwich Islands"){
          country = "South Georgia Islands"
        }
        else{
          country = data.country
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }


  })
}
