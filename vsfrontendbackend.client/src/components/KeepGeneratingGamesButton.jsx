import React, {useRef, useState} from "react";
import generateGames from "@/utils/GameDataGenerator";
import {useGameData} from "@/context/GameDataContext.jsx";


export function KeepGeneratingGamesButton() {
	const { actions } = useGameData();

	const intervalRef = useRef(null);

	const [isGenerating, setIsGenerating] = useState(false);

	// Function to generate a batch of games
	const generateMoreGames = () => {
		if (isGenerating) {
			// Stop generating
			setIsGenerating(false);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			return;
		}

		// Start generating
		setIsGenerating(true);

		// Store the interval ID so we can clear it later
		intervalRef.current = setInterval(() => {
			// Generate 1 new game
			const newGames = generateGames(1);
			newGames.forEach(game => {
				actions.modifyGame(game);
			});
		}, 1000); // Generate a game every 1000ms
	};

	return (
		<button
			style={{width: "100%", backgroundColor: "#650173", color: "#000000", borderRadius: "0.5em", padding: "0.5em", fontSize: "1em"}}
			onClick={generateMoreGames}
		>
			{isGenerating ? 'Stop generating' : 'Start generating'}
		</button>
	)
}

