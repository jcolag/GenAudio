const fs = require('fs');
const cp = require('child_process');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const outDir = './clips';

const optionDefinitions = [
  { name: 'delimiter', alias: 'd', type: String },
  { name: 'infile', alias: 'i', type: String },
];
const options = commandLineArgs(optionDefinitions);

var filename = options.infile;
var delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : '---';

if (!options.hasOwnProperty('infile')) {
  // Can't do anything useful without input
  return;
}


