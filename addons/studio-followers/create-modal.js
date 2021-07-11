export default function(addon, title) {
    const overlay = Object.assign(document.createElement('div'), {
        className: "modal-overlay"
    })

    const div = Object.assign(document.createElement('div'), {
        className: "modal-content sa-followers-modal",
        tabindex: "-1",
        role: "dialog"
    })

    const closeBtnContainer = document.createElement('div')
    closeBtnContainer.className = 'modal-content-close'
    const closeBtn = Object.assign(document.createElement('img'), {
        src: addon.self.dir + '/close.svg',
        alt: 'close-icon',
        className: 'modal-content-close-img',
        draggable: 'false'
    })

    function close() {
        overlay.style.display = "none"
    }

    closeBtnContainer.addEventListener('click', close)
    closeBtnContainer.appendChild(closeBtn)
    div.appendChild(closeBtnContainer)

    const titleEl = document.createElement('div')
    titleEl.className = 'modal-title sa-followers-modal-title modal-header'
    titleEl.innerText = title
    div.appendChild(titleEl)

    const main = document.createElement('div')
    main.className = 'modal-inner-content sa-followers-modal-content'

    const grid = document.createElement('div')
    grid.className = 'sa-followers-modal-grid'

    main.appendChild(grid)

    div.appendChild(main)

    overlay.appendChild(div)

    // By default, hide the screen

    close()
    
    return overlay
}