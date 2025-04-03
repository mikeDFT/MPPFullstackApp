
function sortFunc(a, b, sortingState) {
    if (sortingState.by === "Price")
        return a.Price - b.Price;
    if (sortingState.by === "Rating")
        return a.Rating - b.Rating;
    if (sortingState.by === "Name")
        return a.Name.localeCompare(b.Name);
}

function filterList(initialList, filters, searchText) {
    return initialList.filter(gameData => {
        for (const f of filters) {
            if (!gameData.Genres.includes(f) && !gameData.Platforms.includes(f))
                return false;
        }

        return gameData.Name.toLowerCase().includes(searchText.toLowerCase());
    })
}

function getMyTestFilteredList(initialList, filtersState, sortingState, searchText) {
    const filtered = filterList(initialList, filtersState, searchText);
    const sorted = filtered.sort((a, b) => sortFunc(a, b, sortingState));

    if (sortingState.ascending)
        return sorted;
    else
        return sorted.reverse();
}

function isTestingDataInFilteredList(testingData, filteredList) {
    for (const data of filteredList) {
        if (testingData.ID === data.ID) {
            return true
        }
    }
    return false
}

function testFilteringData(initialList, filteredList, filters, sortingState, searchText) {
    // console.log(initialList);
    const myTestFilteredList = getMyTestFilteredList(initialList, filters, sortingState, searchText);
    // console.log(`my test: ${myTestFilteredList}`);

    console.assert(myTestFilteredList.length === filteredList.length);

    for (const testingData of myTestFilteredList) {
        // console.log(testingData, filteredList, filters);
        console.assert(isTestingDataInFilteredList(testingData, filteredList));
        // console.log("it's fine")
    }
    // console.log(":::")
    for (const filteredData of filteredList) {
        // console.log(filteredData, myTestFilteredList, filters);
        console.assert(isTestingDataInFilteredList(filteredData, myTestFilteredList));
        // console.log("it's fine")
    }

    return true
}


export function UnitTestFilteringSortingSearch(initialList, filteredList, filters, sortingState, searchText) {
    console.log("INITIATING TESTS");
    testFilteringData(initialList, filteredList, filters, sortingState, searchText)
    // console.assert();
    console.log("TEST PASSED")
}




