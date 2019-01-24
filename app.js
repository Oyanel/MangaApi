const Parser = require('./plugins/manga-parser').Parser;
let express = require('express');
let bodyParser = require("body-parser");
let $ = require("jquery");
let hostname = 'localhost';
let port = 3030;
let cors = require('cors');

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
myRouter.route('/getImageList/:mangacatalog')
    .post(function (req, res) {
        let manga = req.body.manga;
        let catalog = req.params.mangacatalog;
        let listImages = [];
        Parser.getPageList(catalog, manga.lastChapter)
            .then(async pages => {
                pages.forEach((page) => {
                    listImages.push(getImageUrl(catalog, page));
                });
                let images = await Promise.all(listImages);
                res.json({images});
            });
    });

function getImageUrl(catalog, page) {
    return new Promise(resolve => {
        Parser.getImageURL(catalog, page)
            .then(imageURL => {
                console.log(imageURL);
                resolve(imageURL);
            });
    });
}

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
    .post(async function (req, res) {
        let mangas = req.body.mangas;
        let catalog = req.params.mangacatalog;
        let arrayChapters = await addChapter(mangas, catalog);
        let index = 0;
        for (let manga of mangas) {
            manga.lastChapter = arrayChapters[index];
            index++;
        }
        res.json({mangas});
    });

// Return last chapter of a manga
function mangaLastChapter(manga, catalog) {
    return new Promise(resolve => {
        Parser.getChapterList(catalog, manga).then((chapters) => {
                let keys = Object.keys(chapters);
                let last = keys[keys.length - 1];
                resolve(chapters[last]);
            },
            error => {
                error(error);
            }
        );
    });
}

// return the last chapters for all mangas
addChapter = async (mangas, catalog) => {
    let chapters = [];
    for (let manga of mangas) {
        chapters.push(mangaLastChapter(manga, catalog));
    }
    return Promise.all(chapters);
};

app.use(myRouter);

app.disable('etag');

app.listen(port, hostname, function () {
    console.log("Mon serveur fonctionne sur http://" + hostname + ":" + port);
});
