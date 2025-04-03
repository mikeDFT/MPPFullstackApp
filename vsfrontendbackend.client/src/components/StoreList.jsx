import Pagination from 'react-bootstrap/Pagination';
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { UnitTestFilteringSortingSearch } from "@/tests/UnitTestFilteringSortingSearch.jsx";
import { useGameData } from "@/context/GameDataContext";
import { StatisticsForPrice } from "@/utils/StatisticsForPrice.jsx"

import "@/css/pagination.css";

function sortGames(games, sortBy, ascending) {
    // Create a copy of the array to avoid mutating the original
    const gamesCopy = [...games];
    
    const direction = ascending ? 1 : -1;
    
    if (sortBy === "Name") {
        return gamesCopy.sort((a, b) => direction * a.Name.localeCompare(b.Name));
    } else if (sortBy === "Price") {
        return gamesCopy.sort((a, b) => direction * (a.Price - b.Price));
    } else if (sortBy === "Rating") {
        return gamesCopy.sort((a, b) => direction * (a.Rating - b.Rating));
    }
    else return gamesCopy;
}

//function unitTestData(gamesInfo, filterFunction, filters, sorting, searchText) {
//    console.log("SharedGamesInfo:", gamesInfo)
//    UnitTestFilteringSortingSearch(gamesInfo, filterFunction(filters), filters, sorting, searchText);
//    var _filters = ["PC", "Xbox", "COOP"]
//    UnitTestFilteringSortingSearch(gamesInfo, filterFunction(_filters), _filters, sorting, searchText)
//    _filters = ["PC", "Roguelike"]
//    UnitTestFilteringSortingSearch(gamesInfo, filterFunction(_filters), _filters, sorting, searchText)

//    console.log("ALL TESTS PASSED")
//}

