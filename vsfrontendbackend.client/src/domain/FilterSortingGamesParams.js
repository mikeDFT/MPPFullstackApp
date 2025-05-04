/**
 * Object representing parameters for filtering and sorting games
 * @typedef {Object} FilterSortingGamesParams
 * @property {string} [sortBy] - Field to sort by (Name, Price, Rating)
 * @property {boolean} [ascending] - Sort direction
 * @property {string} [searchText] - Text to search in game names
 * @property {string} [companySearchText] - Text to search in company names
 * @property {string[]} [genres] - Genres to filter by
 * @property {string[]} [platforms] - Platforms to filter by
 * @property {number} [pageNumber=1] - Page number for pagination
 * @property {number} [pageSize=10] - Page size for pagination
 */

/**
 * Create default filter parameters
 * @returns {FilterSortingGamesParams} Default filter parameters
 */
export function createDefaultFilterParams() {
    return {
        sortBy: "Name",
        ascending: true,
        searchText: "",
        companySearchText: "",
        genres: [],
        platforms: [],
        pageNumber: 1,
        pageSize: 10
    };
}
