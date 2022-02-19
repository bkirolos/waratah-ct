const fs = require("fs");
const generate = require("csv-generate");

require("dotenv").config();

var Vimeo = require("vimeo").Vimeo;
var client = new Vimeo(
  process.env.VIMEO_CLIENT_ID,
  process.env.VIMEO_CLIENT_SECRET,
  process.env.VIMEO_ACCESS_TOKEN
);

const promisifiedVimeoClient = (url) => {
  return new Promise((resolve, reject) => {
    client.request(url, (error, result) =>
      error ? reject(error) : resolve(result)
    );
  });
};

const main = () => {
  //client.request(
  //  { path: "/videos/679385721" },
  //  function (error, body, status_code, headers) {
  //    console.log(body);
  //  }
  //);

  client.request(
    {
      path: "/users/165434773/projects/8544100/videos?per_page=100&page=2",
      page: 0,
    },
    function (error, body, status_code, headers) {
      let result = body["data"].map((v) => {
        let video_id = v["uri"].replace("/videos/", "");
        return {
          manage_link: `https://vimeo.com/manage/${video_id}/distribution#video-file-links`,
          name: v["name"],
        };
      });

      result.forEach((entry) => {
        console.log(`${entry.name},${entry.manage_link}`);
      });
    }
  );
};

main();
