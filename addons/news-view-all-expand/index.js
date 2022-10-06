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
        function splitBy3(e) {
            var g=[];
            var o=[];
            for(var i=0;i<e.length;i+=3) {
                g=[];
                if(e[i]) {
                    g.push(e[i])
                }
                if(e[i+1]) {
                    g.push(e[i+1])
                }
                if(e[i+2]) {
                    g.push(e[i+2])
                }
                o.push(g)
            }
            return o
        }
        try {
            var newsraw=await fetch("https://api.scratch.mit.edu/news?offset=3");
            var news=await newsraw.json();
            var page=0;
            var pages=0;
            splitBy3(news).forEach((section,i)=>{
                var content=document.createElement('div');
                pages++
                content.dataset.index=i
                content.style.width="100%";
                section.forEach(entry=>{
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
                extras.appendChild(content)
            });
            function loadPage() {
                var height=0;
                for(var i=0;i<page;i++) {
                    if(extras.querySelector(`div[data-index="${i}"]`)) {
                        height+=extras.querySelector(`div[data-index="${i}"]`).offsetHeight
                    }
                }
                extras.style.height=`${height}px`
                if(addon.settings.get('animation')) {
                    var x=0;
                    var o=setInterval(function(){
                        if(x>=110) {
                            clearInterval(o)
                        } else {
                            x++
                            window.scrollTo({
                                top: extras.offsetHeight-20,
                            })
                        }
                    });
                } else {
                    window.scrollTo(0,extras.offsetHeight-20)
                }
            }
            extras.style.width='100%';
            var lmsl=document.createElement("div");
            lmsl.className='load-more-wh-container'
            lmsl.innerHTML=`<button class="load-more-wh button">Show More</button><button style="margin-top: 5px;" class="load-more-wh button">Show Less</button>`;
            element.appendChild(lmsl);
            lmsl.style.marginTop='5px';
            a.onclick=function(){
                if(addon.settings.get('forumnt')) {
                    e.preventDefault()
                    open("https://scratch.mit.edu/discuss/5")
                }
            }
            lmsl.querySelectorAll("button")[0].onclick=function(e){
                e.preventDefault();
                if(page<pages) {
                    page++;
                    loadPage()
                }
            }
            lmsl.querySelectorAll("button")[1].onclick=function(e){
                e.preventDefault();
                if(page>0) {
                    page--;
                    loadPage()
                }
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
        } catch (error) {
            console.warn('failed to load news');
        }
    }
}
