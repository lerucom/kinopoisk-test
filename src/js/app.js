import {ReadItem, ReadItemList, SearchItemList} from "./lib.js";
import {Sync} from "./sync.js";

const readTabEl = document.querySelector('#readTab'); // вкладка Прочитать
const archiveTabEl = document.querySelector('#archiveTab'); // вкладка Прочитано
const searchTabEl = document.querySelector('#searchTab'); // вкладка Поиск
const listItemsEl = document.querySelector('#list-items'); // весь список

const linkNameEl = document.querySelector('#link-name'); // поле ввода названия
const linkTagsEl = document.querySelector('#link-tags'); // поле ввода тегов
const linkUrlEl = document.querySelector('#link-url'); // поле ввода ссылки
const linkAddBtnEl = document.querySelector('#link-add-btn'); // кнопка Добавить
const formEl = document.querySelector('#link-add-form'); // форма добавления новой ссылки
const searchFormEl = document.querySelector('#search-form'); // форма поиска
const searchInputEl = document.querySelector('#search-name'); // поле поиска
const searchBtnEl = document.querySelector('#search-btn'); // кнопка Найти
const delAllBtnEl = document.querySelector('#delAll-btn'); // кнопка удалить все записи

const readItemList = new ReadItemList();
const searchItemList = new SearchItemList();

displayStartTab();
const sync = new Sync();
sync.clearStorage();
sync.pushStorage(); // синхронизация имеющихся данных с сервером при первой загрузке


readTabEl.addEventListener('click', (evt) => {
    evt.preventDefault(); // отмена перезагрузки страницы
    displayStartTab();
});

archiveTabEl.addEventListener('click', (evt) => {
    evt.preventDefault(); // отмена перезагрузки страницы
    readTabEl.parentElement.classList.remove('active');
    searchTabEl.parentElement.classList.remove('active');
    archiveTabEl.parentElement.classList.add('active');
    formEl.classList.replace('d-flex', 'd-none');
    searchFormEl.classList.replace('d-flex', 'd-none');
    rebuildTreeArchiveTab(listItemsEl, readItemList);
});

searchTabEl.addEventListener('click', (evt) => {
    evt.preventDefault(); // отмена перезагрузки страницы
    readTabEl.parentElement.classList.remove('active');
    archiveTabEl.parentElement.classList.remove('active');
    searchTabEl.parentElement.classList.add('active');
    formEl.classList.replace('d-flex', 'd-none');
    searchFormEl.classList.replace('d-none', 'd-flex');
    searchInputEl.focus(); // автофокус поля ввода Поиска
    rebuildTreeSearchTab(listItemsEl, searchItemList);
});

function displayStartTab() {
    archiveTabEl.parentElement.classList.remove('active');
    searchTabEl.parentElement.classList.remove('active');
    readTabEl.parentElement.classList.add('active');
    formEl.classList.replace('d-none', 'd-flex');
    searchFormEl.classList.replace('d-flex', 'd-none');
    linkNameEl.focus(); // автофокус поля ввода Названия
    rebuildTreeReadTab(listItemsEl, readItemList);
}

linkAddBtnEl.addEventListener('click', (evt) => {
    evt.preventDefault(); // отмена перезагрузки страницы
    validate(formEl);
    const filterReadItemList = readItemList.items.filter((obj) => {
        return obj.url === linkUrlEl.value.trim();
    });

    if ((linkNameEl.value.trim() !== '') && (linkUrlEl.value.trim() !== '')) {
        if ((linkTagsEl.value[0] === '#') && (linkTagsEl.value.length > 1)) {
            if (filterReadItemList.length === 0) {
                const id = 0;
                const readItem = new ReadItem(id, linkNameEl.value.trim(),
                    linkTagsEl.value.replace(/\s/g, '').trim(),
                    linkUrlEl.value.trim());

                readItemList.add(readItem);

                clearInputs(linkNameEl, linkTagsEl, linkUrlEl);

                rebuildTreeReadTab(listItemsEl, readItemList);
            } else {
                alert('You already have this link.')
            }
        }
    }
});

function clearInputs(...args) {
    return args.forEach((arg) => {
        arg.value = '';
    })
}

searchBtnEl.addEventListener('click', (evt) => {
    evt.preventDefault(); // отмена перезагрузки страницы
    searchItemList.items = [];
    validate(searchFormEl);
    if ((searchInputEl.value.trim() !== '') && (searchInputEl.value.trim().length >= 2)) {

        const searchValue = searchInputEl.value.trim().toLowerCase();

        readItemList.items.forEach((obj) => {
            if ((obj.name.toLowerCase().includes(searchValue)) || (obj.tags.indexOf(searchValue) !== -1)) {
                searchItemList.add(obj);
            }
        });

        rebuildTreeSearchTab(listItemsEl, searchItemList);
    }
});

