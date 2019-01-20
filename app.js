const Parser = require('./plugins/manga-parser').Parser;
let bodyParser = require("body-parser");
let express = require('express');
let cors = require('cors');
let admin = require("firebase-admin");
let serviceAccount = require("./config/serviceAccountKey.json");


const config = require('./config/config.json');
let hostname = config.global.hostname
let port = config.global.port

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: config.firebase.database_url
});

let db = admin.database();

let catalog = 'readmangatoday';
let app = express();

// cross domain issues
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

let myRouter = express.Router();

myRouter.route('/')
    .all(function (req, res) {
        res.json({message: "Bienvenue sur Manga API ", methode: req.method});
    });

// get Popular Manga list
myRouter.route('/popularmangalist/:mangacatalog/:page?')
    .get(function (req, res) {
        Parser.getPopularMangaList(req.params.mangacatalog, req.params.page)
            .then(paginator => {
                res.json({
                    paginator
                });
            });
    });

// get Manga detail
myRouter.route('/mangadetail/:mangacatalog/:manga')
    .get(function (req, res) {
        Parser.getMangaDetail(req.params.mangacatalog, req.params.manga)
            .then(manga => {
                res.json({
                    manga
                });
            });
    });

// get Manga lastest update
myRouter.route('/latestupdateslist/:mangacatalog/:page?')
    .get(function (req, res) {
        Parser.getLatestUpdatesList(req.params.mangacatalog, req.params.page)
            .then(paginator => {
                res.json({
                    paginator
                });
            });
    });

// get Manga chapter list
myRouter.route('/chapterlist/:mangacatalog/:manga')
    .get(function (req, res) {
        Parser.getChapterList(req.params.mangacatalog, req.params.manga)
            .then(chapters => {
                res.json({
                    chapters
                });
            });
    });

// get Page list
myRouter.route('/pagelist/:mangacatalog/:chapter')
    .get(function (req, res) {
        Parser.getChapterList(req.params.mangacatalog, req.params.chapter)
            .then(pages => {
                res.json({
                    pages
                });
            });
    });

// get manga page
myRouter.route('/mangapage/:mangacatalog/:pageurl')
    .get(function (req, res) {
        Parser.getImageURL(req.params.mangacatalog, req.params.pageurl)
            .then(imageURL => {
                res.json({
                    imageURL
                });
            });
    });

// search manga
myRouter.route('/search/:mangacatalog/:manga')
    .get(function (req, res) {
        Parser.searchManga(req.params.mangacatalog, req.params.manga).then(paginator => {
            res.json({
                paginator
            });
        });
    });

// get catalogs
myRouter.route('/catalogs')
    .get(function (req, res) {
        let catalogs = Parser.getCatalogs();
        res.json({
            catalogs
        });
    });


// get full Manga (return manga + last chapter info)
myRouter.route('/mangas/:mangacatalog')
    .post(function (req, res) {
        let mangas = req.body.mangas;
        let catalog = req.params.mangacatalog;
        mangaDetails(mangas, catalog).then((result) => {
            res.json({result});
        });
    });

function mangaDetails(mangas, catalog) {
    addChapter(mangas, catalog).then((arrayChapters) => {
        let index = 0;
        for (let manga of mangas) {
            if (arrayChapters[index] !== undefined) {
                manga.lastChapter = arrayChapters[index];
            } else {
                mangas.splice(index, index);
            }
            index++;
        }
        return mangas;
    });
}

// Return last chapter of a manga
function mangaLastChapter(manga, catalog) {
    return Promise.resolve(
        Parser.getChapterList(catalog, manga).then((chapters) => {
                let keys = Object.keys(chapters);
                let last = keys[keys.length - 1];
                return chapters[last];
            },
            error => {
                console.log(error);
                return error;
            })
    );
}

// return the last chapters for all mangas
function addChapter(mangas, catalog) {
    let chapters = [];
    for (let manga of mangas) {
        chapters.push(mangaLastChapter(manga, catalog));
    }
    return Promise.all(chapters);
}


// update last cahpter firebase favorite
function updateChapterFirebase() {
    let userIds = [];
    admin.auth().listUsers(100)
        .then(function (listUsersResult) {
            listUsersResult.users.forEach(function (userRecord) {
                userIds.push(userRecord.uid);
            });
        })
        .then(function () {
                userIds.forEach(function (user_id) {
                    let ref = db.ref("users/" + user_id + "/mangas/favoris");

                    // Retrieve the favorite mangas
                    ref.once('value').then(function (snapshot) {
                        if (!!snapshot.val()) {
                            let mangas = Object.values(snapshot.val());

                            // get the last chapter
                            addChapter(mangas, catalog).then((chapters) => {
                                let listMangas = snapshot.val();

                                // update last chapter in Firebase
                                Object.keys(listMangas).forEach((key, index) => {
                                    ref.child(key).update({
                                        "lastChapter": chapters[index]
                                    });
                                });
                            });
                        }
                    });
                });
            }
        );
}

updateChapterFirebase();

app.use(myRouter);

app.disable('etag');

app.listen(port, hostname, function () {
    console.log("Server running on ://" + hostname + ":" + port);
});
