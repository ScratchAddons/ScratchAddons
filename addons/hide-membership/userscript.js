function removeScratchBadges() {
const membershipInComments = document.querySelectorAll('.avatar-wrapper.avatar-badge-wrapper');
const membershipOnProfilePicture = document.querySelectorAll('.user-icon.avatar-badge');
const membershipOnProfilePictureAlt = document.querySelectorAll('.avatar.avatar-badge');

membershipInComments.forEach(function(el) {
  el.classList.remove('avatar-badge-wrapper');
  });

membershipOnProfilePictureAlt.forEach(function(el) {
  el.classList.remove('avatar-badge-wrapper');
  });

membershipOnProfilePicture.forEach(function(el) {
  el.classList.remove('avatar-badge');
  });

const targetBanner = document.querySelector('.become-member-container');
  if (targetBanner) {
  targetBanner.outerHTML = `
  <div class="title-banner donate-banner">
   <img aria-hidden="true" class="donate-icon" src="/images/ideas/try-it-icon.svg">
  <div class="donate-central-items">
   <p class="donate-text"><span>Scratch is a nonprofit that relies on donations to keep our platform free for all kids. Your gift of $5 will make a difference.</span></p>
   <a href="https://www.scratchfoundation.org/donate" class="button donate-button">
    <span>Donate</span>
   </a>
</div>
 </div>
 <button class="button donate-close-button forms-close-button" name="closeButton" type="button">
 <img alt="close-icon" class="modal-content-close-img" draggable="false" src="/svgs/modal/close-x.svg">
 </button>
</div>
`;
  }
}

removeScratchBadges();

const observer = new MutationObserver(function(mutations) {
  removeScratchBadges();
});

observer.observe(document.body, {
 childList: true,
 subtree: true
});
