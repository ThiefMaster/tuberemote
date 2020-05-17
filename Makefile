ZIP_NAME := tuberemote.zip

.PHONY: all
all: build

build : ${ZIP_NAME}

${ZIP_NAME}: manifest.json *.js
	zip -r -FS $@ $^
