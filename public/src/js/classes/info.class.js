const ID = 'info';
export default class Info {    
    constructor ( info ) {
        this.id = ID;
        this.booksAdded = info?.booksAdded ?? 0;
        this.booksRead = info?.booksRead ?? 0;
        this.pagesRead = info?.pagesRead ?? 0;
        this.rewards = info?.rewards ?? [];
    }
}
