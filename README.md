# GenAudio
Experiments Using Audio Tools

The included scripts are used to produce episodes of [Celestial Patrol](http://celestialpatrol.com), starting with a screenplay in a _slightly_ extended [Fountain](http://fountain.io/) format and, using mostly-standard Linux tools ([Mimic](https://mimic.mycroft.ai/) based on [Festival](http://www.cstr.ed.ac.uk/projects/festival/), [SoX](http://sox.sourceforge.net/), and [CSound](https://csound.github.io/)) and asset files, generates a final audio file.

## `cast.sh`

The _cast_ script extracts the character names from a Fountain-formatted screenplay in order to associate text-to-speech voices.  It assumes that names are not punctuated (so that they're not confused with transition directives) and that the first "word" of each name is unique and relevant.

The result is a sorted list of names in `chars.txt`, with commas added to separate the character from the desired voice names.  `tts.js`, described below, takes this file as input.

It takes the Fountain file as a parameter.

## `genmusic.js`

The _genmusic_ script uses trivially-guided random elements to generate musical scores in CSound format.  It takes up to three arguments, a time in seconds that the music should play, an optional parameter (which can be anything) to produce the simpler, harsher melodies, and a randomness seed.

| Long Name | Short Name | Type | Description |
|:--------- |:----------:|:----:|:----------- |
| `--style` | `-y` | String | Change the style from the default `g`eneric |
| `--seed` | `-s` | String | A series of terms to use as a random seed, default empty |
| `--time` | `-t` | Number | Number of seconds of music to generate, default `60` |

CSound then renders the music to `output.wav` in the current folder.

## `mixep.js`

The _mixep_ script does the heavy lifting of sequencing and mixing, producing a final audio file, presuming that earlier steps (`tts.js`, `genmusic.js`, and processing the latter's resulting CSound files) have been completed.  It takes three arguments:  The Fountain-formatted screenplay, the location (a folder) of any sound effects referenced by the screenplay, and the location (folder) of the voice files of the screenplay lines (from `tts.js`).

| Long Name | Short Name | Type | Description |
|:--------- |:----------:|:----:|:----------- |
| `--play`        | `-p` | String | The screenplay file |
| `--soundfolder` | `-s` | String | The folder containing the required sound effects and music |
| `--destfolder`  | `-d` | String | The folder containing the voiced lines from `tts.js` |

The output is `result.wav`, which can then be converted to any other format of relevance.

### Sound Index

One of the extensions to Fountain required by this project is an annotation for music and sound effects.  This are a bracketed key, optionally followed by tilde.  That is, it might look like `[15]` or `[33~]`, with the latter indicating that the audio should be played alongside whatever else is in the screenplay.

For this to work, a file named `index.txt` must be created and placed into the folder containing the sound effects.  It should be a tab-separated list in the following format, only some of which is used by `mixep.js`:

|Number|Name|Time|License|File|Creator|
|:----:|:--|---:|:-----:|:---|:------|
|13|Slam|5.985986|BY|door_slam.flac|foleyexpert|

The _Number_ and _Name_ (first and second columns) can be used interchangeably in the screenplay, and the file (fourth column) will be copied into the audio folder with a name appropriate to the mixing process.  The time is for reference (third column), and the license and creator (fourth and sixth columns) should be maintained to help ensure that proper credit is given.

## `scrcount.sh`

The _scrcount_ script reads through a Fountain-formatted screenplay and counts the spoken words in each act, multiplying them by a semi-standard fudge factor (120) to arrive at an estimate of total time for the audio.  It takes one parameter, the screenplay file.

## `stats.sh`

The _stats_ script goes through a folder of audio files (for example, the output of `tts.js`) and gathers statistics on each file contained inside:  The file type, sample rate, number of channels, number of samples, duration in seconds, bits per sample, and encoding.  It takes two parameters, the folder to search and the file to write the statistics to, with the filenames.

## `tts.js`

The _tts_ script walks through a Fountain-formatted screenplay and uses Mimic to "render" each line as an audio file.  The output files are each named after the line number in the screenplay ("`speech###.wav`').  It takes one parameter, the screenplay file, and places all output files into a folder called `output` in the current folder.

| Long Name | Short Name | Type | Description |
|:--------- |:----------:|:----:|:----------- |
| `--play`        | `-p` | String | The screenplay file |

### Voice Index

The _tts_ script requires, in the current folder, a file called `chars.txt`, which specifies which characters are to speak in what voice.  The file is comma-delimited, the name of the character and the name of the voice used by Mimic/Festival.  Each line of the file should look something like...

        GORDON,ked_diphone

Note that the first column, the names, can (and probably should) be generated by `cast.sh`, described above.

# From Screenplay to Episode

The above descriptions can seem a little scattered, so the entire process might look as follows.  Note that this process mostly works with multiple partial copies of WAV files, which tend to be fairly large.  Much of it is cleaned up on exit or can easily be, but expect to use in the neighborhood of forty megabytes of hard drive space per minute of the screenplay; that's _probably_ not a concern for most people, but it's worth being aware of it.  You can estimate the duration of the screenplay with `scrcount.sh`, of course.

 1. Write the screenplay.  For convenience, we'll refer to it `screenplay.fountain` in later steps.  Beyond what the [Fountain specification](http://fountain.io/syntax) says, there are a few additional points to remember for this purpose.

   * Mimic and Festival read word-internal punctuation literally, so any punctuation such as an ellipsis representing a pause must be separated by spaces.  For example, `this ... will sound right`, but `this...won't` will result in a line-reading along the lines of "this dot dot dot won't."

   * Referring to sound effects and music are noted in square brackets, on lines witn no dialogue, either by number or name.  Sounds that play alongside dialogue have the number/name followed by a tilde.  `[22]` will play play sound #22 alone, then continue with the remainder of the screenplay.  `[28~]` will play sound #28 in the background while the screenplay continues.

   * The entire Fountain specification isn't quite supported, yet.  In particular, there isn't any recognition of lines that start with punctuation other than parentheses...out of laziness.

 2. Create, download, edit, or otherwise acquire any sound effects and musical cues.  For a Free Culture work, good starting points might be [freesound](https://freesound.org/) or the [Free Music Archive](http://freemusicarchive.org/).  Place them all in the same folder and create `index.txt` in the same folder, as described under the __Sound Index__ section, above.
 
   * If the existing ambient music generator is appropriate for the project, determine how long it should run (annotating with breaks for `scrcount.sh` should give a decent approximation, if no other means are usable) and feed that information into the music generation script, like `node genmusic.js --time 60 --outfile music.wav --seed Some music > music.csd`.  Running `csound music.csd` then takes the resulting CSound file called `music.csd` and renders it to sixty seconds of music in `music.wav`.

 3. Convert the screenplay to line readings, with `node tts.js --play screenplay.fountain` at the command line.  If the `output` folder (inside the folder you run `tts.js` in) doesn't exist, it will be created.

 4. Mix the episode, with `node mixep.js --play screenplay.fountain --soundfolder /path/to/sounds --destfolder ./output`.  The destination folder `destfolder` is the output folder from `tts.js`.

 5. You now have `result.wav`.  It'll be big.  For transport, you may wish to run something like `sox result.wav result.flac` or replace `flac` with the audio format of your choice.

