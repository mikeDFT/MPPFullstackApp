import React from "react";
import {SearchBar} from "@/components/SearchBar.jsx";
import {FilterSortingBar} from "@/components/FilterSortingBar.jsx";
import {StoreList} from "@/components/StoreList.jsx";
import {RatingChart} from "@/components/RatingChart.jsx";
import {KeepGeneratingGamesButton} from "@/components/KeepGeneratingGamesButton.jsx";
import { FileButtons } from "@/components/FileButtons";

function MainPage() {
    //const { actions } = useGameData();
    //const location = useLocation();
    //const actionType = location.state?.action || null;
    //const gameData = location.state?.gameData || null;

    //useEffect(() => {
    //    // Process incoming actions from navigation
    //    if (actionType && gameData) {
    //        if (actionType === "delete") {
    //            actions.deleteGame(gameData.Id);
    //        } else if (actionType === "modify") {
    //            actions.modifyGame(gameData);
    //        }
    //    }
    //}, []);

    return (
        <div style={{ margin: "2rem 0 0 0", display: "flex", justifyContent: "center"}}>
            <div style={{padding: "1em", flex: "0 0 30%"}}>
                <SearchBar />
                <div style={{padding: "1em"}}></div>
                <FilterSortingBar />
                <div style={{padding: "1em"}}></div>
                <RatingChart />
                <div style={{padding: "1em"}}></div>
                <KeepGeneratingGamesButton />
                <div style={{padding: "1em"}}></div>
                <FileButtons />
            </div>

            <div style={{padding: "1em", flex: "0 0 65%"}}>
                <StoreList />
            </div>
        </div>
    )
}

export default MainPage;

