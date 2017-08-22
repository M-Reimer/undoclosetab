# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

FILES = manifest.json \
        background.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.png)

undoclosetab-trunk.xpi: $(FILES)
	@zip -9 - $^ > $@

clean:
	rm -f undoclosetab-trunk.xpi
