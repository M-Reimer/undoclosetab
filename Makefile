# -*- Mode: Makefile -*-
#
# Makefile for Undo Close Tab
#

FILES = manifest.json \
        background.js \
        tabhandling.js \
        default-preferences.json \
        options.html \
        options.js \
        options.css \
        utils/storage.js \
        utils/iconupdater.js \
        utils/html-i18n.js \
        $(wildcard _locales/*/messages.json) \
        $(wildcard icons/*.svg)

ADDON = undoclosetab

VERSION = $(shell sed -n  's/^  "version": "\([^"]\+\).*/\1/p' manifest.json)

WEBEXT_UTILS_REPO = git@github.com:M-Reimer/webext-utils.git

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

# Subtree stuff for webext-utils
# Note to myself. Initial setup of subtree:
# git subtree add --prefix utils git@github.com:M-Reimer/webext-utils.git master

subtree-pull:
	git subtree pull --prefix utils "$(WEBEXT_UTILS_REPO)" master

subtree-push:
	git subtree push --prefix utils "$(WEBEXT_UTILS_REPO)" master
