#!/bin/bash

# convert -quality 100 -density 400 "images.pdf" trial-%02d.svg

set -eux

filename="$1"

name="${filename%%.*}"
magick "$name": "$name.png"
magick "$name": -crop 40x30+10+10  "$name.gif"
