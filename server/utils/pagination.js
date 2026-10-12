const getPagination = (query, { defaultLimit = 12, maxLimit = 100 } = {}) => {
    const requestedPage = Number.parseInt(query.page, 10);
    const requestedLimit = Number.parseInt(query.limit, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, maxLimit)
        : defaultLimit;

    return { page, limit, skip: (page - 1) * limit };
};

const paginationMetadata = ({ page, limit }, total) => ({
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasPreviousPage: page > 1,
    hasNextPage: page * limit < total,
});

module.exports = { getPagination, paginationMetadata };
