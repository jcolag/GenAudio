# GenAudio
Experiments Using Audio Tools

The included scripts are used to produce episodes of [Celestial Patrol](http://celestialpatrol.com), starting with a screenplay in a _slightly_ extended [Fountain](http://fountain.io/) format and, using mostly-standard Linux tools ([Festival](http://www.cstr.ed.ac.uk/projects/festival/), [SoX](http://sox.sourceforge.net/), and [CSound](https://csound.github.io/)) and asset files, generates a final audio file.

## `cast.sh`

The _cast_ script extracts the character names from a Fountain-formatted screenplay in order to associate text-to-speech voices.  It assumes that names are not punctuated (so that they're not confused with transition directives) and that the first "word" of each name is unique and relevant.

The result is a sorted list of names in `chars.txt`, with commas added to separate the character from the desired voice names.  `tts.js`, described below, takes this file as input.

## `genmusic.js`



## `mixep.js`



## `scrcount.sh`



## `stats.sh`



## `tts.js`



# From Screenplay to Episode


