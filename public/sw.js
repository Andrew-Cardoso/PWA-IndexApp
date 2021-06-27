const CACHE_NAME = 'indexappcache';
this.addEventListener( "install", event => {
	this.skipWaiting();

	event.waitUntil(
		caches.open( CACHE_NAME )
			.then( cache => {
				return cache.addAll( [
					'/',
					'/index.html',
					'/favicon.ico',
					'https://fonts.googleapis.com/css2?family=Inter&display=swap',
					'https://fonts.googleapis.com/css2?family=Lexend+Deca&display=swap',
					'/src/css/app.css',
					'/src/images/bookmark_black_24x24.png',
					'/src/images/bookmark_black_48x48.png',
					'/src/images/bookmark_black_96x96.png',
					'/src/images/bookmark_black_192x192.png',
					'/src/js/libraries/dexie.mjs',
					'/src/js/libraries/dexie.mjs.map',
					'/src/js/data/dexie-db.js',
					'/src/js/classes/book.class.js',
					'/src/js/classes/experience.class.js',
					'/src/js/classes/info.class.js',
					'/src/js/helpers/svg.enum.js',
					'/src/js/helpers/timeout.promise.js',
					'/src/js/services/dom.service.js',
					'/src/js/services/app.service.js',
					'/src/js/main.js',
				] );
			} )
	);
} );

this.addEventListener( 'activate', event => {
	event.waitUntil(
		caches.keys().then( cacheNames => {
			return Promise.all(
				cacheNames
					.filter( cacheName => cacheName != CACHE_NAME )
					.map( cacheName => caches.delete( cacheName ) )
			);
		} )
	);
} );


this.addEventListener( "fetch", event => {
	event.respondWith(
		caches.match( event.request )
			.then( response => {
				return response || fetch( event.request );
			} )
	);
} );