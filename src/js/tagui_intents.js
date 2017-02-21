// INTENTS SCRIPT FOR RUNNING TA.GUI FRAMEWORK
// Original by Ken Soh (http://tebel.org)
// Ported from PHP by Charlie Hulcher (https://charlie.engineer)

const path = require('path');

// from https://stackoverflow.com/questions/1303872/trying-to-validate-url-using-javascript
function validateUrl(url) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
}

function abs_file(filename) { // helper function to return absolute filename
  if (!filename.length) {
    return '';
  }
  if (path.isAbsolute(filename)) {
    return filename;
  }
  else {
    // resolve absolute path relative to flow file directory
    return path.resolve(global.parse.flowDir, filename);
  }
}

function beg_tx(locator) { // helper function to return beginning string for handling locators
  return `
    casper.waitFor(function check() {
      return check_tx('${locator}');
    },
    function then() {`;
}

function end_fi() { // helper function to end frame_intent by closing parsed step block
  if (global.parse.insideFrame == 1) {
    global.parse.insideFrame = 0;
    return ` });
      } `;
  }
  else if (global.parse.insideFrame === 2) {
    global.parse.insideFrame = 0;
    return ` });
      });
    } `;
  }
  return '';
}

function end_tx(locator) { // helper function to return ending string for handling locators
  return `},
      function timeout() {
        this.echo('ERROR - cannot find ${locator}').exit();
      });
    }${end_fi()}
  });
  
  casper.then(function() {\n`;
}


/**
 * A set of functions to interpret steps into corresponding casperjs code
 */
