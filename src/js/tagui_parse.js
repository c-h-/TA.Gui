
const fs = require('fs-extra');
const path = require('path');
const pathExists = require('path-exists');

/**
 * Parse flow file into casperjs JS code
 */
module.exports = function(options) {
  const pathToFlow = path.resolve(process.cwd(), options.filename);
  const pathIsGood = new Promise((resolve, reject) => {
    pathExists(pathToFlow).then((exists) => {
      if (exists) {
        resolve();
      }
      else {
        reject();
      }
    });
  });
}