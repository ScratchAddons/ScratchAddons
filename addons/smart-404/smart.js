export default async function ({ addon, global, console }) {
    console.log(console);
    if (addon.tab.clientVersion == "scratchr2") {
        let box = document.getElementsByClassName("box-content")[0];
        runBox(box);
    } else {
        let box = document.getElementsByClassName("flex-row inner")[0];
        runBox(box);
    }
    
    
    function runBox(box) {
        let smartbox = document.createElement("div");
        smartbox.className = "sa-smart-error";
        let h1 = document.createElement("h1");
        h1.innerText = location.pathname;
        smartbox.prepend(h1);
        box.prepend(smartbox);
    }
    function calculateTip() {
        let tip = "https://scratch.mit.edu";
        if (tip.endsWith("%")) {
            
        }
    }
}
