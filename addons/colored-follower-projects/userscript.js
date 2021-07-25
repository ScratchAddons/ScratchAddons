export default async function ({ addon, global, console }) {
    console.log("Running")
    if(addon.auth.isLoggedIn){ // If they are logged in, activate the rest of the code
        var username = addon.auth.username // Get the username

        async function getfollowing(offset) { // Async function to get an array of following using the scratch api.
            return new Promise((resolve, reject) => {
                var returned = [] //What the function will return
                fetch("https://api.scratch.mit.edu/users/"+username+"/following?offset="+offset+"&limit=40").then(async function(resp){ //Fetch 40 results from the scratch servers
                    resp = await resp.json() //Make it JSON
                    for (let i = 0; i < resp.length; i++) { //For all following
                        returned.push(resp[i].username) //Add their username to the returned array
                    }
                    if(returned.length == 40){
                        //Because of scratch limits, we can only get 40 following at a time. If there are more following we have to get, call the function again
                        returned = returned.concat(await getfollowing(offset+40))
                    }
                    resolve(returned) //Return the array
                });
            })
        }
    
        
        var following = await getfollowing(0) //Getting the following!

        while (true) {
            const element = await addon.tab.waitForElement("div.thumbnail-creator",{
                markAsSeen: true,
            });
            if(following.includes(element.querySelector("a").innerText)){ //If we are following them...
                element.parentElement.parentElement.parentElement.style.backgroundColor = addon.settings.get("color")
            }
          }
    }
}
