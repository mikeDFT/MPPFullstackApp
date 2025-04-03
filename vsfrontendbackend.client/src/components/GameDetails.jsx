

export function GameDetails({ gameData }) {
    return (
        <div style={{
            backgroundColor: "#1F0D44",
            border: 0,
            borderRadius: "1rem",
            color: "white",
            padding: "3rem",
            width: "100%",
        }}>
            <div>
                <div style={{display: "flex", alignItems: "space-between"}}>
                    <h1 style={{display: "block"}}>{gameData.Name}</h1>
                    <h3 style={{marginLeft: "auto", color: "#A6FF00"}}>$ {gameData.Price}</h3>
                </div>
                <h3 style={{color: "rgba(255, 255, 255, 0.7)"}}>{gameData.Rating}/5.0 Stars</h3>

                <h4 style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "3rem 0",
                    textAlign: "justify"
                }}>{gameData.Description}</h4>

                <h5 style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "1rem 0",
                    textAlign: "justify"
                }}>Genres: {gameData.Genres.map(g => g + "; ")}</h5>
                <h5 style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    margin: "1rem 0",
                    textAlign: "justify"
                }}>Platforms: {gameData.Platforms.map(g => g + "; ")}</h5>

                <div style={{display: "flex", flexDirection: "column",
                    justifyContent: "center", width: "100%", alignItems: "center",
                    margin: "5rem 0 0"
                }}>
                    <button className={"viewPageButton addToCartButton"}>
                        Add to cart
                    </button>

                    <button className={"viewPageButton addToWishlistButton"}>
                        Add to wishlist
                    </button>
                </div>

                <h4 style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    margin: "2rem 0 0",
                }}>Game ID: {gameData.Id}</h4>
            </div>

            <div style={{padding: "0.3rem"}}></div>


        </div>
    )
}