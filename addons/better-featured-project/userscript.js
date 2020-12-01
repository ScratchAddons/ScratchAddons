
export default async function ({ addon, global, console, msg }) {
    function createBetterProfilePage(featuredThumb, featuredLink, featuredHeading, featuredTitle) {
        document.documentElement.style.setProperty('--featured-thumb', `url("${featuredThumb}")`);
        document.documentElement.style.setProperty('--refresh-notice', `\"${msg("refresh-notice")}\"`);
        let profileUsername = document.querySelector('.header-text h2').innerText;
        if (profileUsername.slice(-1) == "*") {
            profileUsername = profileUsername.slice(0, -1);
        }
        let boxHead = document.querySelector('#profile-data .box-head');
        if (featuredLink != '') {
            if (document.querySelector('.user-content .player .title a').innerText.replace(/\s/g, '').length > 0) {
                boxHead.appendChild(document.createElement('div')).setAttribute("id", "better-featured-project-name");
                document.querySelector('#better-featured-project-name').appendChild(document.createElement('h2'));
                document.querySelector('#better-featured-project-name').appendChild(document.createElement('h3'));
                document.querySelector('#better-featured-project-name h2').innerText = featuredHeading;
                document.querySelector('#better-featured-project-name h3').innerText = featuredTitle;
            }
            if (document.querySelector('#featured-project [data-control="edit"]') != null) {
                boxHead.appendChild(document.createElement('div')).setAttribute("class", "buttons");
                document.querySelector('#profile-data .box-head .buttons').appendChild(document.createElement('button')).setAttribute("id", "better-change-featured-project");
                document.querySelector('#better-change-featured-project').innerText = document.querySelector('#featured-project [data-control="edit"]').innerText;
                document.querySelector('#better-change-featured-project').onclick = function () { document.querySelector('#featured-project [data-control="edit"]').click() };
            }
            boxHead.insertAdjacentElement('afterbegin', document.createElement('a')).setAttribute("id", "better-featured-project-overlay");
            document.querySelector('#better-featured-project-overlay').href = featuredLink;
        }
        document.querySelector('.profile-details .location').insertAdjacentText('beforebegin', `(${document.querySelector('.profile-details span:nth-child(2)').title})`);
    }
    if (document.querySelector('.user-content .stage') != null) {
        createBetterProfilePage(document.querySelector('.user-content .stage img').src.slice(0, -11) + '480x360.png', document.querySelector('.user-content .stage a').href, document.querySelector('.featured-project-heading').innerText, document.querySelector('.user-content .player .title a').innerText);
    } else if (document.querySelector('#profile-avatar img') != null) {
        createBetterProfilePage(document.querySelector('#profile-avatar img').src.slice(0, -9) + '1000x1000.png', '', '', '');
    }
}