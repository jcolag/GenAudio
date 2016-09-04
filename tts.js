var fs = require('fs');
var cp = require('child_process');

var filename = '';              // Input file, in Fountain screenplay format
var tempfile = 'festin.txt';    // The file that each spoken line is written to

process.argv.forEach(function (val, index, array) {
  if (index > 1) {
    filename = val;             // Set the input file
  }
});

if (filename == '') {
  // Can't do anything useful without input
  return;
}

var lineReader = require('readline').createInterface({
  terminal: false,
  input: fs.createReadStream(filename)
});

var speaker = '';               // Track who's speaking to change voices
var lineno = 1;                 // Count lines for easy addressing
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
  } else if (line[0] == line[0].toUpperCase()) {
    // Write out the line, then use Festival to create the audio
    fs.writeFileSync(tempfile, line);
    var outfile = './output/speech' + lineno + '.wav';
    var talk = cp.spawnSync('/usr/bin/text2wave', ['-o', outfile, tempfile]);
  }
  
  lineno += 1;                  // Next line
});

