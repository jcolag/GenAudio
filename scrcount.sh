#!/bin/bash
lines=$(mktemp)
linesl=$(mktemp)
linesr=$(mktemp)
names=$(mktemp)
grep -n "^# " "$1" | cut -f1 -d':' > $lines
echo Header > $names
grep -n "^# " "$1" | cut -f2- -d' ' >> $names
cp $lines $linesl
wc -l "$1" | cut -f1 -d' ' >> $linesl
echo 0 > $linesr
cat $lines >> $linesr
rm $lines
paste -d':' $names $linesl $linesr > $lines
rm $linesl $linesr $names
while read -r line
do
    section=$(echo $line | cut -f1 -d':')
    toline=$(echo $line | cut -f2 -d':')
    fromline=$(echo $line | cut -f3 -d':')
    words=$(head --lines=$toline "$1" | tail --lines=+$fromline | grep "^[-.A-Z][- .a-z]" | wc -w)
    minutes=$(($words / 120))
    seconds=$((($words + 1) / 2 - $minutes * 60))
    time=$(printf '%02d:%02d' $minutes $seconds)
    echo $section: $words / $time
done < $lines
rm $lines
