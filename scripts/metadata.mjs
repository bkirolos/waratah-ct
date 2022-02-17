import pinataSDK from "@pinata/sdk";
import fs from "fs";
import { parse } from "csv-parse/sync";

import dotenv from "dotenv";
dotenv.config();

const pinata = pinataSDK(process.env.PINATA_ID, process.env.PINATA_SECRET);

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
  imageCID,
  mp4sCID
) => {
  if (!fs.existsSync(sneakerDirname)) {
    fs.mkdirSync(sneakerDirname + "");
  }
  if (!fs.existsSync(standardDirname)) {
    fs.mkdirSync(standardDirname + "");
  }

  let ducks = readCsvMetadata("ipfs/ducks-meta.csv");

  console.log("Found %d ducks", ducks.length);
  ducks.forEach(function (duck, i) {
    let formattedDuck = {
      name: `Flying Formations #${i + 1}`,
      image: `ipfs://${imageCID}/${duck["image"]}.png`,
      animation_url: `https://ducksofafeather.mypinata.cloud/ipfs/${mp4sCID}/${duck["image"]}.mp4`,
      external_url: "https://ducksofafeather.xyz",
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
      'Flying Formations is the first series in the  Ducks of a Feather project. It is a limited-edition series of 120 one-of-a-kind NFTs created by Tinker Hatfield to benefit University of Oregon Duck Athletes. It represents the initial offering from "Ducks of A Feather" by Division Street, an ongoing marketing initiative featuring University of Oregon athletes.\\n\\nFeaturing a complementary pair of Air Max 1 UO Edition sneakers designed by Tinker.';
    sneakerDuck.attributes = sneakerDuck.attributes.concat([
      {
        trait_type: "Shoe Size",
        value: duck["shoe size"],
      },
      {
        trait_type: "Air Max 1",
        value: "AVAILABLE",
      },
    ]);

    let standardDuck = { ...formattedDuck };
    standardDuck.description =
      'Flying Formations is the first series in the  Ducks of a Feather project. It is a limited-edition series of 120 one-of-a-kind NFTs created by Tinker Hatfield to benefit University of Oregon Duck Athletes. It represents the initial offering from "Ducks of A Feather" by Division Street, an ongoing marketing initiative featuring University of Oregon athletes.';
    standardDuck.attributes = standardDuck.attributes.concat([
      {
        trait_type: "Shoe Size",
        value: duck["shoe size"],
      },
      {
        trait_type: "Air Max 1",
        value: "REDEEMED",
      },
    ]);

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
  });
};

let pngsCID = await getCIDOrPin("ipfs/pngs", "Duck PNGs");
let mp4sCID = await getCIDOrPin("ipfs/mp4s", "Duck MP4s");

let sneakerMetadataDir = "ipfs/metadata-sneaker";
let standardMetadataDir = "ipfs/metadata-standard";
generateMetadata(sneakerMetadataDir, standardMetadataDir, pngsCID, mp4sCID);
await getCIDOrPin(sneakerMetadataDir, "Duck Sneaker Metadata");
await getCIDOrPin(standardMetadataDir, "Duck Standard Metadata");
