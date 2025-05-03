import { ListGroup, Badge } from "react-bootstrap"
import { useState } from "react";
import { useData } from "@/context/DataContext";
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';

export function FilterSortingBar() { // send states (filters and sorting dicts) as params to be used from parent
    const { DEFAULT_PLATFORMS, DEFAULT_GENRES } = useData();
    const { setSorting, genreFilters, platformFilters, setGenreFilters, setPlatformFilters } = useData().games;
    const {
        searchText: companySearchText,
        setSearchText: setCompanySearchText
	} = useData().companies;

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
        }
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

            {/* Company Name Search / Search Text */}
            <div className="mt-4">
                <h3 className="font-bold">Company Name:</h3>
                <div style={{
                    backgroundColor: "#1F0D44",
                    border: 0,
                    borderRadius: "1em",
                    color: "white",
                    padding: ".2rem",
                    marginTop: "0.5rem"
                }}>
                    <FloatingLabel
                        controlId="companyNameInput"
                        label="Filter by Company"
                        style={{
                            margin: 0, 
                            padding: 0,
                            color: "rgba(255, 255, 255, 0.4)",
                            fontWeight: "bold",
                        }}
                        value={companySearchText || null}
                        onChange={(event) => {setCompanySearchText(event.target.value);
							console.log(companySearchText); console.log(event.target.value)}}>
                        <Form.Control 
                            type="text" 
                            placeholder="Company Name"
                            style={{
                                backgroundColor: "#1F0D44",
                                border: 0,
                                color: "white",
                            }}/>
                    </FloatingLabel>
                </div>
            </div>
        </div>
    );
}