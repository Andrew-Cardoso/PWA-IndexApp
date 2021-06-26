import Dexie from '../libraries/dexie.mjs';

const Database = new Dexie( 'IndexApp_DB' );
Database.version( 1 ).stores( {
	books: 'title,tags,totalPages,currentPage,dateUpdated',
	experience: 'id,level,current,total',
	info: 'id,booksAdded,booksRead,pagesRead,rewards'
} );

export default Database;