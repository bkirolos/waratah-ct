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

const generateMetadata = (dirname, imageCID, mp4sCID) => {
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir);
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
    let sneakerDuck = formattedDuck;
    sneakerDuck.description =
      'Flying Formations is the first series in the  Ducks of a Feather project. It is a limited-edition series of 120 one-of-a-kind NFTs created by Tinker Hatfield to benefit University of Oregon Duck Athletes. It represents the initial offering from "Ducks of A Feather" by Division Street, an ongoing marketing initiative featuring University of Oregon athletes.\n\nFeaturing a complementary pair of Air Max 1 UO Edition sneakers designed by Tinker.';
    sneakerDuck.attributes.concat([
      {
        trait_type: "Shoe Size",
        value: duck["shoe size"],
      },
      {
        trait_type: "Air Max 1",
        value: "AVAILABLE",
      },
    ]);

    let standardDuck = formattedDuck;
    standardDuck.description =
      'Flying Formations is the first series in the  Ducks of a Feather project. It is a limited-edition series of 120 one-of-a-kind NFTs created by Tinker Hatfield to benefit University of Oregon Duck Athletes. It represents the initial offering from "Ducks of A Feather" by Division Street, an ongoing marketing initiative featuring University of Oregon athletes.';
    standardDuck.attributes.concat([
      {
        trait_type: "Shoe Size",
        value: duck["shoe size"],
      },
      {
        trait_type: "Air Max 1",
        value: "AVAILABLE",
      },
    ]);
    fs.writeFileSync(`${metadataDir}/${i + 1}`, JSON.stringify(formattedDuck));
  });
};

let pngsCID = await getCIDOrPin("ipfs/pngs", "Duck PNGs");
let mp4sCID = await getCIDOrPin("ipfs/mp4s", "Duck MP4s");

let metadataDir = "ipfs/metadata";
generateMetadata(metadataDir, pngsCID, mp4sCID);
await getCIDOrPin(metadataDir, "Duck Metadata");
