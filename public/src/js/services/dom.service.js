import SVG from '../helpers/svg.enum.js';
import timeoutAsync from '../helpers/timeout.promise.js';


export default class DomService {

	constructor ( resetBooksFn, resetEditingBookFn ) {
		this._resetBooksHtml = resetBooksFn;
		this._resetEditingBook = resetEditingBookFn;
	}
	
	get booksContainer () {
		return document.getElementById`books`;
	}
	
	get rewardsContainer () {
		return document.getElementById`rewards`;
	}
	
	get searchInput () {
		return document.getElementById`search-input`;
	}
	
	get menu () {
		return this.select`.menu`;
	}

	get btnToggleMenu () {
		return document.getElementById`btn-toggle-menu`;
	}
	
	get btnOpenModal () {
		return document.getElementById`btn-open-modal`;
	}
	
	get btnCloseModal () {
		return document.getElementById`btn-close-modal`;
	}
	
	get btnsOpenSearch () {
		return this.select( '.btn-open-search', true );
	}
	
	get btnsCloseSearch () {
		return this.select( '.btn-close-search', true );
	}

	get btnModalSearch () {
		return this.select`.modal-insert [aria-label="Buscar"]`;
	}
	
	get modal () {
		return this.select`.modal-insert`;
	}
	
	get body () {
		return this.select`body`;
	}
	
	get experienceContainer () {
		const container = document.getElementById`container-level`;
		return {
			title: container.querySelector`h1`,
			subtitle: container.querySelector`h2`,
			bar: container.querySelector`#bar-level`,
		};
	}

	get form () {
		return {
			title: this.select`#book-title`,
			totalPages: this.select`#book-totalPages`,
			currentPage: this.select`#book-currentPage`,
			tag: this.select`#book-tag`,
			tags: this.select`.modal-insert .added-tags`,
			btnSubmit: this.select`#btn-modal-submit`,
		};
	}
	
	select ( el, every ) {
		return !every ? document.querySelector( el ) : document.querySelectorAll( el );
	}

	getBookNode ( { title } ) {
		return this.select( `[data-title="${ title }"]` );
	}
	
	openModal ( book ) {
		if ( book ) this.fillInputs( book );

		this.btnsCloseSearch.length > 0 && this.closeSearch();
		
		this.modal.classList.add`open`;
		
		const menu = this.menu;
		if ( !menu ) return;
		
		this.body.removeChild( menu );
		this.btnToggleMenu.classList.remove`open`;
	}

	fillInputs ( { title, currentPage, totalPages, tags } ) {
		const form = this.form;

		form.title.value = title;
		form.currentPage.value = currentPage;
		form.totalPages.value = totalPages;
		form.tags.append( ...tags.map( tag => `<span>${ tag }</span>`.toHtml() ) );
	}

	async closeModalAsync () {
		const modal = this.modal;
		modal.classList.add`close`;
		await timeoutAsync( 500 );
		modal.classList.remove( 'open', 'close' );
		this.clearInputs();
		this._resetEditingBook();
	}

	clearInputs () {
		const form = this.form;
		form.title.value = '';
		form.currentPage.value = '';
		form.totalPages.value = '';
		form.tag.value = '';
		form.tags.innerHTML = '';
	}

	openSearch () {
		!this.booksContainer.offsetParent && this.navigateToBooksAsync();
		this.btnOpenModal.style.transform = 'scale(0)';

		const searchInput = this.searchInput;
		searchInput.style.transform = 'translateY(0) scale(1)';

		searchInput.focus();

		this.btnsOpenSearch.forEach( btn => {
			const btnClone = btn.cloneNode( true );
			btnClone.addEventListener( 'click', () => this.closeSearch() );
			btnClone.classList.replace( 'btn-open-search', 'btn-close-search' );
			btnClone.innerHTML = btnClone.childElementCount === 0
				? 'Fechar pesquisa'
				: SVG.x;
			btn.replaceWith( btnClone );
		} );
	}

	closeSearch () {
		const searchInput = this.searchInput;
		searchInput.style.transform = 'translateY(60px) scale(0)';

		this.btnOpenModal.style.transform = 'scale(1)';

		searchInput.value = '';

		this.btnsCloseSearch.forEach( btn => {
			const btnClone = btn.cloneNode( true );
			btnClone.addEventListener( 'click', () => this.openSearch() );
			btnClone.classList.replace( 'btn-close-search', 'btn-open-search' );
			btnClone.innerHTML = btnClone.childElementCount === 0
				? 'Pesquisa'
				: SVG.search;
			btn.replaceWith( btnClone );
		} );

		this._resetBooksHtml();
	}

