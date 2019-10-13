# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

FILES = manifest.json \
        storage.js \
        background.js \
        iconupdater.js \
        options.html \
        options.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

ADDON = undoclosetab

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

trunk: $(ADDON)-trunk.xpi

release: $(ADDON)-$(VERSION).xpi

%.xpi: $(FILES) icons/$(ADDON)-light.svg
	@zip -9 - $^ > $@

icons/$(ADDON)-light.svg: icons/$(ADDON).svg
	@sed 's/:#0c0c0d/:#f9f9fa/g' $^ > $@

clean:
	rm -f $(ADDON)-*.xpi
	rm -f icons/$(ADDON)-light.svg

# Starts local debug session
run: icons/$(ADDON)-light.svg
	web-ext run --pref=devtools.browserconsole.contentMessages=true --bc
