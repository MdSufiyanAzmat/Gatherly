const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination || pagination.pages <= 1) return null;

    return (
        <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
            <button type="button" onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPreviousPage} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
            <button type="button" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNextPage} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </nav>
    );
};

export default Pagination;
