const fs = require('fs');
const cp = require('child_process');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const outDir = './output';

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

var fullname = '';              // Track who's speaking to change voices
var speaker = '';
var lineno = 1;                 // Count lines for easy addressing
var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(filename)
});
fs.unlink('whospeak.csv');
if (!fs.existsSync(outDir)){
    fs.mkdirSync(outDir);
}
lineReader.on('line', function (line) {
  if (line.length > 0 && (line[0] == '#' || line[0] == ' ')) {

    /* comment */
  } else if (line == line.toUpperCase()) {
    if (line.indexOf('EXT.') != 0
      && line.indexOf('INT.') != 0
      && line.indexOf('CUT') != 0
      && line.indexOf('PAN') != 0
      && line.indexOf('TRANSITION') != 0) {
      // Grab the person's unmodified name
      fullname = line;
      speaker = fullname.split(' ')[0];
    } else {

      /* direction */
    }
  } else if (line[0] == line[0].toUpperCase()
      && line.indexOf('(') != 0) {
    // Write out the line, then use Festival to create the audio
    line = line.replace(/_/g, '');
    fs.writeFileSync(tempfile, line + '\n');
    var outfile = outDir + '/speech' + lineno + '.wav';
    var v = voice;
    if (typeof voices[speaker] != 'undefined') {
      v = voices[speaker];
    }

    console.log(outfile);
    var talk = cp.spawnSync('mimic',
      ['-o', outfile, '-voice', v, '-f', tempfile]);
    if (talk.stderr.toString().trim()) {
      console.log('>>> talk: ' + talk.stderr.toString().trim());
    }

    fs.appendFileSync('whospeak.csv', lineno.toString() + ',' + fullname + ',' + line.replace(',', '|') + '\n');
  }
  
  lineno += 1;                  // Next line
});

