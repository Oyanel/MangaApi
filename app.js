const Parser = require('./plugins/manga-parser').Parser;
var express = require('express');
var hostname = 'localhost';
var port = 3030;
var vhost = require('vhost')
var cors = require('cors')


// Nous créons un objet de type Express. 
var app = express(); 
 
// cross domain issues
app.use(cors())

var myRouter = express.Router(); 


myRouter.route('/')
.all(function(req,res){ 
      res.json({message : "Bienvenue sur Manga API ", methode : req.method});
});
 
// get Popular Manga list
myRouter.route('/popularmangalist/:mangacatalog/:page?')
.get(function(req,res){
 Parser.getPopularMangaList(req.params.mangacatalog, req.params.page)
 .then(paginator   => {
   res.json({
     paginator
   });
 });
});

// get Manga detail
myRouter.route('/mangadetail/:mangacatalog/:manga')
.get(function(req,res){
 Parser.getMangaDetail(req.params.mangacatalog, req.params.manga)
 .then(manga  => {
   res.json({
     manga
   });
 });
});

// get Manga lastest update
myRouter.route('/latestupdateslist/:mangacatalog/:page?')
.get(function(req,res){
 Parser.getLatestUpdatesList(req.params.mangacatalog, req.params.page)
 .then(paginator  => {
   res.json({
     paginator
   });
 });
});

// get Manga chapter list
myRouter.route('/chapterlist/:mangacatalog/:manga')
.get(function(req,res){
 Parser.getChapterList(req.params.mangacatalog, req.params.manga)
 .then(chapters   => {
   res.json({
     chapters 
   });
 });
});

// get Page list
myRouter.route('/pagelist/:mangacatalog/:chapter')
.get(function(req,res){ 
 Parser.getChapterList(req.params.mangacatalog, req.params.chapter)
 .then(pages   => {
   res.json({
     pages 
   });
 });
});

// get manga page
myRouter.route('/mangapage/:mangacatalog/:pageurl')
.get(function(req,res){ 
 Parser.getImageURL(req.params.mangacatalog, req.params.pageurl)
 .then(imageURL => {
   res.json({
     imageURL
   });
 });
});


// search manga
myRouter.route('/search/:mangacatalog/:manga')
.get(function(req,res){
  Parser.searchManga(req.params.mangacatalog, req.params.manga).then(paginator => {
  res.json({
    paginator});
  });
});

// get catalogs
myRouter.route('/catalogs')
.get(function(req,res){
  var catalogs = Parser.getCatalogs();
  res.json({
    catalogs});
});
 
// Nous demandons à l'application d'utiliser notre routeur
app.use(myRouter);
app.disable('etag');

// Démarrer le serveur 
app.listen(port, hostname, function(){
	console.log("Mon serveur fonctionne sur http://"+ hostname +":"+port); 
});
