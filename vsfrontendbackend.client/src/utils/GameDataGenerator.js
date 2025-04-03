import {iconsIDToObjs} from "@/utils/IconIDs.jsx";
import { DEFAULT_PLATFORMS, DEFAULT_GENRES } from "@/utils/GenresPlatforms.jsx";

// Game name prefixes for random generation
const namePrefixes = [
	"Super", "Epic", "Dark", "Light", "Eternal", "Mystic",
	"Magic", "Tech", "Cyber", "Retro", "Future", "Ancient",
	"Deadly", "Cosmic", "Stellar", "Hyper", "Mega", "Ultra", 
	"Quantum", "Neon", "Pixel", "Astral", "Phantom", "Solar",
	"Lunar", "Divine", "Infernal", "Frozen", "Blazing", "Thunder",
	"Shadow", "Radiant", "Savage", "Primal", "Digital", "Fabled",
	"Rogue", "Golden", "Crystal", "Dragon", "Stealth", "Chaos",
	"Void", "Emerald", "Ruby", "Sapphire", "Iron", "Midnight"
];

// Game name suffixes for random generation
const nameSuffixes = [
	"Quest", "Adventure", "Journey", "Legend", "Tales", "Chronicles",
	"Saga", "Hero", "Kingdom", "Realm", "World", "Lands",
	"Warriors", "Masters", "Conqueror", "Odyssey", "Dungeons", "Depths",
	"Fortress", "Dynasty", "Empire", "Legends", "Titans", "Guardians",
	"Hunters", "Knights", "Wizards", "Explorers", "Raiders", "Frontiers",
	"Horizons", "Dimensions", "Infinity", "Ascension", "Battle", "War",
	"Tycoon", "Simulator", "Survival", "Commander", "Tactics", "Defense",
	"Rebellion", "Revolution", "Escape", "Rescue", "Assault", "Siege",
	"Trials", "Mysteries", "Secrets", "Legacy", "Dawn", "Dusk", "Nexus"
];

function getRndIconID() {
	var rndIconID = Object.keys(iconsIDToObjs)[Math.floor(Math.random() * Object.keys(iconsIDToObjs).length)];
	if (rndIconID === "") {
		return getRndIconID();
	}
	return rndIconID;
}

function getRndGameID(gamesList) {
	var rndGameID = Math.floor(Math.random() * 1000000);
    if (gamesList.find(game => game.ID === rndGameID)) {
        return getRndGameID(gamesList);
    }
    return rndGameID;
}

function generateGameName() {
	const prefix = namePrefixes[Math.floor(Math.random() * namePrefixes.length)];
	const suffix = nameSuffixes[Math.floor(Math.random() * nameSuffixes.length)];
	return `${prefix} ${suffix}`;
}

// gets a between min and max rnd items from the given array
function getRandomItems(array, min = 1, max = 3) {
	var newArray = array.slice(); // clone the array
    newArray.sort(() => Math.random() - 0.5); // shuffle the array  
    return newArray.slice(0, Math.floor(Math.random() * (max - min + 1)) + min); // get a random number of items between min and max
}

export function generateGameData(gamesList) {
	const selectedGenres = getRandomItems(DEFAULT_GENRES, 2, 4);
	const selectedPlatforms = getRandomItems(DEFAULT_PLATFORMS, 2, 4);

	return {
		ID: getRndGameID(gamesList),
		Name: generateGameName(),
		IconID: getRndIconID(),
		Price: Math.floor(Math.random() * 60) + 0.99,
		Rating: Number((Math.floor(Math.random() * 10) / 10 * 4.5 + 1).toFixed(1)), // sometimes floating point precision is like "1.7000000004", so I fix it to 1 decimal place
		Description: "Epic game where you do this and that and something else and you can (probably) do it with your friends or alone and also lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
		Genres: selectedGenres,
		Platforms: selectedPlatforms
	};
}

export function generateGames(count) {
	const gamesList = [];
	for (let i = 0; i < count; i++) {
		gamesList.push(generateGameData(gamesList));
	}
	return gamesList;
}

export default generateGames; 