module.exports = {
  url: (parsedLine) => {
    const _p = parsedLine.trim();
    if (!validateUrl(_p)) {
      console.log(`Error parsing line:\n${parsedLine}`);
    }
    else {
      if (global.parse.currentLine === 1) {
        global.parse.urlProvided = true;
        return `
        casper.start('${_p}', function () {
          this.echo('${_p}' + ' - ' + this.getTitle() + '\\n');
        });

        casper.then(function() {
        `;
      }
      else {
        return `
        });
        casper.thenOpen('${_p}', function () {
          this.echo('${_p}' + ' - ' + this.getTitle() + '\\n');
        });

        casper.then(function() {
        `;
      }
    }
  },
  tap: (parsedLine) => {
    const _p = parsedLine.trim();
    const params = _p.slice(_p.indexOf(' ') + 1);
    if (_p.indexOf(' ') === -1 || params === '') {
      console.log(`Error: target missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        ${beg_tx(params)}
        this.click(tx('${params}'));
        ${end_tx(params)}
      `;
    }
  },
  hover: (parsedLine) => {
    const _p = parsedLine.trim();
    const params = _p.slice(_p.indexOf(' ') + 1);
    if (_p.indexOf(' ') === -1 || params === '') {
      console.log(`Error: target missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        ${beg_tx(params)}
        this.mouse.move(tx('${params}'));
        ${end_tx(params)}
      `;
    }
  },
  type: (parsedLine) => {
    const _p = parsedLine.trim();
    const sep = ' as ';
    const param1 = _p.slice(_p.indexOf(' ') + ' '.length, _p.indexOf(sep));
    const param2 = _p.slice(_p.indexOf(sep) + sep.length);
    if (_p.indexOf(' ') === -1 || param1 === '' || param2 === '') {
      console.log(`Error: target/text missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        ${beg_tx(param1)}
        this.sendKeys(tx('${param1}'), '${param2}');
        ${end_tx(param1)}
      `;
    }
  },
  read: (parsedLine) => {
    const _p = parsedLine.trim();
    const sep = ' to ';
    const param1 = _p.slice(_p.indexOf(' ') + ' '.length, _p.indexOf(sep));
    const param2 = _p.slice(_p.indexOf(sep) + sep.length);
    if (_p.indexOf(' ') === -1 || param1 === '' || param2 === '') {
      console.log(`Error: target/variable missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        ${beg_tx(param1)}
        ${param2} = this.fetchText(tx('${param1}'));
        ${end_tx(param1)}
      `;
    }
  },
  show: (parsedLine) => {
    const _p = parsedLine.trim();
    const params = _p.slice(_p.indexOf(' ') + 1);
    if (_p.indexOf(' ') === -1 || params === '') {
      console.log(`Error: target missing for line: ${_p}`);
    }
    else {
      return `{
        // nothing to do on this line
        ${beg_tx(params)}
        this.echo('${_p}' + ' - ' + this.fetchText(tx('${params}')));
        ${end_tx(params)}
      `;
    }
  },
  download: (parsedLine) => {
    const _p = parsedLine.trim();
    const sep = ' to ';
    const param1 = _p.slice(_p.indexOf(' ') + ' '.length, _p.indexOf(sep));
    const param2 = _p.slice(_p.indexOf(sep) + sep.length);
    if (_p.indexOf(' ') === -1 || param1 === '' || param2 === '') {
      console.log(`Error: url/filename missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        this.download('${param1}', '${abs_file(param2)}');
      }
      ${end_fi()}
      `;
    }
  },
  receive: (parsedLine) => {
    const _p = parsedLine.trim();
    const sep = ' to ';
    const param1 = _p.slice(_p.indexOf(' ') + ' '.length, _p.indexOf(sep));
    const param2 = _p.slice(_p.indexOf(sep) + sep.length);
    if (_p.indexOf(' ') === -1 || param1 === '' || param2 === '') {
      console.log(`Error: resource/filename missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        casper.on('resource.received', function(resource) {
          if (resource.stage !== 'end') {
            return;
          }
          if (resource.url.indexOf('${param1}') > -1) {
            this.download(resource.url, '${abs_file(param2)}');
          }
        });
        this.download('${param1}', '${abs_file(param2)}');
      }
      ${end_fi()}
      `;
    }
  },
  echo: (parsedLine) => {
    const _p = parsedLine.trim();
    const params = _p.slice(_p.indexOf(' ') + 1);
    if (_p.indexOf(' ') === -1 || params === '') {
      console.log(`Error: text missing for line: ${_p}`);
    }
    else {
      return `{
        this.echo('${_p}');
        ${end_fi()}
      `;
    }
  },
  save: (parsedLine) => {
    const _p = parsedLine.trim();
    const sep = ' to ';
    const params = _p.slice(_p.indexOf(' ') + 1);
    const param1 = _p.slice(_p.indexOf(' ') + ' '.length, _p.indexOf(sep));
    const param2 = _p.slice(_p.indexOf(sep) + sep.length);
    if (params === '') {
      console.log(`Error: target missing for line: ${_p}`);
    }
    else if (_p.indexOf(sep) > -1) {
      return `{
        this.echo('${_p}');
        ${beg_tx(param1)}
        save_text('${abs_file(param2)}', this.fetchText(tx('${param1}')));
        ${end_tx(param1)}
      `;
    }
    else {
      return `{
        this.echo('${_p}');
        ${beg_tx(params)}
        save_text('', this.fetchText(tx('${params}')));
        ${end_tx(params)}
      `;
    }
  },
  dump: (parsedLine) => {
    const _p = parsedLine.trim();
    const sep = ' to ';
    const params = _p.slice(_p.indexOf(' ') + 1);
    const param1 = _p.slice(_p.indexOf(' ') + ' '.length, _p.indexOf(sep));
    const param2 = _p.slice(_p.indexOf(sep) + sep.length);
    if (params === '') {
      console.log(`Error: variable missing for line: ${_p}`);
    }
    else if (_p.indexOf(sep) > -1) {
      return `{
          this.echo('${_p}');
          save_text('${abs_file(param2)}', '${param1}');
        }
        ${end_fi()}
      `;
    }
    else {
      return `{
          this.echo('${_p}');
          save_text('', '${params}');}
        ${end_fi()}
      `;
    }
  },
  wait: (parsedLine) => {
    const _p = parsedLine.trim();
    const inputParams = _p.slice(_p.indexOf(' ') + 1);
    const params = inputParams.length ? inputParams : '5';
    if (global.parse.insideFrame !== 0) {
      console.log(`Error: invalid after frame for line: ${_p}`);
    }
    else {
      return `
          this.echo('${_p}');
        });
        
        casper.wait(${parseFloat(params) * 1000}, function () {
      `;
    }
  },
}