#!/bin/sh
play=$1
font=$2
lines=whospeak.csv
chars=chars.txt
colors=colors.csv
start=$(date)
outname=$(echo $play | cut -f2- -d'/' | cut -f1 -d'.')

rm -f clips.txt
while read -r line
do
  # Get the next line number
  num=$(echo $line | cut -f1 -d',')
  # ...And the character, though it probably won't be used for these purposes
  speaker=$(echo $line | cut -f2 -d',')
  # ...And the image used for the character
  found=$(grep -c "^$speaker," "$chars" | cut -f3 -d',')
  if [ $found -eq 1 ]
  then
    image=$(grep "^$speaker," "$chars" | cut -f3 -d',')
  else
    tspeaker=$(echo $speaker | cut -f1 -d' ')
    image=$(grep "^$tspeaker," "$chars" | cut -f3 -d',')
  fi
  # ...And the location
  loc=$(head --lines=$num "$play" | grep -n "^[A-Z]*\. " | tail --lines=1 | cut -f2 -d':')
  # ...And the location's background and font color
  bg=$(grep "^$loc," "$colors" | cut -f2 -d',')
  fg=$(grep "^$loc," "$colors" | cut -f3 -d',')
  # Call the video conversion script with the right parameters
  # As far as I can tell, the JavaScript code runs asynchronously, making
  # it a disaster in a loop "locally."  This is, therefore, a stopgap.
  node video.js --background="$bg" --color="$fg" --font="$2" --image="$image" --line=$num --play="$play"
  echo $num
done < "$lines"

bg="#000030"
while IFS=, read -r loc code audio
do
  img=$(grep "^${code}," sfx.csv | cut -f2 -d',')
  node illustrate.js --linecode="$loc" --image="${img}" --background="${bg}"
  echo $loc
done < soundeffects.csv

/bin/ls -1 clips | sed "s/\(.*\)/file 'clips\/\1'/g" > clips.txt
ffmpeg -f concat -i clips.txt -c copy -safe 0 -max_muxing_queue_size 9999 -strict -2 -b:a 4.5M -b:v 4.5M -minrate 4.5M -maxrate 4.5M -bufsize 4.5M "v$outname.mp4"
ffmpeg -i "v$outname.mp4" -i "$outname.wav" -safe 0 -max_muxing_queue_size 9999 -strict -2 -b:a 4.5M -b:v 4.5M -minrate 4.5M -maxrate 4.5M -bufsize 4.5M "$outname.mp4"
rm -f "v$outname.mp4" "$outname.wav"
echo $start
date

