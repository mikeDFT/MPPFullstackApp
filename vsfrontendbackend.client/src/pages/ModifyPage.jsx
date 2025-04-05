import React from "react";
import { ModifyDetails } from "@/components/ModifyDetails.jsx";
import {useLocation} from "react-router-dom";
import { useGameData } from "@/context/GameDataContext";
import { apiService } from "@/services/apiService.js";
import { useState, useEffect } from "react";

function ModifyPage() {
	const { iconsIDToObjs } = useGameData();
	const location = useLocation();

	var gameID = location.state?.gameID || null;

	// Declare a state variable to hold the game data
	const [gameData, setGameData] = useState(null);

	console.log("ID:" + gameID);
	useEffect(() => {
		async function fetchGameData() {
			try {
				const data = await apiService.getGame(gameID);
				setGameData(data); // Set the state with the fetched data
			} catch (error) {
				console.error("Error fetching game data:", error);
			}
		};

		console.log("IDDD:" + gameID);
		if(gameID != null)
			fetchGameData(); // Call the async function
		else {
			setGameData({
				"Id": 1,
				"Name": "",
				"IconID": "",
				"Price": 1,
				"Rating": 1,
				"Description": "",
				"Genres": [],
				"Platforms": [],
			})
		}
	}, [gameID]); // Dependency array to run effect when gameID changes

	if (!gameData) {
		return <div>Loading...</div>;
	}

	return (
		<div style={{ margin: "2rem 0 0 0", display: "flex", justifyContent: "center"}}>
			<div style={{padding: "1em 2em 1em 1em", flex: "0 0 20%"}}>
				<img src={iconsIDToObjs[gameData.IconID]} alt={"icon"} style={{
					// margin: "0 0 1rem 0",
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

