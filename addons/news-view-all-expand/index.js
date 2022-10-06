export default async function ({addon, global, console}) {
    if(location.pathname==="/") {
        var ct=await addon.tab.waitForElement(".splash-header .box.news");
        var element=ct.querySelector('ul');
        var a=ct.querySelector('.box-header a');
        var extras=document.createElement('div');
        extras.style.height='0px';
        extras.style.overflow='hidden';
        element.appendChild(extras);
        extras.className="sa-bnva-container"
        var content = document.createElement('div'); // we need to see the content height
        var isOpen=false;
        extras.appendChild(content)
        try {
            var newsraw=await fetch("https://api.scratch.mit.edu/news?offset=3");
            var news=await newsraw.json();
            news.forEach(entry=>{
                var li=document.createElement('li');
                li.innerHTML=`<a href="${entry.url}">
                    <img alt="" class="news-image" height="53" src="${entry.image}" width="53">
                    <div class="news-description">
                        <h4>${entry.headline}</h4>
                        <p>${entry.copy}</p>
                    </div>
                </a>`;
                content.appendChild(li);
            });
        } catch (error) {
            console.warn('failed to load news');
        }
        content.style.width='100%';
        extras.style.width='100%';
        var o=document.createElement("div");
        o.className='load-more-wh-container'
        o.innerHTML=`<button class="load-more-wh button">View in Forums</button>`;
        content.appendChild(o);
        o.style.marginTop='5px';
        o.querySelector('button').onclick=()=>{open("https://scratch.mit.edu/discuss/5/")}
        a.innerText='Show More'
        a.onclick=function(e){
            e.preventDefault();
            if(isOpen) {
                extras.style.height='0px';
                a.innerText='Show More'
            } else {
                extras.style.height=`${content.offsetHeight}px`;
                a.innerText='Show Less'
            }
            isOpen=!isOpen
        }
        if(addon.settings.get('animation')) {
            extras.style.transition="1s";
        }
        addon.settings.addEventListener('change',function() {
            if(addon.settings.get('animation')) {
                extras.style.transition="1s";
            } else {
                extras.style.transition="none";
            }
        })
    }
}
