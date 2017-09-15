const fs = require('fs');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'delimiter', alias: 'd', type: String },
  { name: 'folder', alias: 'f', type: String },
  { name: 'play', alias: 'p', type: String },
];
const options = commandLineArgs(optionDefinitions);

if (!options.hasOwnProperty('play')
   || !options.hasOwnProperty('folder')) {
  // Can't do anything useful without input
  return;
}

var delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : '# ';
var folder = options.folder;
var play = options.play;
var buffer = [];
var title = '';
var count = 0;
var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(play)
});

lineReader.on('line', function (line) {
  if (line.startsWith(delimiter)) {
    writeToFile(buffer, title);
    buffer = [];
    title = line.slice(delimiter.length);
    count += 1;
  }

  buffer.push(line);
});
lineReader.on('close', function() {
  writeToFile(buffer, title);
});

function writeToFile(buffer, title) {
  var text = buffer.join('\n');
  if (title.length > 0) {
    var outfile = folder + '/scr-' + count + '-' + title.replace(' ', '-') + '.fountain';
    console.log(outfile);
    fs.writeFileSync(outfile, text);
  }
}
