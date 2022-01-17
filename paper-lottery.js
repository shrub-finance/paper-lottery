const fs = require('fs');
const seedrandom = require('seedrandom');

const userDataFile = process.argv[2]
const seed = process.argv[3];

const OUTPUT_FILE = 'address-index-map.json';

const rng = seedrandom(seed);
const userDataUnparsed = fs.readFileSync(userDataFile, 'utf-8');
const userData = JSON.parse(userDataUnparsed);

const amountOfEach = {
  legendary: 10,
  rare: 100,
  uncommon: 1000,
  common: 8890
};

const nftObjects = {
  legendary: [],
  rare: [],
  uncommon: [],
  common: []
}

const scorecard = {
  group1: {},
  group2: {},
  group3: {},
  group4: {},
  group5: {},
  group6: {},
  group7: {},
  group8: {},
  dev: {},   // 20% allocation
  treasury: {},                // 20% allocation
  incentive: {},               // 10% allocation
  left: { legendary: 10, rare: 100, uncommon: 1000, common: 8890 }
}

function pickRandomItem(bucket) {
  const randomIndex = Math.floor(rng() * bucket.length)
  return bucket.splice(randomIndex, 1);
}

let index = 1;
// create objects for all of the NFTs
for (const [rarity, count] of Object.entries(amountOfEach)) {
  for (let i = 0; i < count; i++) {
    nftObjects[rarity].push({index, rarity});
    index++;
  }
}

// Group 1: (4)  Community Leaders + Active Mods (Thomas + Sunita)         + All Legendary
// Group 2: (11) Server Boosters + SuperSpreader+/++                       + All Rare
// Group 3: (84)        Verified Beta Testers +                             + 200 uncommon
// Group 4: (90)  SuperSpreader                                             + 400 uncommon
// Group 5: (7)   Chatty Kathy                                              + All uncommon
// Group 6: (17)  Bud                                                       - Legendary + 1000 common
// Group 7: (600) Early/10k club                                            + 1000 common
// Group 8: Seedlings                                                 + All common

let bucket = [];
const output = {};

for (const [groupName, group] of Object.entries(userData).sort((a,b) => b[0] < a[0] ? 1 : -1)) {
  switch (groupName) {
    case 'group1':
      // Add all legendary
      while (nftObjects.legendary.length > 0) {
        bucket.push(nftObjects.legendary.shift())
      }
      break;
    case 'group2':
      // all rare
      while (nftObjects.rare.length > 0) {
        bucket.push(nftObjects.rare.shift())
      }
      break;
    case 'group3':
      // 200 uncommon
      for (let i = 0; i < 200; i++) {
        bucket.push(nftObjects.uncommon.shift());
      }
      break;
    case 'group4':
      // 400 uncommon
      for (let i = 0; i < 400; i++) {
        bucket.push(nftObjects.uncommon.shift());
      }
      break;
    case 'group5':
      // all uncommon
      while (nftObjects.uncommon.length > 0) {
        bucket.push(nftObjects.uncommon.shift())
      }
      break;
    case 'group6':
      // Remove legendary
      bucket = bucket.filter(item => item.rarity !== 'legendary');
      // 1000 common
      for (let i = 0; i < 1000; i++) {
        bucket.push(nftObjects.common.shift());
      }
      break;
    case 'group7':
      // 1000 common
      for (let i = 0; i < 1000; i++) {
        bucket.push(nftObjects.common.shift());
      }
      break;
    case 'group8':
      // all common
      while (nftObjects.common.length > 0) {
        bucket.push(nftObjects.common.shift())
      }
      break;
    default:
      throw new Error(`invalid group name ${groupName}`);
  }
  for (const address of group) {
    const {rarity, index} = pickRandomItem(bucket)[0];
    output[address] = index.toString();
    // just for reporting
    if (!scorecard[groupName]) {
      scorecard[groupName] = {};
    }
    if (!scorecard[groupName][rarity]) {
      scorecard[groupName][rarity] = 0
    }
    scorecard[groupName][rarity]++;
    scorecard.left[rarity]--;
  }
}

// Allocate to other categories
// Dev team gets remaining legendary
scorecard.dev.legendary = scorecard.left.legendary;
scorecard.left.legendary = 0;

// treasury and incentive get 1 rare each, dev gets remaining
if (scorecard.left.rare > 0) {
  scorecard.incentive.rare = 1;
  scorecard.left.rare--;
} else {
  scorecard.incentive.rare = 0;
}
if (scorecard.left.rare > 0) {
  scorecard.treasury.rare = 1;
  scorecard.left.rare--;
} else {
  scorecard.treasury.rare = 0;
}

scorecard.dev.rare = scorecard.left.rare;
scorecard.left.rare = 0;

// Uncommon are split proportionally
const uncommonToIncentive = Math.floor(scorecard.left.uncommon * 0.2)
scorecard.incentive.uncommon = uncommonToIncentive;
scorecard.left.uncommon-= uncommonToIncentive;
const uncommonToTreasury = Math.floor(scorecard.left.uncommon * 0.5)
scorecard.treasury.uncommon = uncommonToTreasury;
scorecard.left.uncommon-= uncommonToTreasury;
scorecard.dev.uncommon = scorecard.left.uncommon;
scorecard.left.uncommon = 0;

// Distrute common to match proper percentages
const commonToIncentive = 1000 - scorecard.incentive.rare - scorecard.incentive.uncommon;
const commonToTreasury = 2000 - scorecard.treasury.rare - scorecard.treasury.uncommon;
const commonToDev = 2000 - scorecard.dev.legendary - scorecard.dev.rare - scorecard.dev.uncommon;

scorecard.incentive.common = commonToIncentive;
scorecard.left.common-= commonToIncentive;

scorecard.treasury.common = commonToTreasury;
scorecard.left.common-= commonToTreasury;

scorecard.dev.common = commonToDev;
scorecard.left.common-= commonToDev;

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
console.log(scorecard);
console.log(`results written to ${OUTPUT_FILE}`);
