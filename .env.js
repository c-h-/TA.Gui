const path = require('path');

// Environment variables with which to execute casperjs
module.exports = {
  PHANTOMJS_EXECUTABLE: process.platform === 'win32'
    ? path.resolve(process.cwd(), './node_modules/phantomjs-prebuilt/lib/phantom/bin/phantomjs.exe')
    : path.resolve(process.cwd(), './node_modules/phantomjs-prebuilt/bin/phantomjs')
};
