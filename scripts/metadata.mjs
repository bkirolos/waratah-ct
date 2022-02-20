import pinataSDK from "@pinata/sdk";
import fs from "fs";
import { parse } from "csv-parse/sync";

import dotenv from "dotenv";
dotenv.config();

const pinata = pinataSDK(process.env.PINATA_ID, process.env.PINATA_SECRET);

const descriptionText =
  'Flying Formations is the first series in the  Ducks of a Feather project.\
 It is a limited-edition series of 120 one-of-a-kind NFTs created by Tinker\
 Hatfield to benefit University of Oregon Duck Athletes. It represents the\
 initial offering from "Ducks of A Feather" by Division Street, an ongoing\
 marketing initiative featuring University of Oregon athletes.';

const getCIDOrPin = async (filename, pinataName) => {
  let cidFile = filename + ".cid";

  if (fs.existsSync(cidFile)) {
    let buffer = fs.readFileSync(cidFile);
    let cid = buffer.toString().trim();
    console.log("found CID for %s: %s", filename, cid);
    return cid;
  } else {
    const options = {
      pinataMetadata: {
        name: pinataName,
      },
      pinataOptions: {
        cidVersion: 0,
      },
    };

    console.log(`Pinning ${filename} to IPFS...`);
    let result = await pinata.pinFromFS(filename, options);
    console.log(
      `Pinned ${filename} (${result.PinSize} bytes) to IPFS at ${result.Timestamp} with CID: ${result.IpfsHash}`
    );

    let cid = result.IpfsHash;
    fs.writeFileSync(cidFile, cid);
    return cid;
  }
};

const readCsvMetadata = (filename) => {
  let buffer = fs.readFileSync(filename);
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
  });

  return records;
};

const generateMetadata = (
  sneakerDirname,
  standardDirname,
  placeholderDirname,
  imageCID,
  mp4sCID
) => {
  if (!fs.existsSync(sneakerDirname)) {
    fs.mkdirSync(sneakerDirname + "");
  }
  if (!fs.existsSync(standardDirname)) {
    fs.mkdirSync(standardDirname + "");
  }
  if (!fs.existsSync(placeholderDirname)) {
    fs.mkdirSync(placeholderDirname + "");
  }

  let ducks = readCsvMetadata("ipfs/ducks-meta.csv");

  console.log("Found %d ducks", ducks.length);
  ducks.forEach(function (duck, i) {
    let formattedDuck = {
      name: `Flying Formations #${i + 1}`,
      image: `https://ipfs.ducksofafeather.xyz/ipfs/${imageCID}/${duck["image"]}.png`,
      animation_url: `ipfs://${mp4sCID}/${duck["image"]}.mp4`,
      external_url: "https://ducksofafeather.xyz/flyingformations/" + (i + 1),
      background_color: "000000",
      attributes: [
        {
          trait_type: "Stripes",
          value: duck["stripes"] == "Y" ? "YES" : "NO",
        },
        {
          trait_type: "Background Color",
          value: duck["color"],
        },
      ],
    };
    let sneakerDuck = { ...formattedDuck };
    sneakerDuck.description =
      descriptionText +
      " Featuring a complementary pair of Air Max 1 UO Edition sneakers designed by Tinker.";
    sneakerDuck.attributes = sneakerDuck.attributes.concat([
      {
        trait_type: "Shoe Size",
        value: "M " + duck["shoe size"],
      },
      {
        trait_type: "Air Max 1",
        value: "AVAILABLE",
      },
    ]);

    let standardDuck = { ...formattedDuck };
    standardDuck.description = descriptionText;
    standardDuck.attributes = standardDuck.attributes.concat([
      {
        trait_type: "Air Max 1",
        value: "UNAVAILABLE",
      },
    ]);

    let placeholderDuck = {
      name: `Flying Formations #${i + 1}`,
      description: descriptionText,
      image:
        "https://ipfs.ducksofafeather.xyz/ipfs/QmS1nZqnb4JgTSXSia9NHAaMyJ7xidTR3xySKEUTtQVDn2",
    };

    // write metadata for sneaker duck
    fs.writeFileSync(
      `${sneakerMetadataDir}/${i + 1}.json`,
      JSON.stringify(sneakerDuck)
    );

    // write metadata for standard duck
    fs.writeFileSync(
      `${standardMetadataDir}/${i + 1}.json`,
      JSON.stringify(standardDuck)
    );

    // write metadata for placeholder duck
    fs.writeFileSync(
      `${placeholderDir}/${i + 1}.json`,
      JSON.stringify(placeholderDuck)
    );
  });
};

let pngsCID = await getCIDOrPin("ipfs/pngs", "Duck PNGs");
let mp4sCID = await getCIDOrPin("ipfs/mp4s", "Duck MP4s");

let sneakerMetadataDir = "ipfs/metadata-sneaker";
let standardMetadataDir = "ipfs/metadata-standard";
let placeholderDir = "ipfs/metadata-placeholder";
generateMetadata(
  sneakerMetadataDir,
  standardMetadataDir,
  placeholderDir,
  pngsCID,
  mp4sCID
);
await getCIDOrPin(placeholderDir, "Duck Placeholder Metadata");
await getCIDOrPin(sneakerMetadataDir, "Duck Sneaker Metadata");
await getCIDOrPin(standardMetadataDir, "Duck Standard Metadata");
