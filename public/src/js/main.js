Number.prototype.toRoman = function () {
	const dict = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };

	let result = '';
	let number = this;

	for ( const romanNumeral in dict ) {
		while ( number >= dict[ romanNumeral ] ) {
			result += romanNumeral;
			number -= dict[ romanNumeral ];
		}
	}

	return result;
};

String.prototype.toHtml = function () {
	const container = document.createElement`div`;
	const fragment = document.createDocumentFragment();
	container.innerHTML = this;
	fragment.appendChild( container.firstElementChild );
	container.remove();
	return fragment.firstElementChild;
};

String.prototype.isEmpty = function () {
	const str = this;
	return /^\s*$/.test( str );
};

String.prototype.removeSpaces = function () {
	const str = this;
	return str.replace( /\s+/g, '' );
};

String.prototype.contains = function ( searchString ) {
	if ( !searchString ) return true;
	const text = this;
	return text.removeSpaces().includes( searchString.removeSpaces() );
};

import AppService from './services/app.service.js';
import Database from './data/dexie-db.js';

const appService = new AppService( Database );

appService.initAppAsync();

if ( 'serviceWorker' in navigator ) {
	navigator.serviceWorker
		.register( '/sw.js' )
		.then( function () {
			console.log( 'Service worker registered!' );
		} )
		.catch( function ( err ) {
			console.log( err );
		} );
}