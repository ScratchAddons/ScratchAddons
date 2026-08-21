// This module helps to ensure authentication data is passed safely.
// The following whitelist defines the places where it is safe to pass account data into.
// This is important for developers using SA on localhost, which may not always
// contain trusted content.
const trustedOrigins = ["https://scratch.mit.edu"];

export function isTrustedOrigin(url) {
  return trustedOrigins.includes(new URL(url).origin);
}

// This is the placeholder value for globalState.auth which should be the substitute
// when sending data to a content script in an untrusted context, such as localhost.
export const guestUser = {
  isLoggedIn: false,
  username: null,
  userId: null,
  xToken: null,
  csrfToken: null,
  scratchLang: navigator.language,
};
