const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination || pagination.pages <= 1) return null;

    const pages = Array.from({ length: pagination.pages }, (_, index) => index + 1);

    return (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
            <button type="button" onClick={() => onPageChange(pagination.page - 1)} disabled={!pagination.hasPreviousPage} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            {pages.map((page) => <button key={page} type="button" onClick={() => onPageChange(page)} aria-current={page === pagination.page ? 'page' : undefined} className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-bold transition ${page === pagination.page ? 'border-primary bg-primary text-white' : 'hover:border-primary hover:text-primary'}`}>{page}</button>)}
            <button type="button" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasNextPage} className="rounded-lg border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </nav>
    );
};

export default Pagination;
