var fs = require('fs');
var cp = require('child_process');
var readline = require('readline');

var script = '';
var soundFolder = '';
var destFolder = '';
var prefix = 'speech';

process.argv.forEach(function (val, index, array) {
  if (index == 2) {
    script = val;
  } else if (index == 3) {
    soundFolder = val;
  } else if (index == 4) {
    destFolder = val;
  }
});

if (destFolder == '') {
  // Can't do anything useful without input
  return;
} else if (destFolder.slice(-1) != '/') {
  destFolder += '/';
}

if (soundFolder.slice(-1) != '/') {
  soundFolder += '/';
}


var files = fs.readdirSync(soundFolder);
var indexName = soundFolder + '/index.txt';
var soundIndex = fs.readFileSync(indexName).toString().split('\n');
soundIndex.forEach(function (line, index, array) {
  soundIndex[index] = line.split('\t');
});

var backgroundSounds = [];
var lineno = 1;                 // Count lines for easy addressing
var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(script),
});
lineReader.on('line', function (line) {
  if (line.length == 0) {
    lineno += 1;
    return;
  }
  var init = line[0];
  if (init == '(' || init == '#' || init.toUpperCase() != init) {
    wordno = 1;
    line.split(' ').forEach(function (word, index, array) {
    	if (word[0] == '[') {
    	  var continuing = false;
    	  if (word.slice(-1) == ','
    	   || word.slice(-1) == ';'
    	   || word.slice(-1) == '.'
    	   || word.slice(-1) == ')') {
    	    word = word.slice(0, -1);
    	  }
    	  word = word.slice(1, -1);
    	  if (word.slice(-1) == '~') {
    	    continuing = true;
    	    word = word.slice(0, -1);
    	  }
    	  var sound = fileNameFromCode(soundIndex, word);
    	  var dur = timeFromCode(soundIndex, word);
    	  var ext = sound.split('.').slice(-1);
    	  var outName = 'speech' + lineno + '-' + wordno + '.' + ext;
    	  copyFile(soundFolder + '/' + sound, destFolder + outName);
    	  if (continuing) {
    	    backgroundSounds.push(outName);
    	  }
    	}
    	wordno += 1;
    });
  } else if (line.slice(-1) == '^') {
    backgroundSounds.push('speech' + (lineno - 2) + '.wav');
  }
  lineno += 1;
}).on('close', function (err) {
  var timecode = 0.0;
  var plen = prefix.length;
  var empty = cp.spawnSync('/usr/bin/rec', [ destFolder + 'result.wav', 'trim', 0, 0 ])
  fs.readdirSync(destFolder).sort(function (a, b) {
    var aNames = a.slice(plen).split('-');
    var bNames = b.slice(plen).split('-');
    aNames.forEach(function (n, i, a) { aNames[i] = parseInt(n, 10); });
    bNames.forEach(function (n, i, a) { bNames[i] = parseInt(n, 10); });
    if (aNames[0] > bNames[0]) {
      return 1;
    } else if (aNames[0] < bNames[0]) {
      return -1;
    } else if (aNames.length == 1) {
      return 0;
    } else if (aNames[1] > bNames[1]) {
      return 1;
    } else if (aNames[1] < bNames[1]) {
      return -1;
    } else {
      return 0;
    }
  }).forEach(function (file, index, array) {
    var background = false;
    backgroundSounds.forEach(function (name, index, array) {
      if (file == name) {
        background = true;
      }
    });
    var timing = cp.spawnSync('/usr/bin/soxi', [ '-D', destFolder + file ]);
    var length = timing.stdout.toString().trim();
    if (timing.stderr.toString().trim() != '') {
      console.log(timing.stderr.toString().trim());
    } else if (!background) {
      var dur = parseFloat(timing.stdout.toString().trim(), 10);
      console.log(file.slice(plen) + ' - ' + dur);
      timecode += dur;
      var append = cp.spawnSync('/usr/bin/sox',
        [ '-m', destFolder + 'empty.wav', destFolder + file ]);
    } else {
    }
  });
  console.log(timecode);
});

function fileNameFromCode(index, code) {
  var out = null;
  index.forEach(function (item, index, array) {
    if (item[0] == code.toString() || item[1] == code) {
      out = item[4];
    }
  });
  if (out == null) {
    console.log(code);
  }
  return out;
}

function timeFromCode(index, code) {
  var out = null;
  index.forEach(function (item, index, array) {
    if (item[0] == code.toString() || item[1] == code) {
      out = item[3];
    }
  });
  if (out == null) {
    console.log(code);
  }
  return out;
}

function copyFile(srcFile, destFile) {
  var BUF_LENGTH, buff, bytesRead, fdr, fdw, pos;
  BUF_LENGTH = 64 * 1024;
  buff = new Buffer(BUF_LENGTH);
  fdr = fs.openSync(srcFile, 'r');
  fdw = fs.openSync(destFile, 'w');
  bytesRead = 1;
  pos = 0;
  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
    fs.writeSync(fdw, buff, 0, bytesRead);
    pos += bytesRead;
  }
  fs.closeSync(fdr);
  return fs.closeSync(fdw);
}

