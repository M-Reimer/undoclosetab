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

undoclosetab-trunk.xpi: $(FILES) icons/undoclosetab-light.svg
	@zip -9 - $^ > $@

icons/undoclosetab-light.svg: icons/undoclosetab.svg
	@sed 's/:#4c4c4c/:#ffffff/g' $^ > $@

clean:
	rm -f undoclosetab-trunk.xpi
	rm -f icons/undoclosetab-light.svg
