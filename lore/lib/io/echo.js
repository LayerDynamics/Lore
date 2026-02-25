export function echo(msg) {
  console.log(msg);
}

export function info(msg) {
  console.log(`\x1b[36m[info]\x1b[0m ${msg}`);
}

export function success(msg) {
  console.log(`\x1b[32m[ok]\x1b[0m ${msg}`);
}

export function warn(msg) {
  console.log(`\x1b[33m[warn]\x1b[0m ${msg}`);
}

export function error(msg) {
  console.log(`\x1b[31m[error]\x1b[0m ${msg}`);
}
