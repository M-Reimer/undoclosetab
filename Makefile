# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

FILES = manifest.json \
        background.js \
        options.html \
        options.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

undoclosetab-trunk.xpi: $(FILES)
	@zip -9 - $^ > $@

clean:
	rm -f undoclosetab-trunk.xpi
