#!/bin/sh
cp /dev/null $2
for file in $1/*
do
  tt=$(soxi -t $file) # file type
  rr=$(soxi -r $file) # sample rate
  CC=$(soxi -c $file) # channels
  ss=$(soxi -s $file) # samples
  DD=$(soxi -D $file) # duration
  bb=$(soxi -b $file) # bits per sample
  ee=$(soxi -e $file) # encoding
  echo $file,$tt,$rr,$CC,$ss,$DD,$bb,$ee | tr -s '/' >> $2
done
