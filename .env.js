const path = require('path');

// Environment variables with which to execute casperjs
module.exports = {
  PHANTOMJS_EXECUTABLE: process.platform === 'win32'
    ? path.resolve(process.cwd(), './node_modules/.bin/phantomjs.cmd')
    : path.resolve(process.cwd(), './node_modules/.bin/phantomjs'),
  SLIMERJS_EXECUTABLE: process.platform === 'win32'
    ? path.resolve(process.cwd(), './node_modules/.bin/slimerjs.cmd')
    : path.resolve(process.cwd(), './node_modules/.bin/slimerjs'),
  SLIMERJSLAUNCHER: 'C:/Program Files (x86)/Mozilla Firefox/firefox.exe'
};
