const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const fullWidth = 1920;
const fullHeight = 1080;

const optionDefinitions = [
  { name: 'delimiter', alias: 'd', type: String },
  { name: 'fontfamily', alias: 'a', type: String },
  { name: 'imagefolder', alias: 'i', type: String },
  { name: 'lines', alias: 'l', type: Number },
  { name: 'music', alias: 'm', type: String },
  { name: 'size', alias: 's', type: Number },
  { name: 'text', alias: 't', type: String },
];
const options = commandLineArgs(optionDefinitions);

var delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : '===';
var fontfamily = options.fontfamily;
var nlines = options.hasOwnProperty('lines') ? options.lines : -1;
var music = options.music;
var fontsize = options.hasOwnProperty('size') ? options.size : '48';
var text = options.text;
var imgfolder = options.hasOwnProperty('imagefolder') ? options.imagefolder : '';

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
    var length = screenful.length;
    var reDelimiter = new RegExp('^' + delimiter, 'i');
    var bgimage = line.replace(reDelimiter, '').trim();
    var imageName = './bg-' + ('0000' + (screens.length + 1)).slice(-5) + '.png';

    images.push(imageName);
    createBackgroundImage(imgfolder, bgimage, screens.length, imageName);

    if (length < nlines) {
      var toAdd = Math.trunc((nlines - length) / 2);
      for (var l = 0; l < toAdd; l++) {
        screenful.unshift('');
      }
    }

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
      var pageNumber = ('0000' + (page + 1)).slice(-5);
      var imageName = './credit-' + pageNumber + '.png';
      var bgImageName = './bg-' + pageNumber + '.png';
      var lines = screens[page];

      images.push(imageName);
      createPageImage(page, nlines, bgImageName, imageName, fontfamily, lines);
    }
  }
}

function videoFromImages() {
  if (images.length != finished.length) {
    console.log('Waiting for image processing (' + finished.length + ' of ' + images.length + ')...');
    setTimeout(videoFromImages, 100);
  } else {
    var outfile = text + '.mp4';
    fs.stat(outfile, function(err, stat) {
      if(err == null) {
        fs.unlinkSync(outfile);
      }
      cp.spawnSync('/usr/bin/ffmpeg', [
        '-framerate', 1 / timePerPage,
        '-i', 'credit-%05d.png',
        '-i', music,
        '-safe', '0',
        '-strict', '-2',
        '-c:v', 'libx264',
        '-b:a', '4.5M',
        '-b:v', '4.5M',
        '-minrate', '4.5M',
        '-maxrate', '4.5M',
        '-bufsize', '4.5M',
        '-r', 30,
        '-pix_fmt', 'yuv420p',
        '-af', 'aresample=async=1',
        '-max_muxing_queue_size', '9999',
        '-shortest',
        text + '.mp4'
      ]);
      for (var i = 0; i < images.length; i++) {
        fs.unlinkSync(images[i]);
      }
    });
  }
}

function createBackgroundImage(imgfolder, bgimage, number, imageName) {
  if (bgimage !== '') {
    im.convert([
      imgfolder + '/' + bgimage,
      '-background', '#000030',
      '-gravity', 'Center',
      '-extent', fullWidth + 'x' + fullHeight,
      imageName
    ], function (err, output) {
      if (err) {
        console.log(err);
      } else {
        finished.push('bg' + number);
      }
    });
  } else {
    im.convert([
      '-size', fullWidth + 'x' + fullHeight,
      'xc:#000030',
      imageName
    ], function (err, output) {
      if (err) {
        console.log(err);
      } else {
        finished.push('bg' + number);
      }
    });
  }
}

function createPageImage(page, nlines, bgImageName, imageName, fontfamily, lines) {
  var contents = lines.join('\n');

  if (nlines > 0) {
    for (var l = 0; l < lines.length; l++) {
      if (lines[l].startsWith('[')) {
        var imagelist = lines[l].split(' ');
        var cmdConvert = [];

        for (var ii = 0 ; ii < imagelist.length; ii++) {
          cmdConvert.push(imgfolder + '/' + imagelist[ii].slice(1, -1));
        }

        cmdConvert.push('+append');
        cmdConvert.push('line-' + ('00' + l).slice(-2) + '.png');

        im.convert(cmdConvert, function(err, output) {
          if (err) {
            console.log(err);
          }
        });

        lines[l] = '';
      }
    }
  }

  im.convert([
    '-page', '+0+0', bgImageName,
    '-background', 'rgba(0,0,0,0)',
    '-fill', '#F0F0B0',
    '-size', fullWidth + 'x' + fullHeight,
    '-pointsize', fontsize,
    '-gravity', 'Center',
    'pango:<span foreground=\'#F0F0B0\' fontfamily + '\'>' + contents + '</span>',
    '-layers', 'flatten',
    imageName
  ], function (err, output) {
    if (err) {
      console.log(err);
    }

    finished.push(page);
  });
}
