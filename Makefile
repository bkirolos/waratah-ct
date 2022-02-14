
ipfs/dist:
	$(error Missing ipfs/dist folder. Please download from Dropbox!)

ipfs/gifs: ipfs/dist
	rm -rf ipfs/gifs
	mkdir -p ipfs/gifs
	find ipfs/dist/ -type f -iregex '.*\.gif' -exec cp {} ipfs/gifs/ \;

ipfs/pngs: ipfs/dist
	rm -rf ipfs/pngs
	mkdir -p ipfs/pngs
	find ipfs/dist/ -type f -iregex '.*\.png' -exec cp {} ipfs/pngs/ \;

ipfs/metadata: ipfs/gifs ipfs/pngs
	node scripts/metadata.mjs

clean:
	rm -rf ipfs/gifs ipfs/pngs ipfs/metadata
