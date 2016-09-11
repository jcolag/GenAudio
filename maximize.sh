#!/bin/sh
samprate=0
channels=0
bitrate=0
scmd=
ccmd=
bcmd=
split=
for i in $1/*
do
  sr=$(soxi -r $i) # sample rate
  if [ $sr -gt $samprate ]
  then
    samprate=$sr
    scmd="rate -v -s $sr"
  fi
  ch=$(soxi -c $i) # channels
  if [ $ch -gt $channels ]
  then
    channels=$ch
    ccmd="--channels $ch"
    split="split"
  fi
  br=$(soxi -b $i) # bits per sample
  if [ $br -gt $bitrate ]
  then
    bitrate=$br
    bcmd="--bits $br"
  fi
done
if [ $samprate -gt 48000 ]
then
  samprate=48000
  scmd="rate -v -s $samprate"
fi
echo Sampling Rate: $samprate, Channels: $channels, Bit Rate: $bitrate

tmpfile=$(mktemp)
for file in $1/*
do
  rate=$(soxi -r $file)
  factor=$(echo $samprate / $rate | bc -l)
  ext=$(echo $file | rev | cut -f1 -d'.' | rev)
  sox --norm $file $bcmd $ccmd $tmpfile.$ext $scmd
  mv $tmpfile.$ext $file
done
rm -f $tmpfile.*

