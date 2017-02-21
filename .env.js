const fs = require('fs');
const path = require('path');
const username = require('username');

function getFirefoxPath() {
  const potentialPaths = [
    'C:/Program Files/Mozilla Firefox/firefox.exe',
    'C:/Program Files (x86)/Mozilla Firefox/firefox.exe',
    `C:/Users/${username.sync()}/AppData/Local/Mozilla Firefox/firefox.exe`,
  ];
  for (const i in potentialPaths) {
    if (fs.existsSync(potentialPaths[i])) {
      return potentialPaths[i];
    }
  }
}


// Environment variables with which to execute casperjs
const ENV_VARS = {
  PHANTOMJS_EXECUTABLE: process.platform === 'win32'
    ? path.resolve(process.cwd(), './node_modules/.bin/phantomjs.cmd')
    : path.resolve(process.cwd(), './node_modules/.bin/phantomjs'),
  SLIMERJS_EXECUTABLE: process.platform === 'win32'
    ? path.resolve(process.cwd(), './node_modules/.bin/slimerjs.cmd')
    : path.resolve(process.cwd(), './node_modules/.bin/slimerjs'),
};

// On windows firefox can be in many places. Find it and set as environment variable
if (process.platform === 'win32') {
  ENV_VARS.SLIMERJSLAUNCHER = getFirefoxPath() || 'firefox';
}

module.exports = ENV_VARS;
