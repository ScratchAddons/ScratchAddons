import "../../libraries/linkify.js"
import "../../libraries/linkify-jquery.js"

export default async function ({ addon, global, console }) {
    $('p').linkify()
    $('div').linkify()
}