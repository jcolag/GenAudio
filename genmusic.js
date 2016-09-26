/*
 * Based heavily on code drawn from "Listen to Wikipedia"
 * at https://github.com/hatnote/listen-to-wikipedia,
 * available under a BSD 3-clause license,
 * Copyright (c) 2013, Stephen LaPorte and Mahmoud Hashemi,
 * in turn based on "Listen to Bitcoin"
 * at https://github.com/MaxLaumeister/Listen-To-Bitcoin,
 * available under an MIT license,
 * Copyright (c) 2013 Maximillian Laumeister.
 * 
 * The output of the program is a program in Csound, a
 * GPLv2 (or later) licensed sound processing language and
 * software synthesizer.
 */

const fs = require('fs');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  { name: 'style', alias: 'y', type: String },
  { name: 'seed', alias: 's', type: String, multiple: true },
  { name: 'time', alias: 't', type: Number },
];
const options = commandLineArgs(optionDefinitions);

const style = options.hasOwnProperty('style') ? options.style[0] : 'g';
const total_time = options.hasOwnProperty('time') ? options.time : 60;
const seed = options.hasOwnProperty('seed') ? options.seed.join(' ') : '';
var current_notes = 0;
var note_overlap = 15;
var note_timeout = 300;
var last_freq = 880;
var last_time = 0;
const startcode = '<CsShortLicense>\n\
		6\n\
	</CsShortLicense>\n\
	<CsoundSynthesizer>\n\
	<CsOptions>\n\
		-o outfile.wav\n\
	</CsOptions>\n\
	<CsInstruments>\n\
		sr = 44100\n\
		ksmps = 32\n\
		nchnls = 2\n\
		0dbfs = 1\n\
		giSine   ftgen    0, 0, 2^12, 10, 1\n\
				instr 1\n\
		aEnv    linseg  0, 0.1, 0.4, p3, 0\n\
		aSig    poscil  aEnv, p4, giSine\n\
				outs	aSig, aSig\n\
		endin\n\
				instr 2\n\
		aEnv    linseg  0, 0.1, 0.25, p3, 0\n\
		a1      poscil  aEnv, p4, giSine\n\
		a2      poscil  aEnv, p4 / 1.004, giSine\n\
		a3      poscil  aEnv, p4 * 1.004, giSine\n\
		aSig  = a1 + a2 + a3\n\
				outs	aSig, aSig\n\
		endin\n\
				instr 3\n\
		aEnv    linseg  0, p3 / 3, 0.1, p3 / 3, 0.1, p3 / 3, 0\n\
		a1      poscil  aEnv, p4 / 1.414, giSine\n\
		a2      poscil  aEnv, p4 / 2 * 1.004, giSine\n\
		a3      poscil  aEnv, p4 / 2 / 1.004, giSine\n\
		a4      poscil  aEnv, p4 / 2 * 1.004 * 1.004, giSine\n\
		a5      poscil  aEnv, p4 / 2 * 1.004 * 1.004, giSine\n\
		a1    = a1 + a2 + a3 + a4 + a5\n\
				outs a1, a1\n\
		endin\n\
				instr 4\n\
		aEnv    linseg  0, p3 / 3, 0.1\n\
		a1      poscil  aEnv, p4, giSine\n\
		a2      poscil  aEnv, p4 * 1.335, giSine\n\
		a3      poscil  aEnv, p4 * 1.414, giSine\n\
		aSig  = a1 + a2 + a3\n\
				outs	aSig, aSig\n\
		endin\n\
	</CsInstruments>\n\
	<CsScore>';
const endcode =  '</CsScore>\n\
	</CsoundSynthesizer>';

eval(fs.readFileSync('lib/seedrandom.js') + '');
Math.seedrandom(seed);

console.log(startcode);
if (style === 'g') {
  while (last_time < total_time) {
    var size = Math.floor(Math.max(Math.sqrt(Math.random() * 1000) * 5, 3));
    var instrument = Math.floor(Math.random() * 21 / 10) + 1;
    play_sound(size, instrument, 1);
  }
} else {
  while (last_time < total_time) {
    var size = Math.floor(Math.max(Math.sqrt(Math.random() * 1000) * 5, 3));
    play_sound(size, 4, 1);
  }
}
console.log(endcode);

function play_sound(size, instrument, volume) {
  var max_pitch = 100.0;
  var log_used = 1.0715307808111486871978099;
  var halfnote = 1.09463094;
  //var halfnote = 1.148698355; // Oversimplified pentatonic scale
  var pitch = 100 - Math.min(max_pitch, Math.log(size + log_used) / Math.log(log_used));
  var index = Math.floor(pitch / 100.0 * 27);
  var fuzz = Math.floor(Math.random() * 4) - 2;
  index += fuzz;
  index = Math.min(27, index);
  index = Math.max(1, index);
  var freq = last_freq * Math.pow(halfnote, Math.round(Math.random() * 5 - 2.33));
  freq = 220 * Math.pow(halfnote, index);
  var time = last_time + (Math.floor(Math.random() * 4) / 2 + 1);
  var dur = [1, 2, 3][Math.floor(Math.random() * 3)] * instrument;
  if (instrument == 3) {
    freq = 440 * [1.189207115, 1, 0.840896415][Math.floor(Math.random() * 3)];
    dur = 5;
  }
  console.log('i ' + instrument + ' ' + last_time + ' ' + dur + ' ' + freq);
  last_freq = freq;
  last_time = time;
}

