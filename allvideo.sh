#!/bin/sh
play=$1
font=$2
lines=whospeak.csv
chars=chars.txt
start=$(date)

while read -r line
do
  num=$(echo $line | cut -f1 -d',')
  speaker=$(echo $line | cut -f2 -d',')
  image=$(grep "^$speaker," "$chars" | cut -f3 -d',')
  node video.js --font="$2" --image="$image" --line=$num --play="$play"
  echo $num
done < "$lines"
echo $start
date