export function StoreList() {
    const { gamesInfo, iconsIDToObjs, sorting } = useGameData();

    // function sortFunc(a, b) {
    //     if (sorting.by == "Price")
    //         return a.Price - b.Price;
    //     if (sorting.by == "Rating")
    //         return a.Rating - b.Rating;
    //     if (sorting.by == "Name")
    //         return a.Name.localeCompare(b.Name);
    // }

    // function applyFiltersToData(filters) {
    //     var filtered = gamesInfo.filter(gameData => {
    //         for (var f of filters) {
    //             if (!gameData.Genres.includes(f) && !gameData.Platforms.includes(f))
    //                 return false;
    //         }

    //         return gameData.Name.toLowerCase().includes(searchText.toLowerCase());
    //     })

    //     var sorted = filtered.sort(sortFunc);

    //     // console.log("sorting.ascending:", sorting.ascending)
    //     // console.log("sorting.by:", sorting.by)
    //     if (sorting.ascending)
    //         return sorted;
    //     else
    //         return sorted.reverse();
    // }

    // unitTestData(gamesInfo, applyFiltersToData, filters, sorting, searchText);
    var priceStatistics = StatisticsForPrice(gamesInfo)

    var [gamesPerPage, setGamesPerPage] = useState(5);
    var [currentPage, setCurrentPage] = useState(1);
    var [totalPages, setTotalPages] = useState(1);
    var [paginatedGames, setPaginatedGames] = useState([]);
    
    useEffect(() => {
        const gamesList = sortGames(gamesInfo, sorting.by, sorting.ascending);
        // const filteredData = applyFiltersToData(filters);
        setTotalPages(Math.ceil(gamesList.length / gamesPerPage));
        if(totalPages < currentPage) {
            setCurrentPage(Math.max(1, totalPages));
        }
        
        // Get current page data
        const indexOfLastGame = currentPage * gamesPerPage;
        const indexOfFirstGame = indexOfLastGame - gamesPerPage;
        setPaginatedGames(gamesList.slice(indexOfFirstGame, indexOfLastGame));
    }, [sorting, currentPage, gamesInfo, gamesPerPage]);
    
    // Handle pagination clicks
    const handlePageClick = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) {
            return;
        }
        setCurrentPage(pageNumber);
    };
    
    // Generate page numbers array
    const getPageNumbers = () => {
        const pageNumbers = [];
        
        // always include first page
        pageNumbers.push(1);
        
        // add ... if needed
        if (currentPage > 3) {
            pageNumbers.push('...');
        }
        
        // add at most 2 pages around current page (2 pages before, 2 pages after)
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pageNumbers.push(i);
        }
        
        // add ... if needed
        if (currentPage < totalPages - 2) {
            pageNumbers.push('...');
        }
        
        // always include last page if there's more than 1 page
        if (totalPages > 1) {
            pageNumbers.push(totalPages);
        }
        
        return pageNumbers;
    };

    function updateGamesPerPage(inputValue) {
        var newVal = Math.min(Math.max(inputValue, 1), 50)
        if (newVal !== gamesPerPage) {
            setGamesPerPage(newVal);
        }
    }

    return (
        <div style={{
            backgroundColor: "#1F0D44",
            border: 0,
            borderRadius: "1em",
            color: "white",
            padding: "2rem",
            width: "100%",
        }}>
            <Link to={"/modify"} state={{gameData: null}} className={"gameButton"} style={{float: "right"}}>
                <button className={"gameButton addAGameButton"}>
                    Add a game
                </button>
            </Link>
            <div>
                <h3 className="font-bold">Store:</h3>
                <h4 style={{color: "rgba(255, 255, 255, 0.5)"}}>Best results for: "Good games"</h4>
            </div>

            <div style={{padding: "0.3rem"}}></div>

            <div>
                {paginatedGames.map((game) => (
                    <div style={{display: "flex",
                        // justifyContent: "space-between",
                        backgroundColor: "#2f1f59",
                        borderRadius: "1rem",
                        border: "1px solid rgba(255, 255, 255, 0.5)",
                        margin: "1rem 0",
                    }} key={game.Id}>
                        <img src={iconsIDToObjs[game.IconID]} style={{
                            padding: "1rem",
                            borderRadius: "30px",
                            height: "11rem",
                            width: "auto",
                        }}  alt={game.Name}/>
                        <div style={{padding: "1rem"}}>
                            <h5>{game.Name}</h5>
                            <h6 style={{color: "rgba(255, 255, 255, 0.6)"}}>{game.Rating}/5 stars</h6>
                            <div style={{margin: "2.5rem 0 0 0"}}>
                                <Link to={"/view"} state={{ gameID: game.Id }} className={"gameButton"}>
                                    <button className={"gameButton viewGameButton"}>
                                        View
                                    </button>
                                </Link>

                                <Link to={"/modify"} state={{ gameID: game.Id }} className={"gameButton"}>
                                    <button className={"gameButton modifyGameButton"}>
                                        Modify
                                    </button>
                                </Link>

                                <Link to={"/gamble"} state={{ gameID: game.Id }} className={"gameButton"}>
                                    <button className={"gameButton"}>
                                        Gamble
                                    </button>
                                </Link>
                            </div>
                        </div>
                        <div style={{padding: "1rem", marginLeft: "auto"}}>
                            <h5 style={{color: "#A6FF00"}}> ${game.Price} </h5>
                            <h5 style={{color: "#A6FF00", float: "right"}}>{priceStatistics[game.ID]}</h5>
                        </div>
                    </div>
                ))}
            </div>

            <div className="custom-pagination">
				<button 
					className={`pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
					onClick={() => handlePageClick(1)}
					disabled={currentPage === 1}
				>&laquo;</button>
				<button 
					className={`pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
					onClick={() => handlePageClick(currentPage - 1)}
					disabled={currentPage === 1}
				>&lsaquo;</button>
				
				{getPageNumbers().map((page, index) => (
					<button
						key={index}
						className={`pagination-item ${page === currentPage ? 'active' : ''} ${page === '...' ? 'disabled' : ''}`}
						onClick={() => page !== '...' ? handlePageClick(page) : null}
					>
						{page}
					</button>
				))}
				
				<button 
					className={`pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
					onClick={() => handlePageClick(currentPage + 1)}
					disabled={currentPage === totalPages}
				>&rsaquo;</button>
				<button 
					className={`pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
					onClick={() => handlePageClick(totalPages)}
					disabled={currentPage === totalPages}
				>&raquo;</button>
            </div>

            <div style={{
                margin: "auto",
                width: "20%",
                padding: "1rem"}}>
                <input type="number" className="form-control formDiv" id="floatingInput"
                       placeholder="Games per page" value={gamesPerPage || null}
                       onChange={(event) => {updateGamesPerPage(event.target.value)}}
                />
                <label htmlFor="floatingInput" className="formLabel">Games per page</label>
            </div>
        </div>
    )
}