$(function() { // on ready    

    // when the page is loaded, get the Users book and render Shelf
    getUserBooks(updateSessionStorageWithBooks);
    getBooksFromSessionStorage(renderBooks);


    // EVENT LISTENERS

    //handle add book button click on homepage
    // display the add book interface
    $('#add-book-btn').on('click', function() {
        $('.add-book-background').removeClass('hidden');
        $('.add-book-dialog').removeClass('hidden');
    });
    $('.book-result-dialog').on('click', '#delete-book-btn', function() {
        const isbn = $(this).parent().attr('id');

        deleteBook(isbn);
    });
    $('.book-result-dialog').on('click', '#update-rating-btn', function() {
        // show updatable fields
        $('.update-rating-form').removeClass('hidden');
    });

    $('.book-result-dialog').change('.update-rating-form', function(event) {
        const selected_rating = $(event.target).val();
        const isbn = $(this).children('.user-book').attr('id');
        updateRating(isbn, selected_rating);
    })

    // handle escaping from add book dialog
    // hide modal
    $('.add-book-dialog').on('click', '.close-btn', function() {
        $('.add-book-background').addClass('hidden');
        $('.add-book-dialog').addClass('hidden');
        $('.book-result-dialog').html('').addClass('hidden');
    });
    $('.book-result-dialog').on('click', '.close-btn', function() {
        $('.book-result-dialog').addClass('hidden');
        $('.selected-volume img').remove();
    });
    // user submits search for book
    // get book results from google api and call renderVolumes fn
    $('.add-book-form').on('submit', function(event) {
        event.preventDefault();
        const SEARCH_STRING = $('#book-search').val();
        $('.volume-searchresults').children().remove();
        searchAllVolumes(SEARCH_STRING, renderVolumes)
    });
    $('.volume-searchresults').on('click', '.result', function() {
        let selectedBookId = $(this).attr('id');
        $('.book-result-dialog').removeClass('hidden');
        searchSingleVolume(selectedBookId, renderVolume);
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    });
    // Add book to shelf
    // gets bookId, looks up book, calls addToShelf fn
    $('.book-result-dialog').on('click', '.add-to-shelf-btn', function() {
        let selectedBookId = $(this).parent().attr('id');

        searchSingleVolume(selectedBookId, addToShelf);
    });
    $('.book-result-dialog').on('click', '.view-books-btn', function() {
        getUserBooks(updateSessionStorageWithBooks);
        window.location.replace("/home.html")
    });

    $('.book-result-dialog').on('click', '.book-result-close', function() {
        $('.book-result-dialog').html('');
        $('.book-result-dialog').addClass('hidden');
    });
    // render user book
    $('.user-books').on('click', '.result', function() {
        const isbn = $(this).attr('id');

        findBook(isbn, renderBook);

        $('.book-result-dialog').removeClass('hidden');
        $('html, body').animate({ scrollTop: 0 }, 'fast');
    })

    // Log user out
    // Clear session storage and redirect to index
    $('#logout-btn').on('click', function() {    
        sessionStorage.clear();

        window.location.replace("/index.html")
    })

    // Refresh auth token
    $('#refresh-token-btn').on('click', function() {    
        getAuthToken(addAuthToken);
    })


    // RENDERING FUNCTIONS

    // renders all volumes returned from google query
    let renderVolumes = function(volumeResults) {   
        volumeResults.forEach( (volume) => {

            let author = volume.volumeInfo.authors[0];
            let description = volume.volumeInfo.description;
            let imageLink;
            if(typeof volume.volumeInfo.imageLinks != 'undefined') {
                if(typeof volume.volumeInfo.imageLinks.smallThumbnail != 'undefined') {
                    imageLink = volume.volumeInfo.imageLinks.smallThumbnail;
                } else if (typeof volume.volumeInfo.imageLinks.thumbnail != 'undefined') {
                    imageLink = volume.volumeInfo.imageLinks.thumbnail;
                }
            } else {
                imageLink = "./defaultBook.png" // SET TO DEFAULT IMAGE 
            }

            let volumeHtml = `
                <div class="result" id="${volume.id}">
                    <img src="${imageLink}" alt="book image"/>
                    <div class="result-text">
                        <p> ${volume.volumeInfo.title}</p>
                        <p>by ${author}</p>
                    <div>
                </div>`
            $('.volume-searchresults').append(volumeHtml);
        })
    }
    // render the view for a single volume
    function renderVolume(volume) {
        let author = volume.volumeInfo.authors[0];
        let description = volume.volumeInfo.description;
        let imageLink;
        if(typeof volume.volumeInfo.imageLinks != 'undefined') {
            if(typeof volume.volumeInfo.imageLinks.smallThumbnail != 'undefined') {
                imageLink = volume.volumeInfo.imageLinks.smallThumbnail;
            } else if (typeof volume.volumeInfo.imageLinks.thumbnail != 'undefined') {
                imageLink = volume.volumeInfo.imageLinks.thumbnail;
            }
        } else {
            imageLink = "./defaultBook.png" // SET TO DEFAULT IMAGE 
        }
        let volumeHtml = `
        <div class="selected-volume" id="${volume.id}">
            <a class="close-btn"></a>
            <img src="${imageLink}" alt="volume image"/>
            <p> ${volume.volumeInfo.title}</p>
            <p>by ${author}</p>
            <p>${description}</p>
            <button class="add-to-shelf-btn btn btn-primary btn-md">Add to Shelf</button>
            <button class="view-books-btn btn btn-primary btn-md">View books</button>
        </div>`
        $('.book-result-dialog').html(volumeHtml);
    }

    // get the User books from session storage memory
    function getBooksFromSessionStorage(callback) {
        let USER_BOOKS = [];
        for(let i = 0; i < sessionStorage.length; i++){
            if(sessionStorage.key(i) != 'token') {
                let key = sessionStorage.key(i);
                let bookObj = sessionStorage.getItem(key);
                USER_BOOKS.push(JSON.parse(bookObj));
            }
        }
        callback(USER_BOOKS);
    }

    // render the users books in the view
    function renderBooks(books) {
        books.forEach( (book) => {
            let userBook = 
            `<div class="result result-saved" id="${book.isbn}">
                <img src="${book.image_link}" alt="book image"/>
                <div class="result-text">
                    <p><b> ${book.title} </b></p>
                    <p>${book.author}</p>
                </div>
            </div>`

            $('.user-books').append(userBook);
        })
    }

    // render a single book view
    function renderBook(book) {
        let bookHtml = `
        <div class="user-book" id="${book.isbn}">
            <a class="close-btn"></a>
            <img src="${book.image_link}" alt="volume image" aria-label="volume image"/>
            <h2> ${book.title}</h2>
            <p><b>${book.author}</b></p>
            <p>${book.description}</p>
            <p>ISBN: ${book.isbn}</p>
            <p>Added: ${book.book_added}</p>
            <span>Your rating: ${book.rating_user}</span>
            <span id="update-rating-btn"><a>Edit</a></span>
            <form action="#" class="update-rating-form hidden" name="update-rating-form">
                <select class="rating-select custom-select">
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                </select>
            </form>
            <p></p>
            <p>Average Google Rating (out of 5): ${book.rating_avg}</p>
            <input type="button" id="delete-book-btn" name="delete-book-btn" value="Delete book" class="btn btn-danger btn-md">  
        </div>`
        $('.book-result-dialog').html('');
        $('.book-result-dialog').html(bookHtml);
    }

    // builds book object, calls api to create new book
    function addToShelf(book) {
        $('#successInfo').remove();
        $('#warningInfo').remove();

        let isbn_index = 0;
        if(book.volumeInfo.industryIdentifiers.length > 1) {
            isbn_index = 1;
        }
        let imageLink;
        if(typeof book.volumeInfo.imageLinks != 'undefined') {
            if(typeof book.volumeInfo.imageLinks.smallThumbnail != 'undefined') {
                imageLink = book.volumeInfo.imageLinks.smallThumbnail;
            } else if (typeof book.volumeInfo.imageLinks.thumbnail != 'undefined') {
                imageLink = book.volumeInfo.imageLinks.thumbnail;
            }
        } else {
            imageLink = "./defaultBook.png" // SET TO DEFAULT IMAGE 
        }
        let bookObj = {
            "title": book.volumeInfo.title,
            "author": book.volumeInfo.authors[0],
            "isbn": book.volumeInfo.industryIdentifiers[isbn_index].identifier,
            "description": book.volumeInfo.description,
            "book_added": Date.now(),
            "book_modified": Date.now(),
            "rating_avg": book.volumeInfo.averageRating || 0,
            "rating_user": 0,
            "image_link": imageLink
        }

        // check if book exists in sessionStorage
        let bookExists = sessionStorage.getItem(bookObj.isbn);

        if(bookExists) {
            $('.book-result-dialog').append(`<h3 id="warningInfo" style="color: #d43f3a">Book already exists on Shelf</h3>`);
        } else {
            addBook(bookObj);
        }

        getUserBooks(updateSessionStorageWithBooks);
        getBooksFromSessionStorage(renderBooks)
        window.location.replace("/home.html")
    }

    
    // adds auth token to session storage
    function addAuthToken(authToken) {
        sessionStorage.setItem('token', authToken);
        $(`<h3 style="color:#5cb85c">Token refreshed!</h3>`).insertAfter('header').delay(3000).fadeOut();
    }


});