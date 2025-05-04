export function StatisticsForPrice(gamesInfo) {
    // Handle empty or invalid input
    if (!gamesInfo || !Array.isArray(gamesInfo) || gamesInfo.length === 0) {
        return {};
    }
    
    var sortedGames = [...gamesInfo];
    sortedGames.sort((a, b) => a.Price - b.Price);

    var nrGames = sortedGames.length / 3;
    var out = {};
    
    for (var i = 0; i < sortedGames.length; i++) {
        const game = sortedGames[i];
        
        // Skip games without valid Id
        if (!game || !game.Id) continue;

        if (i < nrGames)
            out[game.Id] = "$";
        else if (i < nrGames*2)
            out[game.Id] = "$$";
        else
            out[game.Id] = "$$$";
    }

    return out;
}

