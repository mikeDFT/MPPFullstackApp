import React from "react";
import {GameDetails} from "@/components/GameDetails.jsx";
import {useLocation} from "react-router-dom";
import { useData } from "@/context/DataContext";
import { apiService } from "@/services/apiService.js";
import { useState, useEffect } from "react";

function ViewPage() {
    const { iconsIDToObjs } = useData();
    const location = useLocation();
    
    const gameID = location.state?.gameID || null;

    // Declare a state variable to hold the game data
    const [gameData, setGameData] = useState(null);

    useEffect(() => {
        async function fetchGameData() {
            if (gameID) {
                try {
                    const data = await apiService.getGame(gameID);
                    setGameData(data); // Set the state with the fetched data
                } catch (error) {
                    console.error("Error fetching game data:", error);
                }
            }
        };

        fetchGameData(); // Call the async function
    }, [gameID]); // Dependency array to run effect when gameID changes

    if (!gameData) {
        return <div>Loading...</div>;
    }

    return (
        <div style={{ margin: "2rem 0 0 0", display: "flex", justifyContent: "center"}}>
            <div style={{padding: "1em 2em 1em 1em", flex: "0 0 30%"}}>
                <img src={iconsIDToObjs[gameData.IconID]} key={gameID} alt={"icon"} style={{
                    // padding: "0 rem 0 0",
                    borderRadius: "1rem",
                    height: "35rem",
                    width: "auto",
                }}/>
            </div>

            <div style={{padding: "1em", flex: "0 0 50%"}}>
                <GameDetails gameData={gameData}/>
            </div>
        </div>
    )
}

export default ViewPage;

