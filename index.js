const express = require("express");
const puppeteer = require("puppeteer-core");

const app = express();
const port = 56189;

// Create an array to store recent songs
const recentSongs = [];

app.use(express.static("public"));

async function getNowPlayingInfo() {
  const browser = await puppeteer.connect({
    browserWSEndpoint: "wss://chrome.browserless.io?token=9883aff7-00df-4cef-a4e2-e583303a1975",
  });

  const page = await browser.newPage();

  await page.goto("https://bauermedia.pt/cidade/emissaofm");

  await page.waitForSelector(".song-info-text1", { timeout: 180000 });
  await page.waitForSelector(".song-info-text2");

  const artistText = await page.$eval(".song-info-text1", (element) => element.textContent.trim());
  const songText = await page.$eval(".song-info-text2", (element) => element.textContent.trim());

  await browser.close();

  const nowPlayingInfo = `${artistText} - ${songText}`.trim();

  return nowPlayingInfo;
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/now-playing", async (req, res) => {
  try {
    const nowPlayingInfo = await getNowPlayingInfo();

    // Check if the song is not already in the recentSongs array,
    // and it's not "-" or an empty string before adding it
    if (nowPlayingInfo !== "-" && nowPlayingInfo !== "" && !recentSongs.includes(nowPlayingInfo)) {
      // Add the currently playing song to the beginning of the recentSongs array
      recentSongs.unshift(nowPlayingInfo);

      // Ensure the recentSongs array contains a maximum of 10 songs
      if (recentSongs.length > 10) {
        recentSongs.pop(); // Remove the oldest song if there are more than 10
      }
    }

    res.send(nowPlayingInfo);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error");
  }
});

app.get("/recent-songs", (req, res) => {
  // Filter out "-" and empty string from the recentSongs array
  const filteredRecentSongs = recentSongs.filter((song) => song !== "-" && song !== "");

  // Return the filtered list of recent songs
  res.json(filteredRecentSongs);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
