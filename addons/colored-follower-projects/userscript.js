//Hello! I've been scripting for a while now, but i'm not great at keeping my code clean. I'll try to make it readable, but please excuse my mistakes!
export default async function ({ addon, global, console }) {
    if(addon.auth.isLoggedIn){ // If they are logged in, activate the rest of the code
        var username = "griffpatch" // Default username
        if(addon.settings.get("useother")){ // If using "other scratchers following"
            username = addon.settings.get("useothername") // Set the username to the one provided
        }else{
            username = addon.auth.username // Not using "other scratchers following"? Just set it to your username.
        }

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
    
        var css = '#coloredfollowing { background-color: '+addon.settings.get("color")+'; }' // The css to color the project thumbnail
        var style = document.createElement('style'); //create the style element...
        var following = await getfollowing(0) //Getting the following!
        //Stuff to get the css working
        style.innerHTML = css 
        document.head.appendChild(style);
        style.appendChild(document.createTextNode(css));
        
        //Repeat the following every second, just in case the user clicked "Load more"

        setInterval(() => {
            var elements = document.body.getElementsByClassName('thumbnail-creator'); //Get all creators of every project shown
    
            for (var i = 0; i < elements.length; i++) //For every creator name...
                if(following.includes(elements[i].getElementsByTagName("a")[0].innerText)){ //If we are following them...
                    elements[i].parentElement.parentElement.parentElement.id = "coloredfollowing"; //Make it colored!
                }
        }, 1000);
    }
}