	toggleMenu () {

		const body = this.body;
		const menu = this.menu;
		const btn = this.btnToggleMenu;

		if ( menu ) return body.removeChild( menu ) && btn.classList.remove`open`;

		const linkNavigation = '<a role="button"></a>'.toHtml();

		if ( this.booksContainer.offsetParent ) {
			linkNavigation.innerHTML = 'Recompensas';
			linkNavigation.addEventListener( 'click', () => this.navigateToRewardsAsync() );
		} else {
			linkNavigation.innerHTML = 'Livros';
			linkNavigation.addEventListener( 'click', () => this.navigateToBooksAsync() );
		}

		const linkSearch = '<a role="button"></a>'.toHtml();

		if ( this.btnsOpenSearch.length > 0 ) {
			linkSearch.innerHTML = 'Pesquisa';
			linkSearch.classList.add`btn-open-search`;
			linkSearch.addEventListener( 'click', () => this.openSearch() );
		} else {
			linkSearch.innerHTML = 'Fechar pesquisa';
			linkSearch.classList.add`btn-close-search`;
			linkSearch.addEventListener( 'click', () => this.closeSearch() );
		}

		const linkOpenModal = '<a role="button">Cadastro de livro</a>'.toHtml();
		linkOpenModal.addEventListener( 'click', () => this.openModal() );

		const divMenu = '<div class="menu"></div>'.toHtml();

		[ linkNavigation, linkSearch, linkOpenModal ].forEach( link => divMenu.appendChild( link ) );
		body.appendChild( divMenu );
		btn.classList.add`open`;
	}

	async navigateToBooksAsync () {
		const booksPage = this.booksContainer;
		const rewardsPage = this.rewardsContainer;
		const { subtitle } = this.experienceContainer;

		booksPage.style.display = 'grid';

		rewardsPage.style.transform = 'translateX(100%)';
		subtitle.style.transform = 'translateX(100vw)';

		await timeoutAsync();

		booksPage.style.transform = 'translateX(0%)';

		this.updateMenuLink( () => this.navigateToRewardsAsync(), 'Recompensas' );

		await timeoutAsync( 200 );

		rewardsPage.style.display = 'none';
		subtitle.style.display = 'none';
	}

	async navigateToRewardsAsync () {
		this.btnsCloseSearch.length > 0 && this.closeSearch();

		const booksPage = this.booksContainer;
		const rewardsPage = this.rewardsContainer;
		const { subtitle } = this.experienceContainer;

		rewardsPage.style.display = 'grid';
		subtitle.style.display = 'initial';

		booksPage.style.transform = 'translateX(-100%)';

		await timeoutAsync();

		rewardsPage.style.transform = 'translateX(0%)';
		subtitle.style.transform = 'translateX(0vw)';

		this.updateMenuLink( () => this.navigateToBooksAsync(), 'Livros' );

		await timeoutAsync( 200 );

		booksPage.style.display = 'none';
	}

	updateMenuLink ( fn, txt ) {
		const menu = this.menu;
		if ( !menu ) return;

		menu.removeChild( menu.firstElementChild );

		const link = `<a role="button">${ txt }</a>`.toHtml();
		link.addEventListener( 'click', fn );
		menu.prepend( link );
	}

	updateExperience ( experience ) {
		const { title, subtitle, bar } = this.experienceContainer;

		title.innerHTML = `nível ${ experience.level }`;
		subtitle.innerHTML = `${ experience.total - experience.current } páginas para o próximo nível`;
		bar.style.width = `${ experience.current / experience.total * 100 }%`;
	}

	createRewardNode ( { title, level, text } ) {
		return `
			<div class="reward-card" data-title="${ title }-${ level }">
				<p>${ title } ${ level.toRoman() } - ${ text }</p>
				${ SVG.info }
			</div>
		`.toHtml();
	}

	createBookNode ( book, onPageReadFn, onEditBookFn ) {
		const nodeElement = `
			<article data-title="${ book.title }">
				<h1>${ book.title }</h1>
				<button aria-label="Editar">${ SVG.pencil }</button>
				<section>
					<header class="container-tags">${ book.tags?.map( tag => `<span>${ tag }</span>` ).join( '' ) }</header>
					<div class="pages">
						<div class="current-page">
							${ book.currentPage }
							<button class="icon" aria-label="Próxima página">${ SVG[ '+' ] }</button>
						</div>
						<div class="divider">/</div>
						<div class="total-pages">${ book.totalPages }</div>
					</div>
				</section>
			</article>
		`.toHtml();

		nodeElement.querySelector`[aria-label="Editar"]`.addEventListener( 'click', () => onEditBookFn() && this.openModal( book ) );
		nodeElement.querySelector`[aria-label="Próxima página"]`.addEventListener( 'click', onPageReadFn );

		return nodeElement;
	}


	initEvents ( searchFn, upsertFn ) {
		const { tag, btnSubmit } = this.form;

		this.btnOpenModal.addEventListener( 'click', () => this.openModal() );
		this.btnCloseModal.addEventListener( 'click', () => this.closeModalAsync() );
		this.btnsOpenSearch.forEach( btn => btn.addEventListener( 'click', () => this.openSearch() ) );
		this.btnToggleMenu.addEventListener( 'click', () => this.toggleMenu() );
		this.searchInput.addEventListener( 'keyup', searchFn );
		this.btnModalSearch.addEventListener( 'click', () => this.closeModalAsync().then( () => this.openSearch() ) );
		btnSubmit.addEventListener( 'click', upsertFn );
		tag.addEventListener( 'keypress', e => this.addTag( e ) );
	}

	addTag ( event ) {
		if ( event.key !== 'Enter' ) return;

		const form = this.form;

		const tagInput = form.tag;
		const tag = tagInput.value;

		if ( !tag || tag.isEmpty() || this.alreadyAddedTag( tag ) ) return;

		tagInput.value = '';

		form.tags.append( `<span>${ tag }</span>`.toHtml() );
	}

	alreadyAddedTag (tag) {
		for ( const span of this.form.tags.childNodes) {
			if ( tag.toLowerCase() === span.innerText.toLowerCase() ) return true;
		}
		return false;
	}
}

