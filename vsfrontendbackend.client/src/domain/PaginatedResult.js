/**
 * Object representing a paginated result from the API
 * @typedef {Object} PaginatedResult
 * @property {Array} games - The array of game objects
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.totalCount - Total number of items
 * @property {number} pagination.pageNumber - Current page number
 * @property {number} pagination.pageSize - Items per page
 * @property {number} pagination.totalPages - Total number of pages
 * @property {boolean} pagination.hasNext - Whether there is a next page
 * @property {boolean} pagination.hasPrevious - Whether there is a previous page
 */

/**
 * Create a default empty paginated result
 * @param {number} pageSize - The page size
 * @returns {PaginatedResult} Empty paginated result
 */
export function createEmptyPaginatedResult(pageSize = 10) {
    return {
        games: [],
        pagination: {
            totalCount: 0,
            pageNumber: 1,
            pageSize: pageSize,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false
        }
    };
}
