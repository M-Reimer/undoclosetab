#!/usr/bin/bash

# Helper for my own use to simplify maintenance of the "utils" subtree

init_subtree() {
  git subtree add --prefix utils git@github.com:M-Reimer/webext-utils.git master
}

pull_subtree() {
  git subtree pull --prefix utils git@github.com:M-Reimer/webext-utils.git master
}

push_subtree() {
  git subtree push --prefix utils git@github.com:M-Reimer/webext-utils.git master
}

case "$1" in
  init)
    init_subtree
    ;;
	pull)
		pull_subtree
		;;
	push)
		push_subtree
		;;
	*)
		echo "Unknown command $1"
esac
