#!/bin/sh

# For a sketch-like image
#	Desaturate image, copy layer, invert color (top layer),
#	dodge mode, merge down, filter/artistic/cartoon (x2)

image=$1
time=$2
lineread=$3
font=$4

fname=$(basename "$image")
size=$(identify "$image" | cut -f3 -d' ')
wd=$(echo $size | cut -f1 -d'x')
ht=$(echo $size | cut -f2 -d'x')
geo=+1+1
linelen=100

# if portrait, dir should be east or west; if landscape, north or south
# position of the line needs to be opposite it
rr=$(rand --max 2)
if [ $ht -ge $wd ]
then
  linelen=40
  if [ $rr -eq 0 ]
  then
    dir=east
    geo=+100+200
  else
    dir=west
    geo=+1180+200
  fi
else
  linelen=320
  if [ $rr -eq 0 ]
  then
    dir=north
    geo=+100+100
  else
    dir=south
    geo=+100+750
  fi
fi

lineread=$(echo "$lineread" | fold --space --width=$linelen)

# need 1920 x 1080
convert "$image" -resize 1920x1080 -gravity $dir -background lightgray -extent 1920x1080 "resized_$fname"

# Add text
convert "resized_$fname" -fill black -font "$font" -pointsize 48 -annotate $geo "$lineread" "text_$fname"

ffmpeg -framerate 1/$time -i "text_$fname" -c:v libx264 -r 30 test.mp4

