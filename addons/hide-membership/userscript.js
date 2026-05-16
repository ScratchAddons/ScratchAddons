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
  }

removeScratchBadges();

const observer = new MutationObserver(function(mutations) {
  removeScratchBadges();
});

observer.observe(document.body, {
 childList: true,
 subtree: true
});
