/*
export default async function ({ addon, console }) {
    const ENABLED = true;
    if (!ENABLED) return;
    function sub_class(old_name, new_name){
        const avatars = document.querySelectorAll("."+old_name);
        console.log(avatars)
        avatars.forEach(element => {
            element.classList.add(new_name);
            element.classList.remove(old_name);

        });
    }
    function hide(){
        sub_class("avatar-badge", "avatar-badge-disabled");
        sub_class("avatar-badge-wrapper", "avatar-badge-wrapper-disabled");
    }
    function show(){
        sub_class("avatar-badge-disabled", "avatar-badge");
        sub_class("avatar-badge-wrapper-disabled", "avatar-badge-wrapper");
    }
    function update(){
        if (!ENABLED) return;
        if (addon.settings.get("avatars") === true){
            hide()
        } else {
            show()
        }
    }
    update()
    addon.settings.addEventListener("change", update)
}
*/
