#!/bin/sh
play=$1
font=$2
lines=whospeak.csv
chars=chars.txt
colors=colors.csv
start=$(date)

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
  node video.js --background="$bg" --color="fg" --font="$2" --image="$image" --line=$num --play="$play"
  echo $num
done < "$lines"
echo $start
date

