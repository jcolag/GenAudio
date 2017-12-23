const fs = require('fs');
const cp = require('child_process');
const im = require('imagemagick');
const readline = require('readline');
const commandLineArgs = require('command-line-args');

const fullWidth = 1920;
const fullHeight = 1080;

const optionDefinitions = [
  { name: 'configfile', alias: 'c', type: String },
  { name: 'delimiter', alias: 'd', type: String },
  { name: 'font', alias: 'f', type: String },
  { name: 'fontfamily', alias: 'a', type: String },
  { name: 'imagefolder', alias: 'i', type: String },
  { name: 'lines', alias: 'l', type: Number },
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

var fileconfig = options.hasOwnProperty('configfile') ? options.configfile : null;
var config = null;
var delimiter = '===';
var font = null;
var fontfamily = null;
var nlines = -1;
var music = null;
var fontsize = 48;
var text = null;
var imgfolder = '';

if (fileconfig != null && fs.existsSync(fileconfig)) {
  config = JSON.parse(fs.readFileSync(fileconfig, 'utf-8'));
  if (config != null) {
    delimiter = config.delimiter;
    font = config.font;
    fontfamily = config.fontfamily;
    nlines = config.lines;
    music = config.music;
    fontsize = config.size;
    text = config.text;
    imgfolder = config.imagefolder;
  }
}

delimiter = options.hasOwnProperty('delimiter') ? options.delimiter : delimiter;
font = options.hasOwnProperty('font') ? options.font : font;
fontfamily = options.hasOwnProperty('fontfamily') ? options.fontfamily : fontfamily;
nlines = options.hasOwnProperty('lines') ? options.lines : nlines;
music = options.hasOwnProperty('music') ? options.music : music;
fontsize = options.hasOwnProperty('size') ? options.size : fontsize;
text = options.hasOwnProperty('text') ? options.text : text;
imgfolder = options.hasOwnProperty('imagefolder') ? options.imagefolder : imgfolder;

if (fontfamily == null
 || music == null
 || text == null) {
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
      var blocks = [];
      var lines = screens[page];
    
      images.push(imageName);
      createPageImage(page, nlines, bgImageName, imageName, font, fontfamily, lines, blocks);
    }
  }
}

function videoFromImages() {
  if (images.length != finished.length) {
    setTimeout(videoFromImages, 100);
  } else {
    var outfile = text + '.mp4';
    fs.stat(outfile, function(err) {
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
    ], function (err) {
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
    ], function (err) {
      if (err) {
        console.log(err);
      } else {
        finished.push('bg' + number);
      }
    });
  }
}

function createPageImage(page, nlines, bgImageName, imageName, font, fontfamily, lines, blocks) {
  var internalImages = [];
  var internalFinished = [];

  if (nlines > 0) {
    var lineHeight = fullHeight / nlines;
    var imageLine = -1;

    for (var l = 0; l < lines.length; l++) {
      if (lines[l].startsWith('[')) {
        var imagelist = lines[l].split(' ');
        var internalName = 'line-' + ('00' + l).slice(-2) + '.png';
        var cmdConvert = [];

        internalImages.push(internalName);
        lines[l] = '';
        imageLine = l + 1;
        for (var ii = 0 ; ii < imagelist.length; ii++) {
          cmdConvert.push(imgfolder + '/' + imagelist[ii].slice(1, -1));
        }

        cmdConvert.push('+append');
        cmdConvert.push(internalName);

        im.convert(cmdConvert, function(err) {
          if (err) {
            console.log(err);
          }
          
          var imageItem = {};
          
          imageItem.imageName = internalName;
          imageItem.page = page;
          imageItem.height = lineHeight;
          imageItem.line = imageLine;
          internalFinished.push(imageItem);
        });
      }
    }
  }
  
  var contents = lines.join('\n');

  fillBlocks(blocks, lines, font, fontsize);
  setTimeout(composePageImage, 100, page, bgImageName, imageName, font, fontfamily, contents, internalImages, internalFinished);
}

function fillBlocks(blocks, lines, font, fontsize) {
  for (var ll = 0; ll < lines.length; ll++) {
    var fields = lines[ll].split('\t');

    for (var ff = 0; ff < fields.length; ff++) {
      blocks.push(new TextBlock(fields[ff], ll, ff, font, fontsize));
    }
  }
}

function composePageImage(page, bgImageName, imageName, font, fontfamily, contents, intImgs, intFinit) {
  if (intImgs.length != intFinit.length) {
    setTimeout(composePageImage, 100, page, bgImageName, imageName, font, fontfamily, contents, intImgs, intFinit);
    return;
  }

  var done = [];

  for (var i = 0; i < intFinit.length; i++) {
    var img = intFinit[i];
    var yoff = img.line * img.height - img.height / 2 - fullHeight / 2;
    var name = img.imageName;
    var tempName = bgImageName.replace('bg-', 'temp-bg-');

    im.convert([
      bgImageName, name,
      '-gravity', 'center',
      '-geometry', '+0+' + yoff,
      '-composite',
      tempName
    ], function (err) {
      if (err) {
        console.log(err);
      }

      fs.unlinkSync(bgImageName);
      fs.unlinkSync(name);
      fs.renameSync(tempName, bgImageName);
      done.push(bgImageName);
      if (intImgs.length > 1) {
        for (var i = 0; i < intImgs.length; i++) {
          fs.unlinkSync(intImgs[i]);
        }
      }
    });
  }

  if (intImgs.length == 0) {
    done.push(bgImageName);
  }

  setTimeout(completePageImage, 100, page, bgImageName, imageName, font, fontfamily, contents, done);
}
    
function completePageImage(page, bgImageName, imageName, font, fontfamily, contents, done) {
  if (done.length == 0) {
    setTimeout(completePageImage, 100, page, bgImageName, imageName, font, fontfamily, contents, done);
  } else {
    im.convert([
      '-page', '+0+0', bgImageName,
      '-background', 'rgba(0,0,0,0)',
      '-fill', '#F0F0B0',
      '-font', font,
      '-size', fullWidth + 'x' + fullHeight,
      '-pointsize', fontsize,
      '-gravity', 'Center',
      'pango:<span foreground=\'#F0F0B0\' font=\'' + fontfamily + '\'>' + contents + '</span>',
      '-layers', 'flatten',
      imageName
    ], function (err) {
      if (err) {
        console.log(err);
      }

      finished.push(page);
    });
  }
}
