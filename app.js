'use strict';

var CLIENT_ID = '54b04e3a4ff74724a6608ffa00545a7c';
var CLIENT_SECRET = 'd33659d3168a4f98a6f447526cd21400';

var SHORTCUTS = [
    '9I0Hzmot3q',
    '9I1PHZoaSO',
    '9I0JkHEgSy',
    '9I0KnztRcn',
    '9I0KdQv65d',
    '9I0OBYJXGb',
    '9I0V4TKmX1',
    '9I2igRyozI',
    '9I0OdqMja8',
    '9I0OoiCQba',
    '9I0J0-L5Pp',
    '9I0KHdD8LZ',
    '9I0MN0nTIq'
];

var ig = require('instagram-node').instagram();
ig.use({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
});

console.log('Получение данных о фотках...');

Promise.all(SHORTCUTS.map(function (sc) {
    return (new Promise(function (resolve, reject) {
        ig.media_shortcode(sc, function (err, data) {
            if (err) {
                reject(err);
            } else {
                console.log('https://instagram.com/p/' + sc + ' ... данные ');
                data.sc = sc;
                resolve(data);
            }
        });
    })).then(function (data) {
            return new Promise(function (resolve, reject) {
                ig.user_followers(data.user.id, flw);

                data.followers = [];
                function flw(err, followers, pagination) {
                    if (err) {
                        reject(err);
                    } else {
                        data.followers = data.followers.concat(followers);
                        if (pagination && pagination.next) {
                            pagination.next(flw);
                        } else {
                            console.log('https://instagram.com/p/' + sc + ' ... фолловеры автора ');
                            resolve(data);
                        }
                    }
                }
            });
        }).then(function (data) {
            return new Promise(function (resolve, reject) {
                ig.likes(data.id, function (err, likes) {
                    console.log('https://instagram.com/p/' + sc + ' ... лайки ');
                    if (err) {
                        reject(err);
                    } else {
                        data.likes.data = likes;
                        resolve(data);
                    }
                });
            });
        }).then(function (data) {
            return new Promise(function (resolve, reject) {
                ig.comments(data.id, function (err, comments) {
                    console.log('https://instagram.com/p/' + sc + ' ... комменты ');
                    if (err) {
                        reject(err);
                    } else {
                        data.comments.data = comments;
                        resolve(data);
                    }
                });
            });
        });
})).then(function (data) {
    console.log();
    console.log('Информация об организаторах и фотках:');

    console.log(data.map(function (row) {
        return {
            url: row.link,
            username: row.user.username,
            likes: row.likes.count,
            comments: row.comments.count
        };
    }));

    console.log();
    console.log('Отсеиваем комментарии, в которых упомянули меньше двух пользователей:');

    data.forEach(function (row) {
        row.comments.data = row.comments.data.filter(function (comment) {
            var matches = comment.text.match(/@[a-z0-9_.-]+/ig) || [];

            if (matches.length < 2) {
                console.log(matches.length, matches, comment.text);
            }

            return matches.length > 1;
        });
    });

    var users = {};

    data.forEach(function (row) {
        row.followers.forEach(function (follower) {
            var username = follower.username;
            users[username] = users[username] || {};
            var user = users[username];

            user.followers = user.followers || {};
            user.followers[row.sc] = true;
        });

        row.comments.data.forEach(function (comment) {
            var username = comment.from.username;
            users[username] = users[username] || {};
            var user = users[username];

            user.comments = user.comments || {};
            user.comments[row.sc] = true;
        });

        row.likes.data.forEach(function (like) {
            var username = like.username;
            users[username] = users[username] || {};
            var user = users[username];

            user.likes = user.likes || {};
            user.likes[row.sc] = true;
        });
    });

    var u = Object.keys(users).map(function (username) {
        return {
            username: username,
            followers: Object.keys(users[username].followers || {}).length,
            comments: Object.keys(users[username].comments || {}).length,
            likes: Object.keys(users[username].likes || {}).length
        };
    }).filter(function (row) {
        return row.followers && row.comments && row.likes;
    });

    console.log(u);
}).catch(function (err) {
    console.log(err);
});
