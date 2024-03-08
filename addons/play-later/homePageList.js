import { removeFromList, getList } from './list.js';

const projectSpace = 174;

export default function ({addon, console, msg}) {
    const boxContainer = document.querySelectorAll('.inner.mod-splash')[1];

    let newBox = document.createElement('div');
    newBox.classList.add('box');

    // Box header
    let boxHeader = document.createElement('div');
    boxHeader.classList.add('box-header');

    let heading = document.createElement('h4');
    heading.textContent = msg('play-later-title');
    boxHeader.appendChild(heading);

    newBox.appendChild(boxHeader);

    // Box content
    let boxContent = document.createElement('div');
    boxContent.classList.add('box-content');

    let carousel = document.createElement('div');
    carousel.classList.add('slick-initialized', 'slick-slider', 'carousel');

    // Make an arrow button that moves the slick track
    function createScrollButton(direction) {
        let scrollButton = document.createElement('button');
        scrollButton.type = 'button';
        scrollButton.dataset.role = 'none';
        scrollButton.classList.add('slick-arrow', `slick-${direction}`, 'slick-disabled');
        scrollButton.textContent = ' ' + msg('previous');
        scrollButton.addEventListener('click', direction === 'prev' ? scrollLeft : scrollRight);
        return scrollButton;
    }

    carousel.appendChild(createScrollButton('prev'));

    let slickList = document.createElement('div');
    slickList.classList.add('slick-list');

    let slickTrack = document.createElement('div');
    slickTrack.classList.add('slick-track', 'sa-play-later-track');
    slickTrack.style.transform = 'translate3d(0px, 0px, 0px)';
    slickTrack.style.width = '0px';

    // Make track arrows invisible if no projects added
    function handleArrowVisibility() {
        if (!slickTrack.querySelector('.project')) {
            carousel.querySelectorAll('.slick-arrow').forEach((arrow) => {
                arrow.style.display = 'none';
            });
        }
    }

    // Check if projects are added every time the user clicks a project (removing it from list)
    new MutationObserver(handleArrowVisibility).observe(slickTrack, {childList: true});

    slickList.appendChild(slickTrack);
    carousel.appendChild(slickList);
    carousel.appendChild(createScrollButton('next'));
    boxContent.appendChild(carousel);
    newBox.appendChild(boxContent);

    // Carousel > Buttons
    let isScrolling = false;

    // Get translate3d values of slick track
    function getTrackTransformValues() {
        let transform = slickTrack.style.transform;
        let transformValues = transform.split('(')[1].split(')')[0].split(',').map(value => parseFloat(value.replace(' ', '').replace('px', '')));
        return transformValues;
    }

    // Get carousel width
    function carouselWidth() {
        return parseFloat(getComputedStyle(carousel).width.replace('px', ''));
    }

    // Get number of projects to shift track over by
    function projectsMoved() {
        return Math.floor(carouselWidth() / projectSpace);
    }

    // Make track move smoothly
    function setTrackTransition() {
        slickTrack.style.transition = '-webkit-transform 500ms ease 0s';
        setTimeout(() => {
            slickTrack.style.transition = null;
            isScrolling = false;
        }, 500);
    }

    // Scroll project track right
    function scrollRight() {
        if (isScrolling) return;

        const transformValues = getTrackTransformValues();
        const projectCount = slickTrack.querySelectorAll('.project').length;

        if (transformValues[0] + projectSpace * projectCount <= carouselWidth()) return;

        isScrolling = true;

        slickTrack.style.transform = `translate3d(${transformValues[0] - projectsMoved() * projectSpace}px, 0px, 0px)`;
        setTrackTransition();
    }
    
    // Scroll project track left
    function scrollLeft() {
        if (isScrolling) return;
        const transformValues = getTrackTransformValues();
        if (transformValues[0] >= 0) return;

        isScrolling = true;

        slickTrack.style.transform = `translate3d(${Math.min(transformValues[0] + projectsMoved() * projectSpace, 0)}px, 0px, 0px)`;
        setTrackTransition();
    }

    // Projects
    const list = getList();
    list.forEach((id) => {
        const projectPath = `/projects/${id}`;

        let projectElt = document.createElement('div');
        projectElt.classList.add('thumbnail', 'project', 'slick-slide', 'slick-active');

        function makeRemoveLink(link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                removeFromList(id);
                link.closest('.project').remove();
                const newTab = e.ctrlKey || e.shiftKey ||  e.metaKey || (e.button && e.button === 1);
                window.open(link.href, newTab ? '_blank' : '_self');
            });
        }

        // Thumbnail
        let thumbnailContainer = document.createElement('a');
        thumbnailContainer.classList.add('thumbnail-image');
        thumbnailContainer.href = projectPath;
        makeRemoveLink(thumbnailContainer);

        let thumbnailImg = document.createElement('img');
        thumbnailImg.src = `//uploads.scratch.mit.edu/projects/thumbnails/${id}.png`;

        thumbnailContainer.appendChild(thumbnailImg);

        // Info
        let infoContainer = document.createElement('div');
        infoContainer.classList.add('thumbnail-info');

        // Info > Title
        let titleContainer = document.createElement('div');
        titleContainer.classList.add('thumbnail-title');

        let titleLink = document.createElement('a');
        titleLink.href = projectPath;
        makeRemoveLink(titleLink);

        titleContainer.appendChild(titleLink);
        infoContainer.appendChild(titleContainer);

        // Info > Creator
        let creatorContainer = document.createElement('div');
        creatorContainer.classList.add('thumbnail-creator');
        
        let creatorLink = document.createElement('a');

        creatorContainer.appendChild(creatorLink);
        infoContainer.appendChild(creatorContainer);

        // Set project name, URL and author
        fetch(`https://api.scratch.mit.edu/projects/${id}`)
            .then(data => data.json())
            .then((info) => {
                titleLink.textContent = info.title;

                const creator = info.author.username;
                creatorLink.href = `/users/${creator}`;
                creatorLink.textContent = creator;
            });

        // Add parts to project element
        projectElt.appendChild(thumbnailContainer);
        projectElt.appendChild(infoContainer);

        // Add project element to slick list
        let width = parseFloat(slickTrack.style.width.replace('px', ''));
        slickTrack.style.width = width + projectSpace + 'px';
        slickTrack.appendChild(projectElt);
    });

    // Hide arrows if no projects added at start
    handleArrowVisibility();

    // Add box to container
    boxContainer.appendChild(newBox);
}