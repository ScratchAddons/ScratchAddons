export default async function ({ addon, console }) {
    console.log('123')
    if (addon.settings.get("flairs") === true){
        console.log('456')
        const remove_class = class_name => {
            const avatars = document.querySelectorAll("."+class_name);
            console.log(avatars)
            avatars.forEach(element => {
                element.classList.remove(class_name);
            });
        }
        remove_class("avatar-badge-wrapper");
        remove_class("avatar-badge");
    }
}
