#!/bin/node
// SCRIPT FOR RUNNING TA.GUI FRAMEWORK
// Original by Ken Soh (http://tebel.org)
// Ported from Bash by Charlie Hulcher (https://charlie.engineer)

const path = require('path');
const argv = require('yargs')
  .usage('Usage: npm start -- <flow_filename> [options]')
  .alias('firefox', 'f')
  .describe('firefox', 'Run on visible Firefox browser. First install Firefox and SlimerJS.')
  .alias('report', 'r')
  .describe('report', 'Generate a web report for easy sharing of run results (default is only a text log file)')
  .alias('debug', 'd')
  .describe('debug', 'Show run-time backend messages from PhantomJS for detailed tracing and logging')
  .alias('test', 't')
  .describe('test', 'Professional testing using CasperJS assertions; TA.Gui XPath tx(\'selector\') usable')
  .help('h')
  .alias('h', 'help')
  .demand(1)
  .argv;

const parse = require('./tagui_parse');

global.options = {
  filename: null,
  firefox: false,
  report: false,
  debug: false,
  test: false,
};

if (argv._ && argv._.length) {
  options.filename = argv._[0];
  // const options = argv._.slice(1);
  for (const key in argv) {
    if (Object.keys(options).indexOf(key) > -1) {
      options[key] = argv[key] || null;
    }
  }
}

/**
 * Validate command line options
 */
function validateOptions(opts) {
  const filenameIsString = typeof opts.filename === 'string' && opts.filename.length;
  const lastSepIndex = opts.filename.lastIndexOf(path.sep) > -1 ? opts.filename.lastIndexOf(path.sep) : 0;
  const filenameHasNoExtension = opts.filename.slice(lastSepIndex).indexOf('.') === -1;
  const filenameHasValidExtension = [
    '.gui',
    '.txt',
  ].indexOf(opts.filename.slice(opts.filename.lastIndexOf('.'))) > -1;
  if (
    !filenameIsString
    || !(filenameHasNoExtension || filenameHasValidExtension)
  ) {
    console.log('Invalid filename. Must be path to file with no extension or .txt or .gui');
    return false;
  }
  return true;
}

if (validateOptions(options)) {
  // have valid options, now let's parse
  parse(options);
}
