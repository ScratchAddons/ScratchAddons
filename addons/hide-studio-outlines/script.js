function checkforstudio() {
    if (document.querySelector('.lazy') === null) {
window.setTimeout(checkforstudio(), 100)
    } else {
const highlightedItems = document.querySelectorAll('.image')

highlightedItems.forEach(function(item) {
item.style.border = '0px'
})
}
}
checkforstudio()