function validate(form) {
    const elems = form.elements;

    if (elems.length === 4) {

        resetError(elems.linkName);
        if (!elems.linkName.value) {
            showError(elems.linkName);
        }

        resetError(elems.linkTags);
        if ((elems.linkTags.value[0] !== '#') || (elems.linkTags.value.length < 2)) {
            showError(elems.linkTags);
        }

        resetError(elems.linkUrl);
        if (!elems.linkUrl.value) {
            showError(elems.linkUrl);
        }
    } else {
        resetError(elems.searchName);
        if ((!elems.searchName.value) || (elems.searchName.value.length < 2)) {
            showError(elems.searchName);
        }
    }
}

function resetError(container) {
    container.classList.remove('border', 'border-danger');
}

function showError(container) {
    container.classList.add('border', 'border-danger');
}

function rebuildTreeReadTab(container, list) {
    container.innerHTML = '';

    const readItems = list.items.filter(item => !item.done);

    for (const item of readItems) {
        const liEl = document.createElement('li');
        liEl.className = 'list-group-item bg-light p-3 mb-1 rounded';
        let tagsHTML = '';
        for (const tag of item.tags) {
            tagsHTML += `<span class="badge badge-info mx-1">#${tag}</span>`;
            tagsHTML += `  `
        }
        {
            liEl.innerHTML = `
            <input class="mx-1" data-id="checkbox" type="checkbox"><a href="${item.url}" class="badge badge-light mx-1" target="_blank">${item.name}</a>
            ${tagsHTML}
            <button data-id="remove" class="btn btn-light btn-sm float-right p-0">&#10006;</button>
        `;
        }

        const checkboxEl = liEl.querySelector('[data-id=checkbox]');
        checkboxEl.addEventListener('click', (evt) => {
            item.done = true;
            checkboxEl.setAttribute('checked', 'true');
            rebuildTreeReadTab(container, list);
        });

        const removeEl = liEl.querySelector('[data-id=remove]');
        removeEl.addEventListener('click', (evt) => {
            readItemList.remove(item);
            rebuildTreeReadTab(container, list);
        });

        container.appendChild(liEl);
    }
    readItemList.save();
}

function rebuildTreeArchiveTab(container, list) {
    container.innerHTML = '';

    const readItems = list.items.filter(item => item.done);

    for (const item of readItems) {
        const liEl = document.createElement('li');
        liEl.className = 'list-group-item bg-light p-3 mb-1 rounded';
        let tagsHTML = '';
        for (const tag of item.tags) {
            tagsHTML += `<span class="badge badge-info mx-1">#${tag}</span>`;
            tagsHTML += `  `
        }
        {
            liEl.innerHTML = `
            <input class="mx-1" data-id="checkbox" type="checkbox" checked><a href="${item.url}" class="badge badge-light mx-1" target="_blank">${item.name}</a>
            ${tagsHTML}
            <button data-id="remove" class="btn btn-light btn-sm float-right p-0">&#10006;</button>
        `;
        }

        const checkboxEl = liEl.querySelector('[data-id=checkbox]');
        checkboxEl.addEventListener('click', (evt) => {
            item.done = false;
            checkboxEl.setAttribute('checked', 'true');
            rebuildTreeArchiveTab(container, list);
        });

        const removeEl = liEl.querySelector('[data-id=remove]');
        removeEl.addEventListener('click', (evt) => {
            readItemList.remove(item);
            rebuildTreeArchiveTab(container, list);
        });

        container.appendChild(liEl);
    }
    readItemList.save();
}

function rebuildTreeSearchTab(container, list) {
    container.innerHTML = '';

    for (const item of list.items) {
        const liEl = document.createElement('li');
        liEl.className = 'list-group-item bg-light p-3 mb-1 rounded';
        let tagsHTML = '';
        for (const tag of item.tags) {
            tagsHTML += `<span class="badge badge-info mx-1">#${tag}</span>`;
            tagsHTML += `  `
        }
        {
            liEl.innerHTML = `<a href="${item.url}" class="badge badge-light mx-1" target="_blank">${item.name}</a>
            ${tagsHTML}`;
        }

        container.appendChild(liEl);
    }
}

delAllBtnEl.addEventListener('click', (evt) => {
    evt.preventDefault();
    readItemList.removeAll();
    sync.clearStorage();
    rebuildTreeReadTab(listItemsEl, readItemList);
    rebuildTreeArchiveTab(listItemsEl, readItemList);
});
