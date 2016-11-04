#!/bin/sh
play=$1
font=$2
lines=whospeak.csv
chars=chars.txt
start=$(date)

while read -r line
do
  # Get the next line number
  num=$(echo $line | cut -f1 -d',')
  # ...And the character, though it probably won't be used for these purposes
  speaker=$(echo $line | cut -f2 -d',')
  # ...And the image used for the character
  image=$(grep "^$speaker," "$chars" | cut -f3 -d',')
  # Call the video conversion script with the right parameters
  # As far as I can tell, the JavaScript code runs asynchronously, making
  # it a disaster in a loop "locally."  This is, therefore, a stopgap.
  node video.js --font="$2" --image="$image" --line=$num --play="$play"
  echo $num
done < "$lines"
echo $start
date

