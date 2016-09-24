# GenAudio
Experiments Using Audio Tools

The included scripts are used to produce episodes of [Celestial Patrol](http://celestialpatrol.com), starting with a screenplay in a _slightly_ extended [Fountain](http://fountain.io/) format and, using mostly-standard Linux tools ([Festival](http://www.cstr.ed.ac.uk/projects/festival/), [SoX](http://sox.sourceforge.net/), and [CSound](https://csound.github.io/)) and asset files, generates a final audio file.

## `cast.sh`

The _cast_ script extracts the character names from a Fountain-formatted screenplay in order to associate text-to-speech voices.  It assumes that names are not punctuated (so that they're not confused with transition directives) and that the first "word" of each name is unique and relevant.

The result is a sorted list of names in `chars.txt`, with commas added to separate the character from the desired voice names.  `tts.js`, described below, takes this file as input.

It takes the Fountain file as a parameter.

## `genmusic.js`

The _genmusic_ script uses trivially-guided random elements to generate musical scores in CSound format.  It takes two arguments, a time in seconds that the music should play and an optional parameter (which can be anything) to produce the simpler, harsher melodies.

Note that _genmusic_ __should__ take a third parameter for the randomness seed, soon enough.  But at least for right now, the seed can be changed in code.

## `mixep.js`

The _mixep_ script does the heavy lifting of sequencing and mixing, producing a final audio file, presuming that earlier steps (`tts.js`, `genmusic.js`, and processing the latter's resulting CSound files) have been completed.  It takes three arguments:  The Fountain-formatted screenplay, the location (a folder) of any sound effects referenced by the screenplay, and the location (folder) of the voice files of the screenplay lines (from `tts.js`).

The output is `result.wav`, which can then be converted to any other format of relevance.

### Sound Index

One of the extensions to Fountain required by this project is an annotation for music and sound effects.  This are a bracketed key, optionally followed by tilde.  That is, it might look like `[15]` or `[33~]`, with the latter indicating that the audio should be played alongside whatever else is in the screenplay.

For this to work, a file named `index.txt` must be created and placed into the folder containing the sound effects.  It should be a tab-separated list in the following format, only some of which is used by `mixep.js`:

|Number|Name|Time|License|File|Creator|
|:----:|:--|---:|:-----:|:---|:------|
|13|Flyer|5.985986|BY|flyer_swoop.flac|patchen|

The _Number_ and _Name_ (first and second columns) can be used interchangeably in the screenplay, and the file (fourth column) will be copied into the audio folder with a name appropriate to the mixing process.  The time is for reference (third column), and the license and creator (fourth and sixth columns) should be maintained to help ensure that proper credit is given.

## `scrcount.sh`

The _scrcount_ script reads through a Fountain-formatted screenplay and counts the spoken words in each act, multiplying them by a semi-standard fudge factor (120) to arrive at an estimate of total time for the audio.  It takes one parameter, the screenplay file.

## `stats.sh`

The _stats_ script goes through a folder of audio files (for example, the output of `tts.js`) and gathers statistics on each file contained inside:  The file type, sample rate, number of channels, number of samples, duration in seconds, bits per sample, and encoding.  It takes two parameters, the folder to search and the file to write the statistics to, with the filenames.

## `tts.js`



# From Screenplay to Episode


