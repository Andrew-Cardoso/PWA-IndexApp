import Book from '../classes/book.class.js';
import Experience from '../classes/experience.class.js';
import Info from '../classes/info.class.js';
import DomService from './dom.service.js';

export default class AppService {
  nextRewards = Object.freeze({
    pageRead: { value: 100, level: 1 },
    bookAdded: { value: 10, level: 1 },
    bookRead: { value: 1, level: 1 },
  });

  editingBook;
  books = [];
  experience;
  info;

  searchCountdown = null;

  constructor(db) {
    this.db = db;
    this.dom = new DomService(
      () => {
        const booksContainer = this.dom.booksContainer;
        booksContainer.innerHTML = '';
        booksContainer.append(...this.books.map((book) => this.#createBookNodeShortcut(book)));
      },
      () => (this.editingBook = null),
      (book) => this.deleteBook(book)
    );
  }

  async deleteBook({ title }) {
    await this.db.books.delete(title);
  }

  async initAppAsync() {
    const [books, [info], [experience]] = await Promise.all([
      this.db.books.orderBy('dateUpdated').reverse().toArray(),
      this.db.info.toArray(),
      this.db.experience.toArray(),
    ]);

    this.books.push(...books);
    this.info = info;
    this.experience = experience;

    const promises = [];

    if (!info) {
      this.info = new Info();
      promises.push(this.db.info.add(this.info));
    }

    if (!experience) {
      this.experience = new Experience();
      promises.push(this.db.experience.add(this.experience));
    }

    if (promises.length > 0) Promise.all(promises);

    this.info.rewards.forEach(({ level, value, title }) => {
      const key = title === 'leitor' ? 'pageRead' : title === 'colecionador' ? 'bookAdded' : 'bookRead';
      level >= this.nextRewards[key].level && this.updateNextReward(key, value, level);
    });

    this.dom.updateExperience(this.experience);
    this.dom.booksContainer.append(...this.books.map((book) => this.#createBookNodeShortcut(book)));
    this.dom.rewardsContainer.append(...this.info.rewards.map((reward) => this.dom.createRewardNode(reward)));

    this.dom.initEvents(
      (e) => this.searchBooks(e),
      () => this.upsertBookAsync()
    );
  }

  searchBooks({ target: { value } }) {
    clearTimeout(this.searchCountdown);
    this.searchCountdown = setTimeout(() => {
      const books = this.books.filter(({ title, tags }) => title.contains(value) || tags.some((x) => x.contains(value)));
      const booksContainer = this.dom.booksContainer;
      booksContainer.innerHTML = '';
      booksContainer.append(...books.map((book) => this.#createBookNodeShortcut(book)));
    }, 500);
  }

  async nextPageAsync(book) {
    if (book.currentPage === book.totalPages) return;

    book.currentPage++;

    const bookNode = this.dom.getBookNode(book);
    bookNode.replaceWith(this.#createBookNodeShortcut(book));
    book.dateUpdated = new Date();

    this.info.pagesRead++;
    this.experience.current++;
    if (book.currentPage === book.totalPages) {
      this.info.booksRead++;
      this.experience.current += book.totalPages;
    }

    this.increaseXp();
    this.dom.updateExperience(this.experience);

    const rewards = this.#sortRewardsByLevel(this.getNewRewards()).reverse();
    this.info.rewards.push(...rewards);
    this.dom.rewardsContainer.append(...rewards.map((reward) => this.dom.createRewardNode(reward)));

    await Promise.allSettled([this.db.books.put(book), this.db.experience.put(this.experience), this.db.info.put(this.info)]);
  }

  async upsertBookAsync() {
    const form = this.dom.form;

    const book = new Book({
      title: form.title.value,
      currentPage: form.currentPage.value,
      totalPages: form.totalPages.value,
      tags: this.#extractTagsFromHtml(form.tags),
    });

    if (book.title.isEmpty() || this.#alreadyAddedBook(book)) return;

    const promises = [this.db.books.put(book)];

    if (this.editingBook && this.editingBook.title !== book.title) promises.push(this.db.books.delete(this.editingBook.title));

    const cachedBook = this.books.find(({ title }) => title === (this.editingBook?.title ?? book.title));

    const newRewards = this.handleXpGapAndGetNewRewards(book, cachedBook);

    this.info.rewards.push(...newRewards);
    promises.push(this.db.info.put(this.info), this.db.experience.put(this.experience));

    const bookNode = this.#createBookNodeShortcut(book);

    !cachedBook
      ? this.books.push(book) && this.dom.booksContainer.prepend(bookNode)
      : this.books.splice(this.books.indexOf(cachedBook), 1, book) && this.dom.getBookNode(cachedBook).replaceWith(bookNode);

    this.dom.updateExperience(this.experience);
    this.dom.rewardsContainer.prepend(...newRewards.map((reward) => this.dom.createRewardNode(reward)));

    this.editingBook = null;

    promises.push(this.dom.closeModalAsync());
    await Promise.allSettled(promises);
  }

  increaseXp() {
    if (this.experience.current < this.experience.total) return;

    this.experience.current -= this.experience.total;
    this.experience.total += 8;
    this.experience.level++;

    return this.increaseXp();
  }

  decreaseXp() {
    if (this.experience.current >= 0) return;

    this.experience.total -= 8;
    this.experience.level--;
    this.experience.current += this.experience.total;

    return this.decreaseXp();
  }

  updatedRewards(reverse = false) {
    return reverse ? this.removeRewards() : this.getNewRewards();
  }

  getNewRewards() {
    const rewards = [];

    if (this.info.pagesRead >= this.nextRewards.pageRead.value) {
      rewards.push({
        title: 'leitor',
        text: `${this.nextRewards.pageRead.value.toLocaleString()} páginas lidas`,
        value: this.nextRewards.pageRead.value,
        level: this.nextRewards.pageRead.level,
      });
      this.updateNextReward('pageRead');
    }
    if (this.info.booksRead >= this.nextRewards.bookRead.value) {
      rewards.push({
        title: 'finalizado',
        text: `finalizou ${this.nextRewards.bookRead.value.toLocaleString()} livro${this.nextRewards.bookRead.value > 1 ? 's' : ''}`,
        value: this.nextRewards.bookRead.value,
        level: this.nextRewards.bookRead.level,
      });
      this.updateNextReward('bookRead');
    }
    if (this.info.booksAdded >= this.nextRewards.bookAdded.value) {
      rewards.push({
        title: 'colecionador',
        text: `${this.nextRewards.bookAdded.value.toLocaleString()} livros adicionados`,
        value: this.nextRewards.bookAdded.value,
        level: this.nextRewards.bookAdded.level,
      });
      this.updateNextReward('bookAdded');
    }

    if (rewards.length === 0) return rewards;

    rewards.push(...this.getNewRewards());
    return rewards;
  }

  removeRewards() {
    const titlesIndexes = [];

    if (this.info.pagesRead < this.nextRewards.pageRead.value / 10) {
      const reward = this.info.rewards.find(({ title, level }) => title === 'leitor' && level === this.nextRewards.pageRead.level - 1);
      titlesIndexes.push([`${reward.title}-${reward.level}`, this.info.rewards.indexOf(reward)]);
      this.reverseNextReward('pageRead');
    }
    if (this.info.booksRead < Math.floor(this.nextRewards.bookRead.value / 10)) {
      const reward = this.info.rewards.find(({ title, level }) => title === 'finalizado' && level === this.nextRewards.bookRead.level - 1);
      titlesIndexes.push([`${reward.title}-${reward.level}`, this.info.rewards.indexOf(reward)]);
      this.reverseNextReward('bookRead');
    }
    if (this.info.booksAdded < this.nextRewards.bookAdded.value / 10) {
      const reward = this.info.rewards.find(({ title, level }) => title === 'colecionador' && level === this.nextRewards.bookAdded.level - 1);
      titlesIndexes.push([`${reward.title}-${reward.level}`, this.info.rewards.indexOf(reward)]);
      this.reverseNextReward('bookAdded');
    }

    if (titlesIndexes.length === 0) return;

    for (const [title, index] of titlesIndexes) {
      this.info.rewards.splice(index, 1);
      this.dom.rewardsContainer.querySelector(`[data-title="${title}"]`).remove();
    }

    this.removeRewards();
  }

  updateNextReward(key, value, level) {
    const reward = this.nextRewards[key];
    reward.value = value ? value * 10 : reward.value * 10;
    reward.level = level ? level + 1 : reward.level + 1;
  }

  reverseNextReward(key) {
    this.nextRewards[key].value /= 10;
    this.nextRewards[key].level--;
  }

  handleXpGapAndGetNewRewards({ currentPage, totalPages }, cachedBook) {
    if (!cachedBook) {
      this.info.booksAdded++;
      this.experience.current += currentPage;

      if (currentPage === totalPages) {
        this.experience.current += totalPages;
        this.info.booksRead++;
      }

      this.info.pagesRead += currentPage;
      this.increaseXp();
      return this.getNewRewards();
    }

    const { currentPage: currPageB4, totalPages: ttlPgsB4 } = cachedBook;

    const diff = currentPage - currPageB4;
    if (currentPage < totalPages && currPageB4 < ttlPgsB4) return this.updateXp(diff);
    if (currentPage === totalPages && currPageB4 === ttlPgsB4) return this.updateXp(diff * 2, diff);
    if (currentPage < totalPages) {
      this.info.booksRead--;
      return this.updateXp(diff - ttlPgsB4, diff);
    }
    this.info.booksRead++;
    return this.updateXp(diff + totalPages, diff);
  }

  updateXp(xp, pagesRead) {
    const pagesReadDiff = pagesRead ?? xp;

    this.experience.current += xp;
    this.info.pagesRead += pagesReadDiff;

    xp > 0 ? this.increaseXp() : this.decreaseXp();

    this.removeRewards();
    return this.getNewRewards();
  }

  #alreadyAddedBook(book) {
    const alreadyAddedBook = this.books.some(({ title }) => book.title === title);
    return this.editingBook?.title ? alreadyAddedBook && this.editingBook.title !== book.title : alreadyAddedBook;
  }

  #extractTagsFromHtml({ childNodes }) {
    const tags = [];
    for (const tagSpan of childNodes) tags.push(tagSpan.innerText);
    return tags;
  }

  #sortRewardsByLevel(rewards) {
    return rewards.sort((a, b) => b.level - a.level || b.title === 'leitor' || b.title === 'finalizado');
  }

  #createBookNodeShortcut(book) {
    return this.dom.createBookNode(
      book,
      () => this.nextPageAsync(book),
      () => (this.editingBook = book)
    );
  }
}
