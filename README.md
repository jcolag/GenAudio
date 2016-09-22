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



## `scrcount.sh`



## `stats.sh`



## `tts.js`



# From Screenplay to Episode


