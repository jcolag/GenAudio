const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const fullWidth = 1920;
const fullHeight = 1080;
const imageName = 'null.png';
const soundName = 'null.wav';
const outfileName = 'null.mp4';

const optionDefinitions = [
  { name: 'background', alias: 'b', type: String },
  { name: 'framerate', alias: 'f', type: Number },
];
const options = commandLineArgs(optionDefinitions);

var background = options.hasOwnProperty('background') ? options.background : 'black';
var framerate = options.hasOwnProperty('framerate') ? options.framerate : 30

var silence = cp.spawnSync('/usr/bin/rec', [ soundName, 'trim', 0, 0 ])
if (silence.stderr.toString().trim()) {
  console.log('silence: ' + silence.stderr.toString().trim());
}

im.convert([
  '-size', fullWidth + 'x' + fullHeight,
  'xc:' + background,
  imageName
], function (err, output) {
  if (err) {
    console.log(err);
  }

  var mov = cp.spawnSync('/usr/bin/ffmpeg', [
    '-framerate', framerate,
    '-i', imageName,
    '-i', soundName,
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
    outfileName
  ]);
});

