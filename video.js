const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const readline = require('readline');
const commandLineArgs = require('command-line-args');
const speakIndexName = 'whospeak.csv';
const charIndexName = 'chars.txt';

const fullWidth = 1920;
const fullHeight = 1080;
const outDir = 'clips';

const optionDefinitions = [
  { name: 'font', alias: 'f', type: String },
  { name: 'image', alias: 'i', type: String },
  { name: 'line', alias: 'l', type: Number },
  { name: 'play', alias: 'p', type: String },
];
const options = commandLineArgs(optionDefinitions);

if (
      !options.hasOwnProperty('font')
   || !options.hasOwnProperty('image')
   || !options.hasOwnProperty('line')
   || !options.hasOwnProperty('play')
   ) {
  // Can't do anything useful without input
  return;
}

var fontFile = options.font;
var imageFile = options.image;
var lineNumber = options.line;
var playFile = options.play;
var imageBaseName = imageFile.split('/').pop();
var screenplay = fs.readFileSync(playFile).toString().split('\n');
screenplay.unshift('');

var lineRead = screenplay[lineNumber];
var audioName = 'output/speech' + lineNumber + '.wav';
var proc = cp.spawnSync('/usr/bin/soxi', [ '-D', audioName ]);
var time = parseFloat(proc.stdout.toString().trim(), 10);
var width = 0;
var height = 0;
var rSwitch = Math.round(Math.random());

var speakIndex = fs.readFileSync(speakIndexName).toString().replace('|', ',').split('\n');
var charIndex = fs.readFileSync(charIndexName).toString().split('\n');

im.identify(imageFile, function (err, features) {
  if (err) throw err;
  var linelen = 100;
  var dir = 'Center';
  var geo = '+100+100';
  width = features.width;
  height = features.height;
  if (width > height) {
    var xScale = fullWidth / width;
    linelen = Math.round((fullWidth - 200) / 16 - 1);
    if (rSwitch == 1) {
      dir = 'South';
      geo = '+100+100';
    } else {
      dir = 'North';
      geo = '+100+' + (height * xScale + 50);
    }
  } else {
    var yScale = fullHeight / height;
    linelen = Math.round((fullWidth - width * yScale - 200) / 16 - 1);
    if (rSwitch == 1) {
      dir = 'East';
      geo = '+100+100';
    } else {
      dir = 'West';
      geo = '+' + (100 + Math.round(width * yScale)) + '+100';
    }
  }
  var words = lineRead.split(' ');
  var chars = 0;
  lineRead = '';
  for (var i = 0; i < words.length; i++) {
    var wd = words[i];
    chars += wd.length + 1;
    if (chars > linelen) {
      chars = 0;
      lineRead += '\n';
    }
    lineRead += wd + ' ';
  }
  im.convert([
      imageFile,
      '-resize', fullWidth + 'x' + fullHeight,
      '-gravity', dir,
      '-background', 'lightgray',
      '-extent', fullWidth + 'x' + fullHeight,
      'resized_' + imageBaseName
    ], function (err, output) {
    im.convert([
      'resized_' + imageBaseName,
      '-fill', 'black',
      '-font', fontFile,
      '-pointsize', 48,
      '-annotate', geo,
      lineRead,
      'text_' + imageBaseName
      ], function (err, output) {
      var videoName = outDir + '/video' + lineNumber + '.mp4';
      fs.unlink('resized_' + imageBaseName);
      cp.spawnSync('/usr/bin/ffmpeg', [
        '-framerate', '1/' + time,
        '-i', 'text_' + imageBaseName,
        '-c:v', 'libx264',
        '-r', '30',
        videoName
      ]);
      fs.unlink('text_' + imageBaseName);
      cp.spawnSync('/usr/bin/ffmpeg', [
        '-i', videoName,
        '-i', audioName,
        '-c', 'copy',
        outDir + '/video' + lineNumber + '.mkv'
      ]);
      fs.unlink(videoName);
    });
  });
});
