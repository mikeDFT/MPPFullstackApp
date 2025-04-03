export function UnitTestCRUD(action, SharedData, state) {
	// testing add / update / delete

	if (!action || !SharedData || !state || !state.gameData) {
		console.error("UnitTestCRUD: Missing required parameters");
		return false;
	}

	const gameData = state.gameData;
	const gameID = gameData.ID;

	// Test DELETE action
	if (action === "delete") {
		// verify the game with specified ID was removed
		const gameExists = SharedData.gamesInfo.some(game => game.ID === gameID);

		if (gameExists) {
			console.error(`UnitTest FAILED: Delete operation did not remove game with ID ${gameID}`);
			return false;
		} else {
			console.log(`UnitTest PASSED: Game with ID ${gameID} was successfully deleted`);
			return true;
		}
	}

	// Test MODIFY action (handles both update and add scenarios)
	else if (action === "modify") {
		// check if a game with this ID exists in the data
		const gameIndex = SharedData.gamesInfo.findIndex(game => game.ID === gameID);
		const wasUpdate = gameIndex !== -1;

		if (wasUpdate) {
			// Testing UPDATE scenario - validate all properties were updated correctly
			const updatedGame = SharedData.gamesInfo[gameIndex];
			let allPropertiesUpdated = true;

			for (const [key, value] of Object.entries(gameData)) {
				if (key === "ID") continue;
				if (updatedGame[key] !== value) {
					console.error(`UnitTest FAILED: Property ${key} was not updated correctly`);
					console.error(`  Expected: ${value}, Actual: ${updatedGame[key]}`);
					allPropertiesUpdated = false;
					break;
				}
			}

			if (allPropertiesUpdated) {
				console.log(`UnitTest PASSED: Game with ID ${gameID} was successfully updated`);
				return true;
			} else {
				return false;
			}
		} else {
			// Testing ADD scenario - verify the game was added to the list
			const newGameIndex = SharedData.gamesInfo.findIndex(game => game.ID === gameID);

			if (newGameIndex === -1) {
				console.error(`UnitTest FAILED: New game with ID ${gameID} was not added to the list`);
				return false;
			}

			// Verify all properties of the new game match the expected values
			const newGame = SharedData.gamesInfo[newGameIndex];
			let allPropertiesMatch = true;

			for (const [key, value] of Object.entries(gameData)) {
				if (newGame[key] !== value) {
					console.error(`UnitTest FAILED: New game property ${key} does not match expected value`);
					console.error(`  Expected: ${value}, Actual: ${newGame[key]}`);
					allPropertiesMatch = false;
					break;
				}
			}

			if (allPropertiesMatch) {
				console.log(`UnitTest PASSED: New game with ID ${gameID} was successfully added`);
				return true;
			} else {
				return false;
			}
		}
	} else {
		console.error(`UnitTest FAILED: Unknown action type '${action}'`);
		return false;
	}
}
