const fs = require('fs');
const cp = require('child_process');
const readline = require('readline');
const tmp = require('tmp');
const commandLineArgs = require('command-line-args');

const prefix = 'speech';
const plen = prefix.length;
const optionDefinitions = [
  { name: 'bgonly', alias: 'b', type: Boolean },
  { name: 'destfolder', alias: 'd', type: String },
  { name: 'output', alias: 'o', type: String },
  { name: 'play', alias: 'p', type: String },
  { name: 'soundfolder', alias: 's', type: String },
];
const options = commandLineArgs(optionDefinitions);

var script = options.play;
var soundFolder = options.soundfolder;
var destFolder = options.destfolder;
var bgonly = options.hasOwnProperty('bgonly') ? options.bgonly : false;
var output = options.hasOwnProperty('output') ? options.output : 'result.wav';

if (!options.hasOwnProperty('play')
   || !options.hasOwnProperty('soundfolder')
   || !options.hasOwnProperty('destfolder')) {
  // Can't do anything useful without input
  return;
} else if (destFolder.slice(-1) != '/') {
  destFolder += '/';
}

if (soundFolder.slice(-1) != '/') {
  soundFolder += '/';
}


var indexName = soundFolder + '/index.txt';
var soundIndex = fs.readFileSync(indexName).toString().split('\n');
soundIndex.forEach(function (line, index) {
  soundIndex[index] = line.split('\t');
});

var tmpDir = tmp.dirSync({unsafeCleanup: true});
var backgroundSounds = [];
var lineno = 1;                 // Count lines for easy addressing
var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(script),
});
fs.stat('soundeffects.csv', function(err) {
  if (err != null) {
    fs.unlink('soundeffects.csv');
  }
});
lineReader.on('line', function (line) {
  if (line.length == 0) {
    lineno += 1;
    return;
  }
  var init = line[0];
  if (init == '(' || init == '#' || init.toUpperCase() != init) {
    var wordno = 1;
    line.split(' ').forEach(function (word) {
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
        var ext = sound.split('.').slice(-1);
        var lcode = lineno + '-' + wordno;
        var outName = 'speech' + lcode + '.' + ext;
        copyFile(soundFolder + '/' + sound, destFolder + outName);
          fs.appendFileSync('soundeffects.csv', lcode.toString() + ',' + word + ',' + sound + '\n');
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
}).on('close', function () {
  var timecode = 0.0;
  var channels = 0;
  var brate = 0;
  var srate = 0;

  cp.spawnSync('/usr/bin/rec', [ output, 'trim', 0, 0 ])
  fs.readdirSync(destFolder).forEach(function (file) {
    var proc = cp.spawnSync('/usr/bin/soxi', [ '-c', destFolder + file ]);
    var c = parseInt(proc.stdout.toString().trim(), 10);
    proc = cp.spawnSync('/usr/bin/soxi', [ '-b', destFolder + file ]);
    var b = parseInt(proc.stdout.toString().trim(), 10);
    proc = cp.spawnSync('/usr/bin/soxi', [ '-s', destFolder + file ]);
    var s = parseInt(proc.stdout.toString().trim(), 10);
    channels = Math.max(channels, c);
    brate = Math.max(brate, b);
    srate = Math.max(srate, s);
  });
  if (srate > 48000) {
    srate = 48000;
  }
  fs.readdirSync(destFolder).sort(audioFileSort).forEach(function (file) {
    var background = false;
    backgroundSounds.forEach(function (name) {
      if (file == name) {
        background = true;
      }
    });
    cp.spawnSync('/usr/bin/sox',
      [ '--norm', destFolder + file, '--bits', brate, '--channels', channels,
        tmpDir.name + '/' + file, 'rate', '-v', '-s', srate ]);
    fs.renameSync(tmpDir.name + '/' + file, destFolder + file);
    var timing = cp.spawnSync('/usr/bin/soxi', [ '-D', destFolder + file ]);
    if (timing.stderr.toString().trim() != '') {
      console.log(file);
      console.log(timing.stderr.toString().trim());
    } else if (background) {
      var silence = cp.spawnSync('/usr/bin/sox',
        [ '-n', '-r', srate, '-c', channels, tmpDir.name + '/empty.wav',
          'trim', '0.0', timecode ]);
      if (silence.stderr.toString().trim()) {
        console.log('silence: ' + silence.stderr.toString().trim());
      }
      var append = cp.spawnSync('/usr/bin/sox',
        [ tmpDir.name + '/empty.wav',
          destFolder + '/' + file,
          tmpDir.name + '/' + file ]);
      if (append.stderr.toString().trim()) {
        console.log('prepend silence: ' + silence.stderr.toString().trim());
      } else {
        fs.unlinkSync(tmpDir.name + '/empty.wav');
      }
      console.log(file + ' offset by ' + timecode + ' seconds');
    } else if (!bgonly) {
      var dur = parseFloat(timing.stdout.toString().trim(), 10);
      timecode += dur;
      cp.spawnSync('/usr/bin/sox',
        [ '--norm', output, destFolder + file, tmpDir.name + '/' + output ]);
      fs.renameSync(tmpDir.name + '/' + output, output);
      console.log(file + ' appended, total time at ' + timecode);
    }
  });
  fs.readdirSync(tmpDir.name).sort(audioFileSort).forEach(function (file) {
    var mix = cp.spawnSync('/usr/bin/sox',
      [ '-m', output, tmpDir.name + '/' + file, tmpDir.name + '/' + output ]);
    if (mix.stderr.toString().trim() != '') {
      console.log(mix.stderr.toString().trim());
    }
    var compand = cp.spawnSync('/usr/bin/sox',
      [ tmpDir.name + '/' + output, tmpDir.name + '/resultA.wav', 'compand',
        '0.3,1', '6:-70,-60,-20', '-5', '-90', '0.2' ]);
    if (compand.stderr.toString().trim() != '') {
      console.log(compand.stderr.toString().trim());
    }
    fs.unlinkSync(tmpDir.name + '/' + output);
    fs.renameSync(tmpDir.name + '/resultA.wav', output);
    console.log(file + ' mixed');
  });
  console.log(timecode + ' seconds total');
});

function audioFileSort(a, b) {
  var aNames = a.slice(plen).split('-');
  var bNames = b.slice(plen).split('-');
  aNames.forEach(function (n, i) { aNames[i] = parseInt(n, 10); });
  bNames.forEach(function (n, i) { bNames[i] = parseInt(n, 10); });
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
}

function fileNameFromCode(index, code) {
  var out = null;
  index.forEach(function (item) {
    if (item[0] == code.toString() || item[1] == code) {
      out = item[4];
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

