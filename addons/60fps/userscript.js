export default async function ({ addon, global, console }) {
    console.log('60fps')
    

    const vm = addon.tab.traps.onceValues.vm

    addon.tab.waitForElement('img.green-flag_green-flag_1kiAo')
    .then(button=>{
        var mode = true
        button.addEventListener('click', e=>{
            if(e.ctrlKey){
                e.preventDefault()
                mode = !mode
                vm.setCompatibilityMode(mode)
                
                if(mode){
                    button.style.filter = ''
                } else {
                    //60fps
                    button.style.filter = 'hue-rotate(90deg)'
                }
            }
        })
    })
}
