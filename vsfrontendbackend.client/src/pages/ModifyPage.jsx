import React from "react";
import { ModifyDetails } from "@/components/ModifyDetails.jsx";
import {useLocation} from "react-router-dom";
import { useGameData } from "@/context/GameDataContext";
import { apiService } from "@/services/apiService.js";
import { useState, useEffect, useCallback } from "react";

function ModifyPage() {
	const { iconsIDToObjs, gamesInfo } = useGameData();
	const location = useLocation();
	const [gameData, setGameData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);

	var gameID = location.state?.gameID || null;

	// Memoize the fetch function to prevent unnecessary re-renders
	const fetchGameData = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Try to get data from API first
			try {
				const data = await apiService.getGame(gameID);
				setGameData(data);
				return;
			} catch (apiError) {
				console.log("API request failed, trying to get data from context");
				
				// If API fails, try to get data from context
				const gameFromContext = gamesInfo.find(game => game.Id === gameID);
				if (gameFromContext) {
					setGameData(gameFromContext);
					return;
				}
				
				// If not found in context either, throw error
				throw new Error("Game not found in context");
			}
		} catch (error) {
			console.error("Error fetching game data:", error);
			setError(error.message);
		} finally {
			setIsLoading(false);
		}
	}, [gameID]);

	useEffect(() => {
		if (gameID != null) {
			fetchGameData();
		} else {
			// Set default empty game data for new game
			setGameData({
				"Id": 1,
				"Name": "",
				"IconID": "",
				"Price": 1,
				"Rating": 1,
				"Description": "",
				"Genres": [],
				"Platforms": [],
			});
			setIsLoading(false);
		}
	}, [gameID, fetchGameData]); // Only depend on gameID and the memoized fetch function

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div style={{ margin: "2rem 0 0 0", display: "flex", justifyContent: "center"}}>
			<div style={{padding: "1em 2em 1em 1em", flex: "0 0 20%"}}>
				<img src={iconsIDToObjs[gameData.IconID]} alt={"icon"} style={{
					borderRadius: "1rem",
					height: "23rem",
					width: "auto",
				}}/>
				<h1 style={{margin: "1rem 0 0.5rem"}}>{gameData.Name}</h1>
				<h6 style={{color: "rgba(255,255,255,.6)"}}>Text and image loads when there's a valid Game ID associated with a game (when modifying)</h6>
			</div>

			<div style={{padding: "1em", flex: "0 0 63%"}}>
				<ModifyDetails gameData={gameData} />
			</div>            
		</div>
	)
}

export default ModifyPage;

