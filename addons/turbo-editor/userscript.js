export default async function({ addon, global, console }) {
    console.log("Turbowarp Scratch Mod (c) 2020 YOYITsM3M8 has loaded");
    var current_url = document.location; // get url
    var id = current_url.href.split('/')[4]; // get project id from url
    function check() { // check if page loaded
        const el = document.querySelector('.stage-wrapper_stage-wrapper_2bejr');
        try {
            if (el.classList[0] == "stage-wrapper_stage-wrapper_2bejr") {
                el.removeChild(el.childNodes[0]);
                el.removeChild(el.childNodes[0]);
                var turboframe = document.createElement("iframe");
                turboframe.src="https://turbowarp.org/embed.html#"+id;
                turboframe.width="482.22";
                turboframe.height="406.22";
                el.appendChild(turboframe); 
            } else {
                setTimeout(check, 300); // try again in 300 milliseconds
            }
        }
        catch(err) {setTimeout(check, 300);console.log(err);/* try again in 300 milliseconds */}
    }
    check()

};
