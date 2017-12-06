const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const commandLineArgs = require('command-line-args');

const fullWidth = 1920;
const fullHeight = 1080;
const audioDir = './output/';
const outDir = 'clips';

const optionDefinitions = [
  { name: 'background', alias: 'b', type: String },
  { name: 'linecode', alias: 'c', type: String },
  { name: 'image', alias: 'i', type: String },
];
const options = commandLineArgs(optionDefinitions);

if (
      !options.hasOwnProperty('linecode')
   || !options.hasOwnProperty('image')
   || options.image == ''
   ) {
  // Can't do anything useful without input
  return;
}

var background = options.hasOwnProperty('background') ? options.background : 'lightgray';
var imageFile = options.image;
var imageBaseName = imageFile.split('/')[-1];
var lineCode = options.linecode;
var codeParts = lineCode.split('-');
var lineNumber = codeParts[0];
var lineIndex = codeParts[1];
var paddedCode = ('00000' + lineNumber).slice(-5) + '-' + lineIndex;
var sfxFileName = '';
var sfxFileBase = 'speech' + lineCode;
var outFileName = outDir + '/video' + paddedCode + '.mp4';
var audioFiles = fs.readdirSync(audioDir);

for (var i=0; i<audioFiles.length; i++) {
  if (audioFiles[i].startsWith(sfxFileBase)) {
    sfxFileName = audioFiles[i];
  }
}

var proc = cp.spawnSync('/usr/bin/soxi', [ '-D', audioDir + sfxFileName ]);
var time = parseFloat(proc.stdout.toString().trim(), 10);
var frameRate = 1 / time;

im.identify(imageFile, function (err) {
  if (err) throw err;
  var dir = 'Center';
  dir = 'North';

  im.convert([
      imageFile,
      '-resize', fullWidth + 'x' + fullHeight,
      '-gravity', dir,
      '-background', background,
      '-extent', fullWidth + 'x' + fullHeight,
      'resized_' + imageBaseName
    ], function (err) {
    if (err) {
      console.log(err);
    }
    cp.spawnSync('/usr/bin/ffmpeg', [
      '-framerate', frameRate,
      '-i', 'resized_' + imageBaseName,
      '-safe', '0',
      '-strict', '-2',
      '-c:v', 'libx264',
      '-b:a', '4.5M',
      '-b:v', '4.5M',
      '-minrate', '4.5M',
      '-maxrate', '4.5M',
      '-bufsize', '4.5M',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      outFileName
    ]);
    fs.unlink('resized_' + imageBaseName);
  });
});
