import { getLanguage } from "../libraries/common/settings-page-apis.js";
import getDirection from "./rtl-list.js";

const lang = getLanguage();
document.documentElement.lang = lang
document.body.dir = getDirection(lang);
