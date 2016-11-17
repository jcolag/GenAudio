#!/bin/sh
# Extracts the character names from a Fountain-formatted screenplay
# do associate text-to-speech voices
mv chars.txt chars.prev.txt
grep "^[A-Z][A-Z]" "$1" | grep -v "[:.^]" | cut -f1 -d' ' | sort -u | sed 's/$/,/g' > chars.txt
mv bgcolors.csv bgcolors.prev.csv
grep "^[A-Z]*\." /home/john/Documents/jay/Trek/scripts/1x01\ Armageddon.fountain | sort | uniq | sed 's/$/,/g' > bgcolors.csv
