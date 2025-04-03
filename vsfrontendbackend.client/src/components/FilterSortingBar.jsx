import { ListGroup, Badge } from "react-bootstrap"
import { useState } from "react";
import { useGameData } from "@/context/GameDataContext";

export function FilterSortingBar() { // send states (filters and sorting dicts) as params to be used from parent
    const { DEFAULT_PLATFORMS, DEFAULT_GENRES } = useGameData();
    const { setSorting, genreFilters, platformFilters, setGenreFilters, setPlatformFilters } = useGameData();

    var filters = {
        Platforms: {
            selectedFiltersState: [ platformFilters, setPlatformFilters ],
            list: DEFAULT_PLATFORMS
        },
        Genres: {
            selectedFiltersState: [ genreFilters, setGenreFilters ],
            list: DEFAULT_GENRES
        },
    }

    var sorting = {
        whichItemState: useState(""),
        ascendingState: useState(true), // true = ascending, false = descending
        list: ["Price", "Rating", "Name"]
    }

    function updateFilterType(filterType, newItem) {
        var [selectedFilters, setSelectedFilters] = filters[filterType].selectedFiltersState;

        if (selectedFilters.includes(newItem)) {
            setSelectedFilters( // remove the new item if already present
                selectedFilters.filter(item => item !== newItem)
            );
            // setFilters(selectedFilters.filter(item => item !== newItem))
        }
        else {
            setSelectedFilters([ // add the new item is not already present
                ...selectedFilters,
                newItem
            ])
            // setFilters([ // add the new item is not already present
            //     ...selectedFilters,
            //     newItem
            // ])
        }

        // console.log(newItem, filterType, filters[filterType]["selectedFiltersState"][0]);
    }

    function updateSortType(newItem) {
        // if this item has already been selected, make the ordering descending,
        // if it's already descending, then deselect it
        if (sorting["whichItemState"][0] === newItem)
            if (sorting["ascendingState"][0] === true) {
                sorting["ascendingState"][1](false)
                setSorting({
                    by: newItem,
                    ascending: false
                })
            }
            else {
                sorting["whichItemState"][1]("");
                setSorting({
                    by: "",
                    ascending: true
                })
            }
        else {
            sorting["ascendingState"][1](true);
            sorting["whichItemState"][1](newItem);

            setSorting({
                by: newItem,
                ascending: true
            })
        }

        // console.log(newItem, sorting["whichItemState"][0], sorting["ascendingState"][0]);
    }

    var paddingData = "0.3em 1em 1em"

    return (
        <div style={{ backgroundColor: "#1F0D44", padding: "2em", borderRadius: "1em" }}>
            <h2 className="text-lg font-bold text-center">Filtering:</h2>
            <br/>
            {/* Filtering */}
            <div>
                {Object.entries(filters).map(([filterType, infoDict], index) => (
                    <div key={index}>
                        <h3 className="font-bold">{filterType}:</h3>
                        <ListGroup style={{padding: paddingData}}>
                            {infoDict["list"].map((item) => (
                                <ListGroup.Item action key={item} variant="dark" className={"filterSortButton"} active={infoDict["selectedFiltersState"][0].includes(item)} onClick={() => updateFilterType(filterType, item)}>
                                    {item}
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </div>
                ))}
            </div>

            {/* Sorting */}
            <div className="mt-4">
                <h3 className="font-bold">Sorting:</h3>
                <ListGroup style={{padding: paddingData}}>
                    {sorting.list.map((sortingType) => (
                        <ListGroup.Item action key={sortingType} variant="dark" className={"filterSortButton"} active={sorting.whichItemState[0] === sortingType} onClick={() => updateSortType(sortingType)}>
                            {sortingType}
                            {sorting.whichItemState[0] === sortingType ?
                                <Badge style={{float: "right"}} bg="secondary" pill>
                                    {sorting.ascendingState[0] ? "Ascending" : "Descending"}
                                </Badge>
                            : null}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        </div>
    );
}