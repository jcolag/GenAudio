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
  { name: 'fontfamily', alias: 'a', type: String },
  { name: 'justify', alias: 'j', type: String },
  { name: 'music', alias: 'm', type: String },
  { name: 'size', alias: 's', type: Number },
  { name: 'text', alias: 't', type: String },
];
const options = commandLineArgs(optionDefinitions);

class TextBlock {
  constructor(text, i, j, font, fontsize) {
    this.text = text;
    this.font = font;
    this.fontsize = fontsize;
    this.i = i;
    this.j = j;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.fillSize(text, font, fontsize);
    console.log('(' + i + ', ' + j + ') ' + text);
  }
  
  fillSize(text, font, fontsize) {
    im.convert([
      '-debug', 'annotate',
      'xc:',
      '-font', font,
      '-pointsize', fontsize,
      '-annotate', 0,
      text, 'null:'
    ], function (err, output) {
      if (err) {
        // In this case, stderr should have the output
        console.log('ERR: ' + err + '\n');
      } else if (output) {
        console.log('OUT: ' + output + '\n');
      }
    });
  }
}

var delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : '===';
var font = options.font;
var fontfamily = options.fontfamily;
var justify = options.hasOwnProperty('justify') ? options.justify : 'c';
var music = options.music;
var fontsize = options.hasOwnProperty('size') ? options.size : '48';
var text = options.text;

if (!options.hasOwnProperty('fontfamily')
 || !options.hasOwnProperty('music')
 || !options.hasOwnProperty('text')) {
  // Can't do anything useful without input
  return;
}

var proc = cp.spawnSync('/usr/bin/soxi', [ '-D', music ]);
var time = parseFloat(proc.stdout.toString().trim(), 10);
var images = [];
var finished = [];
var pages = 1;
var timePerPage = 1;
var lineReader = readline.createInterface({
  terminal: false,
  input: fs.createReadStream(text)
});
var screens = [];
var screenful = [];

lineReader.on('line', function (line) {
  if (line.startsWith(delimiter)) {
    screens.push(screenful);
    screenful = [];
  } else {
    screenful.push(line);
  }
});
lineReader.on('close', function() {
  setTimeout(foregroundImages, 100);
});

function foregroundImages() {
  if (images.length != finished.length) {
    console.log('Waiting for image processing (' + finished.length + ' of ' + images.length + ')...');
    setTimeout(foregroundImages, 100);
  } else {
  pages = screens.length;
  timePerPage = time / pages;

  console.log('Runs for ' + time + 's, or ' + timePerPage + 's per page.');
  setTimeout(videoFromImages, 100);
  for (var page = 0; page < pages; page++) {
    var contents = screens[page].join('\n');
    var imageName = './credit-' + ('0000' + (page + 1)).slice(-5) + '.png';
    var blocks = [];
    var lines = screens[page];
    
    for (var ll = 0; ll < lines.length; ll++) {
      var fields = lines[ll].split('\t');

      for (var ff = 0; ff < fields.length; ff++) {
        blocks.push(new TextBlock(fields[ff], ll, ff, font, fontsize));
      }
    }
    
    images.push(imageName);
    im.convert([
      '-background', '#000020',
      '-fill', '#F0F0B0',
      '-font', font,
      '-size', fullWidth + 'x' + fullHeight,
      '-pointsize', fontsize,
      '-gravity', 'Center',
      'pango:<span foreground=\'#F0F0B0\' font=\'' + fontfamily + '\'>' + contents + '</span>',
      imageName
    ], function (err, output) {
      if (err) {
        console.log(err);
      }
      
      finished.push(page);
    });
  }
});

function videoFromImages() {
  if (images.length != finished.length) {
    console.log('Waiting for image processing...');
    setTimeout(videoFromImages, 100);
  } else {
    var outfile = text + '.mp4';
    fs.stat(outfile, function(err, stat) {
      if(err == null) {
        fs.unlink(outfile);
      }
      cp.spawnSync('/usr/bin/ffmpeg', [
        '-framerate', 1 / timePerPage,
        '-i', 'credit-%05d.png',
        '-i', music,
        '-strict', '-2',
        '-c:v', 'libx264',
        '-r', 30,
        '-shortest',
        '-pix_fmt', 'yuv420p',
        '-max_muxing_queue_size', '9999',
        text + '.mp4'
      ]);
      console.log(x.stderr.toString());
      for (var i = 0; i < images.length; i++) {
        fs.unlink(images[i]);
      }
    });
  }
}

