#!/bin/sh

# For a sketch-like image
#	Desaturate image, copy layer, invert color (top layer),
#	dodge mode, merge down, filter/artistic/cartoon (x2)

image=$1
time=$2
lineread=$3

fname=$(basename "$image")
size=$(identify "$image" | cut -f3 -d' ')
wd=$(echo $size | cut -f1 -d'x')
ht=$(echo $size | cut -f2 -d'x')

# if portrait, dir should be east or west; if landscape, north or south
rr=$(rand -M 2)
if [ $ht -ge $wd ]
then
  if [ $rr -eq 0 ]
  then
    dir=east
  else
    dir=west
  fi
else
  if [ $rr -eq 0 ]
  then
    dir=north
  else
    dir=south
  fi
fi

# need 1920 x 1080
convert "$image" -resize 1920x1080 -gravity $dir -background lightgray -extent 1920x1080 "resized_$fname"

# Add spoken text
# http://www.imagemagick.org/Usage/text/

ffmpeg -framerate 1/$time -i "resized_$fname" -c:v libx264 -r 30 test.mp4

