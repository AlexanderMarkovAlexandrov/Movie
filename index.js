const baseURL = 'https://myteemproject.firebaseio.com/movies/.json';
const getUrl = 'https://myteemproject.firebaseio.com/movies/';
const app = Sammy('#container', function (context) {
    this.use('Handlebars', 'hbs');

    this.user = getUserInfo();

    this.get('#/home', function (context) {
        this.app.user = getUserInfo()
        fetch(baseURL)
            .then(res => res.json())
            .then(info => {
                let movies = moviesCreator(info);
                extendContext(context)
                    .then(function (context) {
                        this.partial('./templates/home.hbs', { movies })
                    }
                    )
            })
            .catch(err => {
                displayErrorMsg(err.message);
            });

    });
    this.get('#/login', function (context) {
        extendContext(context)
            .then(function (context) {
                this.partial('./templates/login.hbs');
            })
    });
    this.get('#/register', function (context) {
        extendContext(context)
            .then(function (context) {
                this.partial('./templates/register.hbs')
            })
    });
    this.get('#/logout', function () {
        firebase.auth().signOut()
            .then(res => {
                localStorage.clear();
                this.redirect('#/home')
            })
            .catch(err => {
                displayErrorMsg(err.message);
            })

    });
    this.get('#/addMovie', function (context) {
        extendContext(context)
            .then(function (context) {
                this.partial('./templates/addMovie.hbs')
            })
            .catch(err => {
                displayErrorMsg(err.message)
            })
    });
    this.get('#/details/:id', function (context) {
        let { uid } = getUserInfo();
        let { id } = context.params;
        fetch(getUrl + id + '/.json')
            .then(res => res.json())
            .then(movie => {
                movie.id = id;
                context.isCreator = true;
                if (movie.creatorId !== uid) {
                    context.isCreator = false;
                }
                extendContext(context)
                    .then(function (context) {
                        this.partial('./templates/details.hbs', { movie })
                    })
            })
            .catch(err => {
                displayErrorMsg(err.message)
            })
    });
    this.get('#/edit-movie/:id', function (context) {
        let { uid } = getUserInfo();
        let { id } = context.params;
        fetch(getUrl + id + '/.json')
            .then(res => res.json())
            .then(movie => {
                movie.id = id;
                context.isCreator = true;
                if (movie.creatorId !== uid) {
                    context.isCreator = false;
                    return;
                }
                extendContext(context)
                    .then(function (context) {
                        this.partial('./templates/editMovie.hbs', { movie })
                    })
            })
            .catch(err => {
                displayErrorMsg(err.message)
            })
    });
    this.get('#/delete-movie/:id', function (context) {
        let { uid } = getUserInfo();
        let { id } = context.params;
        let initObj = createInitObj('delete');
        fetch(getUrl + id + '/.json', initObj)
            .then(res => {
                console.log(res);
                this.redirect('#/home')
            })
            .catch(err => {
                displayErrorMsg(err.message)
            })
    });
    // this.get('#/like-movie/:id', function (context) {
    //     let { email } = getUserInfo();
    //     let { id } = context.params;
    //     fetch(getUrl + id + '/.json')
    //         .then(res => res.json())
    //         .then(movie => {
    //             if(movie.likes){
    //                 let liked = movie.likes.includes(email)
    //                 if(!liked){
    //                     movie.likes.push(email) 
    //                 }
    //             }else{
    //                 movie.likes = [email]
    //             }
    //             let likes = movie.likes;
    //             let body = { likes };
    //             let initObj = createInitObj('PATCH', body);
    //             fetch(getUrl + id + '/.json', initObj)
    //                 .then(res => { 
    //                     extendContext(context)
    //                     .then(function (context) {
    //                         this.partial('./templates/details.hbs', { movie })
    //                     })
    //                     let aEl = document.querySelector('.btn-primary');
    //                     aEl.style.display = 'none';
    //                     let spanEl = document.querySelector('.enrolled-span');
    //                     spanEl.innerText = `Liked ${likes.length}`
    //                     spanEl.style.display = 'block';
    //                     displaySuccessMsg('Liked successfully!');
    //                  })
    //                 .catch(err => {
    //                     displayErrorMsg(err.message)
    //                 })
    //         })
    //         .catch(err => {
    //             displayErrorMsg(err.message)
    //         });
    //     });
    this.post('#/addMovie', function (context) {
        let { uid: creatorId } = getUserInfo();
        let { title, description, imageUrl } = context.params;
        if (title === '' || description === '' || imageUrl === '') {
            displayErrorMsg('Add info in all area!');
            return;
        }

        let body = { title, description, imageUrl, creatorId };
        let initObj = createInitObj('POST', body);
        fetch(baseURL, initObj)
            .then(res => {
                console.log(res);
                this.redirect('#/home')
            })
            .catch(err => {
                displayErrorMsg(err.message);
            })
    });
    this.post('#/register', function (context) {
        let { email, password, repeatPassword } = context.params;
        if (password !== repeatPassword) {
            displayErrorMsg('The Password and the Repeat-Password must be the same!');
            return;
        }
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then(res => {
                this.redirect('#/login')
            })
            .catch(err => {
                displayErrorMsg(err.message);
            })
    });
    this.post('#/login', function (context) {
        let { email, password } = context.params;
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then(res => {
                console.log(res);
                let { email, uid } = res.user;
                localStorage.setItem('user', JSON.stringify({ email, uid }));
                this.redirect('#/home')
            })
            .catch(err => {
                displayErrorMsg(err.message);
            })
    });
    this.post('#/edit-movie/:id', function (context) {
        let { uid: creatorId } = getUserInfo();
        let { title, description, imageUrl, id } = context.params;
        if (title === '' || description === '' || imageUrl === '') {
            displayErrorMsg('Add info in all area!');
            return;
        }
        let body = { title, description, imageUrl, creatorId };
        let initObj = createInitObj('PATCH', body);
        fetch(getUrl + id + '/.json', initObj)
            .then(res => { this.redirect('#/home') })
            .catch(err => {
                displayErrorMsg(err.message)
            })
    });
});

app.run('#/home');

function extendContext(context) {
    return context.loadPartials({
        'header': './templates/header.hbs',
        'footer': './templates/footer.hbs',
    })
};

function displayErrorMsg(msg) {
    let pElMsg = document.getElementById('errorBox');
    pElMsg.innerText = msg;
    pElMsg.parentElement.style.display = 'block';
    setTimeout(function () { pElMsg.parentElement.style.display = 'none' }, 3000);
};
function displaySuccessMsg(msg) {
    let pElMsg = document.getElementById('successBox');
    pElMsg.innerText = msg;
    pElMsg.parentElement.style.display = 'block';
    setTimeout(function () { pElMsg.parentElement.style.display = 'none' }, 3000);
};
function getUserInfo() {
    let currUser = localStorage.getItem('user');
    return currUser ? JSON.parse(currUser) : {};
};
function createInitObj(method, body) {
    return {
        method: method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...body })
    }
};
function moviesCreator(data) {
    let result = [];
    if (data) {
        Object.keys(data).map(key => { data[key].id = key, result.push(data[key]) });
    }
    return result;
};
