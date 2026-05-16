function removeScratchBadges() {
const membershipInComments = document.querySelectorAll('.avatar-wrapper.avatar-badge-wrapper');
const membershipOnProfilePicture = document.querySelectorAll('.user-icon.avatar-badge');
const membershipOnProfilePicture2 = document.querySelectorAll('.avatar.avatar-badge');
const membershipProfileImage = document.querySelectorAll('[src*="membership-badge.svg"]');
const membershipMemberBadge = document.querySelectorAll('.membership-label-container');
const membershipLinks = document.querySelectorAll('[href="https://www.scratchfoundation.org/membership"]');

membershipInComments.forEach(function(el) {
  el.classList.remove('avatar-badge-wrapper');
  });

membershipOnProfilePicture2.forEach(function(el) {
  el.classList.remove('avatar-badge-wrapper');
});

membershipOnProfilePicture.forEach(function(el) {
  el.classList.remove('avatar-badge');
  });

membershipProfileImage.forEach(function(el) {
  el.style.display = 'none';
  });

membershipMemberBadge.forEach(function(el) {
   el.style.display = 'none';
  });

membershipLinks.forEach(function(el) {
   el.style.display = 'none';  
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
