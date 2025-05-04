import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from "@/context/DataContext";
import { StatisticsForPrice } from "@/utils/StatisticsForPrice.jsx";
import { apiService } from '@/services/apiService';

import "@/css/pagination.css";

// Constants for pagination
const ITEMS_PER_PAGE = 3;

export function StoreList() {
    const { sorting, filters } = useData().games;
    const { iconsIDToObjs } = useData();

    const containerRef = useRef(null);
    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        totalCount: 0,
        pageNumber: 1,
        pageSize: ITEMS_PER_PAGE,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false
    });
    
    const scrollPositionRef = useRef(0);
    const hasMorePages = currentPage < pagination.totalPages;
    const prevFiltersRef = useRef({ sorting, filters });
    
    // Use StatisticsForPrice only when we have games
    const priceStatistics = games.length > 0 ? StatisticsForPrice(games) : {};

    console.log(games)

    // Load games with current pagination, sorting and filters
    const loadGames = useCallback(async (page = 1, replace = true) => {
        if (isLoading) return;
        
        setIsLoading(true);
        setLoadError(null);
        
        try {
            console.log(`Loading page ${page} of games with filters:`, filters);
            
            const params = {
                sortBy: sorting.by,
                ascending: sorting.ascending,
                searchText: filters?.searchText || "",
                companySearchText: filters?.companySearchText || "",
                genres: filters?.genres || [],
                platforms: filters?.platforms || [],
                pageNumber: page,
                pageSize: ITEMS_PER_PAGE
            };
            
            const result = await apiService.getPaginatedGames(params);
            
            console.log("API response:", result);

            if (!result || !result.games) {
                throw new Error("Invalid response format from API");
            }
            
            console.log(`Received ${result.games.length} games for page ${page}`);
            console.log("Pagination info:", result.pagination);
            
            // Only replace games if 'replace' is true, otherwise append
            setGames(prevGames => 
                replace ? result.games : [...prevGames, ...result.games]
            );
            setPagination(result.pagination);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading games:', error);
            setLoadError(error.message || "Failed to load games");
        } finally {
            setIsLoading(false);
        }
    }, [sorting, filters, isLoading]);

    // Reset and reload when sorting or filters change
    useEffect(() => {
        // Check if sorting or filters actually changed
        const filtersChanged = 
            JSON.stringify({ sorting, filters }) !== 
            JSON.stringify(prevFiltersRef.current);
        
        if (filtersChanged) {
            console.log("Sorting or filters changed, loading new data");
            prevFiltersRef.current = { sorting, filters };
            
            // Don't clear games immediately, let loadGames handle it
            loadGames(1, true);
            console.log(games);
        }
    }, [sorting, filters, loadGames]);

    // Handle scroll events for infinite scrolling
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const handleScroll = () => {
            if (isLoading) return;
            
            // Save current scroll position
            scrollPositionRef.current = container.scrollTop;
            
            const { scrollTop, scrollHeight, clientHeight } = container;
            // Check if scrolled to bottom (with some threshold)
            const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 200;
            
            if (scrolledToBottom && hasMorePages) {
                console.log(`Scrolled near bottom, loading page ${currentPage + 1}`);
                loadGames(currentPage + 1, false);
            }
        };
        
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [currentPage, hasMorePages, isLoading, loadGames]);

    // Restore scroll position after loading more games
    useEffect(() => {
        if (containerRef.current && !isLoading && currentPage > 1) {
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = scrollPositionRef.current;
                }
            }, 0);
        }
    }, [games, isLoading, currentPage]);

    return (
        <div style={{
            backgroundColor: "#1F0D44",
            border: 0,
            borderRadius: "1em",
            color: "white",
            padding: "2rem",
            width: "100%",
            height: "180vh", 
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
        }}>
            {/* Header section */}
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

            {/* Games list container */}
            <div 
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: "auto",
                    paddingRight: "10px",
                }}
                className={"gamesContainer"}
            >
                {/* Error message */}
                {loadError && (
                    <div style={{
                        textAlign: "center", 
                        padding: "1rem", 
                        color: "#ff6b6b",
                        backgroundColor: "rgba(255,0,0,0.1)",
                        borderRadius: "0.5rem",
                        margin: "1rem 0"
                    }}>
                        Error: {loadError}
                        <button 
                            onClick={() => loadGames(currentPage, false)} 
                            style={{
                                marginLeft: "1rem",
                                padding: "0.25rem 1rem",
                                backgroundColor: "#6b5ce7",
                                borderRadius: "0.25rem"
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}
                
                {/* Loading overlay for initial load */}
                {isLoading && games.length === 0 && (
                    <div style={{
                        textAlign: "center", 
                        padding: "2rem",
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "0.5rem"
                    }}>
                        Loading games...
                    </div>
                )}
                
                {/* Empty state - only show when not loading and no games */}
                {games.length === 0 && !isLoading ? (
                    <div style={{textAlign: "center", padding: "2rem"}}>
                        No games available
                    </div>
                ) : (
                    /* Game list items */
                    games.map((game) => (
                        <div style={{display: "flex",
                            backgroundColor: "#2f1f59",
                            borderRadius: "1rem",
                            border: "1px solid rgba(255, 255, 255, 0.5)",
                            margin: "1rem 0",
                            opacity: isLoading && currentPage === 1 ? "0.7" : "1", // Dim existing games during reload
                            transition: "opacity 0.2s"
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
                                <h6 style={{color: "rgba(255, 255, 255, 0.6)", fontSize: "0.8rem"}}>By {game.CompanyName}</h6>
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
                                <h5 style={{color: "#A6FF00", float: "right"}}>{priceStatistics[game.Id] || ""}</h5>
                            </div>
                        </div>
                    ))
                )}
                
                {/* Loading indicator at bottom when fetching more */}
                {isLoading && games.length > 0 && (
                    <div style={{textAlign: "center", padding: "1rem"}}>
                        {currentPage === 1 ? "Refreshing games..." : "Loading more games..."}
                    </div>
                )}
                
                {/* End of list indicator */}
                {!hasMorePages && games.length > 0 && !isLoading && (
                    <div style={{textAlign: "center", padding: "1rem", color: "rgba(255,255,255,0.6)"}}>
                        No more games to load
                    </div>
                )}
            </div>
        </div>
    )
}