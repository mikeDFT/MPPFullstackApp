import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useData } from "@/context/DataContext";
import { StatisticsForPrice } from "@/utils/StatisticsForPrice.jsx"

import "@/css/pagination.css";

// constants for infinite scrolling
const ITEMS_PER_PAGE = 3;
const PAGES_TO_LOAD_BELOW = 2;

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
    const { gamesInfo, sorting } = useData().games;
    const { iconsIDToObjs } = useData();

    const containerRef = useRef(null);
    const [visibleGames, setVisibleGames] = useState([]);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: ITEMS_PER_PAGE + (1+PAGES_TO_LOAD_BELOW)});
    const [sortedGames, setSortedGames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const priceStatistics = StatisticsForPrice(gamesInfo);
    const scrollPositionRef = useRef(0);
    const isInitialLoadRef = useRef(true);
    

    // sort games whenever sorting changes
    useEffect(() => {
        const sorted = sortGames(gamesInfo, sorting.by, sorting.ascending);
        setSortedGames(sorted);
        
        // Only reset visible range on initial load or when sorting changes
        if (isInitialLoadRef.current) {
            setVisibleRange({ start: 0, end: ITEMS_PER_PAGE + (1+PAGES_TO_LOAD_BELOW) });
            isInitialLoadRef.current = false;
        }
    }, [gamesInfo, sorting]);
    
    // update visible games when visible range changes
    useEffect(() => {
        console.log(sortedGames.slice(visibleRange.start, visibleRange.end))
        setVisibleGames(sortedGames.slice(visibleRange.start, visibleRange.end));
    }, [visibleRange, sortedGames]);
    
    // restore scroll position after games update
    useEffect(() => {
        if (containerRef.current && !isInitialLoadRef.current) {
            // Use setTimeout to ensure the DOM has updated
            setTimeout(() => {
                containerRef.current.scrollTop = scrollPositionRef.current;
            }, 0);
        }
    }, [sortedGames]);
    
    // handle scroll events
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const handleScroll = () => {
            if (isLoading) return;
            
            // Save current scroll position
            scrollPositionRef.current = container.scrollTop;
            
            const { scrollTop, scrollHeight, clientHeight } = container;
            const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
            
            // console.log(scrollPercentage)
            // load more when scrolling down (near bottom)
            if (scrollPercentage > 0.7) {
                loadMoreItems();
            }
            
            // remove items when scrolling up (near top)
            if (scrollPercentage < 0.3) {
                removeItems();
            }
        };
        
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [visibleRange, isLoading, sortedGames.length]);
    
    // load more items when scrolling down
    const loadMoreItems = () => {
        if (isLoading) return;
        
        setIsLoading(true);
        
        // calculate new end index
        const newEnd = Math.min(
            sortedGames.length,
            visibleRange.end + ITEMS_PER_PAGE
        )
        
        setVisibleRange({ start: 0, end: newEnd });
        // console.log(0 + " to " + newEnd);
        setIsLoading(false);
    };
    
    // remove items when scrolling up
    const removeItems = () => {
        if (isLoading) return;
        
        setIsLoading(true);

        // calculate new end index to maintain the window size
        const newEnd = Math.max(
            ITEMS_PER_PAGE * (1+PAGES_TO_LOAD_BELOW),
            visibleRange.end - ITEMS_PER_PAGE
        )
        
        setVisibleRange({ start: 0, end: newEnd });
        setIsLoading(false);
    };

    // Debug information
    // console.log("Visible range:", visibleRange);
    // console.log("Visible games count:", visibleGames.length);
    // console.log("Total games:", sortedGames.length);

    return (
        <div style={{
            backgroundColor: "#1F0D44",
            border: 0,
            borderRadius: "1em",
            color: "white",
            padding: "2rem",
            width: "100%",
            height: "180vh", // set a fixed height for scrolling
            overflow: "hidden", // prevent body scrolling
            display: "flex",
            flexDirection: "column"
        }}>
            <div>
                <div>
                    <Link to={"/modify"} state={{gameData: null}} className={"gameButton"} style={{float: "right"}}>
                        <button className={"gameButton addAGameButton"}>
                            Add a game
                        </button>
                    </Link>
                </div>
                <div>
                    <h3 className="font-bold">Store:</h3>
                    <h4 style={{color: "rgba(255, 255, 255, 0.5)"}}>Best results for: "Good games"</h4>
                </div>
            </div>

            <div style={{padding: "0.3rem"}}></div>

            <div 
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: "10px",
                }}
                className={ "gamesContainer" }
            >
                {visibleGames.length === 0 ? (
                    <div style={{textAlign: "center", padding: "2rem"}}>
                        No games available
                    </div>
                ) : ( console.log(visibleGames.map((game) => game)),
                    visibleGames.map((game) => (
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
                                <h5 style={{color: "#A6FF00", float: "right"}}>{priceStatistics[game.Id]}</h5>
                            </div>
                        </div>
                    ))
                )}
                
                {isLoading && (
                    <div style={{textAlign: "center", padding: "1rem"}}>
                        Loading more games...
                    </div>
                )}
                
                {visibleRange.end >= sortedGames.length && sortedGames.length > 0 && (
                    <div style={{textAlign: "center", padding: "1rem"}}>
                        No more games to load
                    </div>
                )}
            </div>
        </div>
    )
}