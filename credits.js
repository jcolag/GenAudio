const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const fullWidth = 1920;
const fullHeight = 1080;
const outDir = './clips';

const optionDefinitions = [
  { name: 'delimiter', alias: 'd', type: String },
  { name: 'font', alias: 'f', type: String },
  { name: 'justify', alias: 'j', type: String },
  { name: 'music', alias: 'm', type: String },
  { name: 'size', alias: 's', type: Number },
  { name: 'text', alias: 't', type: String },
];
const options = commandLineArgs(optionDefinitions);

var delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : '===';
var font = options.font;
var justify = options.hasOwnProperty('justify') ? options.justify : 'c';
var music = options.music;
var fontsize = options.hasOwnProperty('size') ? options.size : '48';
var text = options.text;

if (!options.hasOwnProperty('font')
 || !options.hasOwnProperty('music')
 || !options.hasOwnProperty('text')) {
  // Can't do anything useful without input
  return;
}

var proc = cp.spawnSync('/usr/bin/soxi', [ '-D', music ]);
var time = parseFloat(proc.stdout.toString().trim(), 10);

var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(text)
});
var screens = [];
var screenful = [];
lineReader.on('line', function (line) {
  if (line == delimiter) {
    screens.push(screenful);
    screenful = [];
  } else {
    screenful.push(line);
  }
});
lineReader.on('close', function() {
  var pages = screens.length;
  var timePerPage = time / pages;
  var images = [];

  console.log('Runs for ' + time + 's, or ' + timePerPage + 's per page.');
  for (var page = 0; page < pages; page++) {
    var contents = screens[page].join('\n');
    var digits = screens.toString().length;
    var imageName = 'credit-' + ('0000' + (page + 1)).slice(-digits) + '.png';
    
    images.push(imageName);
    im.convert([
        imageFile,
        '-resize', fullWidth + 'x' + fullHeight,
        '-gravity', 'Center',
        '-background', '#000020',
        '-opaque', '#F0F0B0',
        '-extent', fullWidth + 'x' + fullHeight,
        imageName
      ], function (err, output) {
      if (err) {
        console.log(err);
      }
      im.convert([
        imageName,
        '-fill', foreground,
        '-font', fontFile,
        '-pointsize', 48,
        '-annotate', geo,
        contents,
        'text_' + imageName
      ], function (err, output) {
      }
    });
  });
}
