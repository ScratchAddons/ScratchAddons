export const KB = 1000;
export const MB = 1000 * KB;
// from my testing, a 9999999 byte long wav file can be saved,
// but a 10000000 byte one can't
export const ASSET_SIZE_LIMIT = 10 * MB - 1;
// prevent the project file sizes dialog from
// displaying it as 9.999MB
export const VISIBLE_ASSET_SIZE_LIMIT = 10 * MB;

// source: https://scratch.mit.edu/discuss/post/6084224
// apparently the project.json size limit is in mebibytes
// instead of megabytes for some reason
// from my testing, a 5242880 byte long project.json
// CAN be saved, unlike assets
export const KiB = 1024;
export const MiB = 1024 * KiB;
export const PROJECT_SIZE_LIMIT = 5 * MiB;

// converts a number of bytes into a human-friendly display string
export function getSizeString(bytes, isMebi = false, precision = 100) {
  let number, measurement;

  if (isMebi) {
	if (bytes < KiB) {
	  number = bytes;
	  measurement = "B";
	} else if (bytes < MiB) {
	  number = Math.floor((bytes / KiB) * precision) / precision;
	  measurement = "KiB";
	} else {
	  number = Math.floor((bytes / MiB) * precision) / precision;
	  measurement = "MiB";
	}
  } else {
	if (bytes < KB) {
	  number = bytes;
	  measurement = "B";
	} else if (bytes < MB) {
	  number = Math.floor((bytes / KB) * precision) / precision;
	  measurement = "KB";
	} else {
	  number = Math.floor((bytes / MB) * precision) / precision;
	  measurement = "MB";
	}
  }

  return `${number}${measurement}`;
}