// PARSER SCRIPT FOR RUNNING TA.GUI FRAMEWORK
// Ported from PHP by Charlie Hulcher (https://charlie.engineer)

const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

const intents = require('./tagui_intents');
const env = require('../../.env');

global.parse = {
  urlProvided: false,
  currentLine: 0,
  insideFrame: 0,
  flowDir: null,
};

const cachedData = {
  repo_count: 0,
};

/**
 * Gets a file's contents and caches it in _data
 */
function getFile(pathToFile, key) {
  return new Promise((resolve, reject) => {
    fs.readFile(pathToFile, (err, data) => {
      if (err) {
        reject('Could not read flow file');
      }
      else {
        cachedData[key] = data.toString();
        resolve();
      }
    });
  });
}

/**
 * Checks if the passed line is code
 */
function isCode(parsedLine) {
  const validSignatures = [
    'var ',
    'do ',
    '{',
    '}',
    'if ',
    'else ',
    'for ',
    'while ',
    'switch ',
    'case ',
    'break;',
    'function ',
    'casper.',
    'this.',
    'test.',
    '//',
  ];
  validSignatures.forEach((sign) => {
    if (parsedLine.indexOf(sign) === 0) {
      return true;
    }
  });
  if (parsedLine.slice(-1) === ';') {
    return true;
  }
  return false;
}

/**
 * Gets intent from a line
 */
function getIntent(parsedLine) {
  const _p = parsedLine.toLowerCase();
  // list out intents and conditions that match the intent
  const intents = [
    ['http://', 'https://'],
    ['tap ', 'click '],
    ['hover ', 'move '],
    ['type ', 'enter '],
    ['read ', 'fetch '],
    ['show ', 'print '],
    ['down ', 'load '],
    'receive ',
    'echo ',
    'save ',
    'dump ',
    'snap ',
    'wait ',
    'check ',
    'test ',
    'frame ',
    'api ',
    'js '
  ];
  // for each intent, check each condition to see if it begins parsedLine.
  // if it does, return the intent
  function checkIntents(withSpaces) {
    let toReturn = false;
    intents.forEach((intent) => {
      const conditions = Array.isArray(intent) ? intent : [intent];
      conditions.forEach((condition) => {
        const conditionToCheck = withSpaces ? condition : condition.replace(' ', '');
        if (_p.indexOf(conditionToCheck) === 0) {
          // return intent without spaces
          const withoutSpaces = conditions[0].replace(' ', '');
          toReturn = withoutSpaces === 'http://' ? 'url' : withoutSpaces;
        }
      });
    });
    return toReturn;
  }
  // first set of conditions check for valid keywords with their parameters
  const firstTry = checkIntents(true);
  if (firstTry) {
    return firstTry;
  }
  // second set of conditions check for valid keywords with missing parameters
  const secondTry = checkIntents(false);
  if (secondTry) {
    return secondTry;
  }
  // final check for recognized code before returning error 
  return isCode(parsedLine) ? 'code' : 'error';
}

/**
 * Parses the intent of a line of the flow file
 */
function parseIntent(scriptLine, lineNumber) {
  // set current line number
  global.parse.currentLine = lineNumber + 1;
  let parsedLine = scriptLine;
  // ignore empty lines
  if (!parsedLine || parsedLine.trim() === '') {
    return '';
  }
  // check existence of objects or keywords by searching for `object or keyword name`, then expand from repository 
  if (parsedLine.split('`').length === 2) { // check for even number of `
    // TODO implement 
    console.log(`Warn: Repositories and Data Tables currently not supported: ${parsedLine}`);
    return parsedLine;
  }
  if (!parsedLine || parsedLine.trim() === '') {
    return '';
  }

  const intent = getIntent(parsedLine);
  if (typeof intents[intent] === 'function') {
    return intents[intent](parsedLine);
  }
  else {
    console.log(`Error: Cannot understand line:\n\t${parsedLine}`);
  }
}

/**
 * Execute written Casper file
 */
function executeCasper(pathToOutput) {
  console.log('executing casper');
  const suffix = process.platform === 'win32' ? '.exe' : '';
  const pathToCasper = path.resolve(process.cwd(), `./node_modules/casperjs/bin/casperjs${suffix}`);
  console.log('path', pathToCasper);
  const child = shell.exec(`${pathToCasper} ${pathToOutput} --verbose`, {
    async: true,
    env,
  });
  child.stdout.on('data', (data) => {
    console.log(`[casperjs] ${data.toString()}`);
  });
}

/**
 * Writes contents
 */
function writeCasperFile(pathToOutput) {
  const contents = `
    /* OUTPUT CASPERJS SCRIPT FOR TA.GUI FRAMEWORK ~ TEBEL.ORG */\n
    var casper = require('casper').create();
    ${cachedData.config || ''}
    ${cachedData.header || ''}
    var flow_path = '${pathToOutput.slice(0, pathToOutput.lastIndexOf(path.sep))}';
    ${cachedData.flow.split('\n').map(parseIntent).join('\n')}
    ${cachedData.footer || ''}
  `;
  fs.writeFile(pathToOutput, contents, (err) => {
    if (err) {
      console.log(`Error writing output: ${err}`);
    }
    else {
      if (!global.parse.urlProvided) {
        console.log('Error: First line of input file not URL');
      }
      console.log(`Wrote Casper file to ${pathToOutput}`);
      executeCasper(pathToOutput);
    }
  })
}

/**
 * Parse flow file into casperjs JS code
 */
module.exports = function(options) {
  // get files and cache them
  const pathToFlow = path.resolve(process.cwd(), options.filename);
  global.parse.flowDir = pathToFlow.slice(0, pathToFlow.indexOf(path.sep));
  const files = [
    [pathToFlow, 'flow'],
    ['./src/tagui_header.js', 'header'],
    ['./src/tagui_footer.js', 'footer'],
    ['./src/tagui_config.txt', 'config'],
  ];
  Promise.all(files.map((args) => getFile.apply(this, args)))
    .then(() => {
      // continue to next step and write casper file
      const pathToOutputFile = `${pathToFlow}.js`;
      writeCasperFile(pathToOutputFile);
    }).catch((e) => {
      console.log(`Error: ${e}`);
    });
}