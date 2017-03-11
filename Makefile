# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

.PHONY: xpi

xpi: clean
	zip -r9 undoclosetab-trunk.xpi manifest.json \
                               _locales \
                               icons \
                               background.js
clean:
	rm -f vdrportalmobile-trunk.xpi
