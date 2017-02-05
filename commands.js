var guildManager = require("./guildManager");
var main = require("./main");
var moment = require('moment');
var client;
var Game = require('./game');
var gm = require('./gamemanager');

function giveClient(c) {
    client = c;
}

function parseMessage(ctx) {
    var msg = ctx.message.content;
    var chnl = ctx.message.channel;

    console.log("Received message: " + msg);
    if (/\bWhat\b/ig.test(msg)) {
        if (/\bchannel\b/ig.test(msg)) {
            if (/\bis this\b/ig.test(msg)) {
                chnl.sendMessage("This channel is: " + chnl.name);
            }
            if (/\bid is this\b/ig.test(msg)) {
                chnl.sendMessage("This channel's id is: " + chnl.id);
            }
        }
    }

    if (/\blist\b/ig.test(msg)) {
        if (/\bchannel\b|\bchannels\b/ig.test(msg)) {
            chnl.sendMessage(guildManager.listChannels());
        }
    }

    if (/\bclear\b|\bcc\b/ig.test(msg)) {
        if (/\bchat\b|\bcc\b/ig.test(msg)) {

            // This should probably be at the start of the
            // parse function, but there might be come cases
            // where the bot needs to parse its own message
            //  - TC
            if (ctx.message.author.id === client.User.id) {
                return;
            }

            var result = msg.match(/\d+/);
            var num = 100;
            if (result != null) {
                num = result[0];
            }
            var msgs = chnl.fetchMessages(num, null, null).then(function (messages) {
                var ms = messages.messages.filter(m => !m.deleted);
                client.Messages.deleteMessages(ms, chnl);
            }, function (error) {
                chnl.sendMessage('Sorry, an error occured');
            });
        }
    }
    if (/^chat log\b/i.test(msg)) {
        var result = msg.match(/\d+/);
        var num = 10;
        if (result != null) {
            if (result[0] == 1) {
                chnl.sendMessage('Don\'t be silly');
                return;
            }
            num = result[0];
            var msgs = client.Messages.forChannel(chnl);
            var messageToSend = 'Here are the last ' + num + ' messages\n';
            msgs.forEach(function (m) {
                if (m.author.id === client.User.id) {
                    return;
                }
                messageToSend += (m.author.nickMention + ' *' + moment(m.timestamp).calendar() + (m.deleted ? ' (deleted)' : '') + '*\n' +
                    m.content);
                messageToSend += '\n\n';
            }, this);
            chnl.sendMessage(messageToSend);
        }
    }
    if (/^new game\b/i.test(msg)) {
        var gameChannels = Game.freeChannels();
        if(gameChannels.length > 0) {
            var newGame = new Game(ctx.message.author, gameChannels[0]);
        } else {
            // no more channels
            chnl.sendMessage('Sorry, there are no more game channels available!');
        }
    }
    if(/^join$/i.test(msg)) {
        var game = gm.getGameForChannel(chnl);
        if(game) {
            game.addPlayer(ctx.message.author);
        }
    }
    if(/^start game\b/i.test(msg)) {
        var game = gm.getGameForChannel(chnl);
        if(game) {
            if(game.host.id === ctx.message.author.id) {
                game.startGame();
                return;
            }
            chnl.sendMessage('Only ' + game.host.nickMention + ' may start the game');
        }
    }
}

module.exports = {
    parseMessage: parseMessage,
    giveClient: giveClient
}