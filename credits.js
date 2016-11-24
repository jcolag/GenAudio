const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const outDir = './clips';

const optionDefinitions = [
  { name: 'delimiter', alias: 'd', type: String },
  { name: 'font', alias: 'f', type: String },
  { name: 'music', alias: 'm', type: String },
  { name: 'text', alias: 't', type: String },
];
const options = commandLineArgs(optionDefinitions);

var text = options.text;
var font = options.font;
var music = options.music;
var delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : '---';

if (!options.hasOwnProperty('font')
 || !options.hasOwnProperty('music')
 || !options.hasOwnProperty('text')) {
  // Can't do anything useful without input
  return;
}

var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(filename)
});
var screenful = '';
lineReader.on('line', function (line) {
}

