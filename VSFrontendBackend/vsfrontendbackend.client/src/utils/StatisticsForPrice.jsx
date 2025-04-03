
export function StatisticsForPrice(gamesInfo) {
    var sortedGames = gamesInfo.sort((a, b) => {return a.Price - b.Price;})

    var nrGames = sortedGames.length / 3
    var out = {}
    for (var i = 0; i < sortedGames.length; i++) {
        const game = sortedGames[i];

        if (i < nrGames)
            out[game.ID] = "$"
        else if (i < nrGames*2)
            out[game.ID] = "$$"
        else
            out[game.ID] = "$$$";
    }

    return out
}

