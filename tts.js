const fs = require('fs');
const cp = require('child_process');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'play', alias: 'p', type: String },
];
const options = commandLineArgs(optionDefinitions);

var filename = options.play;    // Input file, in Fountain screenplay format
var tempfile = 'festin.txt';    // The file that each spoken line is written to
var voice = 'kal_diphone';

if (!options.hasOwnProperty('play')) {
  // Can't do anything useful without input
  return;
}

var voices =  {};
var voiceReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream('chars.txt')
});
voiceReader.on('line', function (line) {
  var mapping = line.split(',');
  voices[mapping[0]] = mapping[1];
});

var speaker = '';               // Track who's speaking to change voices
var lineno = 1;                 // Count lines for easy addressing
var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(filename)
});
lineReader.on('line', function (line) {
  if (line.length > 0 && (line[0] == '#' || line[0] == ' ')) {
    /* comment */;
  } else if (line == line.toUpperCase()) {
    if (line.indexOf('EXT.') != 0
      && line.indexOf('INT.') != 0
      && line.indexOf('CUT') != 0
      && line.indexOf('PAN') != 0
      && line.indexOf('TRANSITION') != 0) {
      // Grab the person's unmodified name
      speaker = line.split(' ')[0];
    } else {
      /* direction */;
    }
  } else if (line[0] == line[0].toUpperCase()
      && line.indexOf('(') != 0) {
    // Write out the line, then use Festival to create the audio
    fs.writeFileSync(tempfile, line);
    var outfile = './output/speech' + lineno + '.wav';
    var v = voice;
    if (typeof voices[speaker] != 'undefined') {
      v = voices[speaker];
    }

    var talk = cp.spawnSync('/usr/bin/text2wave',
      ['-o', outfile, '-eval', '(voice_' + v + ')', tempfile]);
  }
  
  lineno += 1;                  // Next line
});

