var _ = require('lodash'),
  OutputFeed = require('../models/feed').outputFeed,
  SourceFeed = require('../models/feed').sourceFeed,
  config = require('config'),
  util = require('../util/util');

// Create new user feed
function add(feedData, user) {
  console.log("Add")
  var promise = new Promise(function(resolve, reject) {
    var newFeed = new OutputFeed({
      owner: user.username,
      title: feedData.title,
      normTitle: util.normalize(feedData.title),
      description: feedData.title,
      link: "",
      xmlUrl: "",
      date: new Date(Date.now()),
      lastBuildDate: new Date(0),
      image: { url: "", title: "" },
      copyright: "",
      categories: "",
      author: user.name,
      language: 'en',
      generator: "Oyster v" + config.version + " (http://oysterjs.com)",
    });

    newFeed.link = "/rss/" + user.username + '/' + newFeed.normTitle;

    Promise.all(populate(feedData))
      .then(function(values) {
        values.forEach(function(value) {
          value.articles.forEach(function(article) {
            var newArticle = {
              article: article,
              included: false,
              filtered: false
            };
            newFeed.articles.push(newArticle);
          });
        });
      })
      .then(function(values) {
        _.orderBy(newFeed.articles, 'pubdate', 'desc');

        newFeed.save(function(err, feed) {
          if (err) {
            console.log("New Output Save Error: " + err);
            reject(err);
          }else{
            resolve({ message: "Success", title:feed.title, id: feed.id });
          }

        });
      })
      .catch(function(data) {
        reject(data);
      });
  });
  return promise;
}

// Pull articles from each soure feed
function populate(feedData) {
  var promises = [];

  // Create new promise for each source feed
  feedData.sourceFeeds.forEach(function(feed_id) {
    var p = new Promise(function(resolve, reject) {
      SourceFeed.findById(feed_id, 'articles', function(err, source) {
        if (err) {
          console.log("New OuputFeed FindByID Error: " + err);
          reject(err);
        }
        resolve(source);
      });
    });
    promises.push(p);
  });
  return promises;
}

module.exports.add = add;
