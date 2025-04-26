
export function StatisticsForPrice(gamesInfo) {
    var sortedGames = [...gamesInfo]
    sortedGames.sort((a, b) => {return a.Price - b.Price;})

    console.log("SortedStats", sortedGames)

    var nrGames = sortedGames.length / 3
    var out = {}
    for (var i = 0; i < sortedGames.length; i++) {
        const game = sortedGames[i];

        if (i < nrGames)
            out[game.Id] = "$"
        else if (i < nrGames*2)
            out[game.Id] = "$$"
        else
            out[game.Id] = "$$$";
    }

    console.log("StatisticsForPrice", out)

    return out
}

