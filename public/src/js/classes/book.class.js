export default class Book {
    constructor(book) {
        this.title = book?.title ?? '';
        this.tags = book?.tags ?? [];

        const totalPages = parseInt( book?.totalPages );
        this.totalPages = isNaN( totalPages ) || totalPages < 1 ? 1 : totalPages;

        const currentPage = parseInt( book?.currentPage );
        this.currentPage =
            isNaN( currentPage ) || currentPage < 1
                ? 1
                : currentPage > totalPages
                    ? totalPages
                    : currentPage;
        
        this.dateUpdated = new Date();
    }
}
