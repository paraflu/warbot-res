//  Description:
//    Coc war bot
//  Commands:
//    hubot avvia war alle <ora> - programma una war per l'ora indicata.
//    hubot la strategia è <msg> - archivia un messaggi per la tattica generica
//    hubot cancella war - cancella una war programmata.
//    hubot quando vedi <username> digli che <msg> - invia un messaggio quando online
//    hubot cancella messaggi - cancella messaggi per me


//    hubot avvisa tutti <messaggio> - invia un `messaggio` a tutti gli utenti.
//    hubot ci sono messaggi - invia i messaggi in segreteria 

var hasProp = {}.hasOwnProperty;

var moment = require('moment'),
    _ = require('lodash');

moment.locale('it');

function Segreteria(robot)
{
    var bot = robot;
    var self = this;
    var data = [];
    var key = 'segreteria';

    this.save = function() {
        bot.brain.set(key, data)
    }

    this.load = function() {
        return bot.brain.get(key);
    }

    this.messageForMe = function(usr) {
        if (!data || data[usr.name] || data[usr.name].read) {
            return false;
        }
        return data[usr.name];
    }

    this.getMessages = function (user) {
        var msgs = messageForMe(user);
        if (!msgs)
        {
            return "Nessun messaggio";
        }
        var msg = "";
        _.map(msgs, function(it) {
            msg += (it.letto?"*":" ") + 
                " da: " + it.from.name + " il " + moment(it.when).format("LT l") + "\n" +
                    it.message;
        });
        return msg;
    };

    this.empty = function(username) {
        if (this.getMessages(username)) {
            delete data[username];
            this.save();
        }
    }

    this.inviaMessaggio = function (destinatario, mittente, messaggio) {
        if (!data) {
            data = [];
        }

        if (!data[destinatario]) {
            data[destinatario] = { read: true, messages: []}
        }

        msgs = data[destinatario];
        msgs.messages.push({read: false, message: messaggio, when: new Date(), from: mittente});
        msgs.read = false;

        data[destinatario] = msgs;

        self.save();
          
    }
    data = this.load();
}

function WarSpec(robot) {

    var bot = robot;
    var warspecs = [];

    this.load = function(roomid) {
        if (!roomid) {
            return bot.brain.get('warspec');
        } else {
            warspecs = bot.brain.get('warspec');
            return warspecs[roomid]
        } 
    }

    this.save = function(id, data) {
        if (id) {
            warspecs[id] = data;
        }
        bot.brain.set('warspec', warspecs);
    }

    this.remove = function(id) {
        if (warspecs[id]) {
            delete warspecs[id];
            this.save();
        }
    }

    this.status = function(roomid) {
        var data = load(roomid);
        var inizio = moment(data.start_at);
        var fine_preparativi = moment(data.start_at).add(24, 'h');
        var fine_war = moment(fine_preparativi).add(24, 'h');
        var ora = moment();
        var msg = "";
        if (ora < inizio) {
            msg += "C'è la war programmata da " + data.user.username + " per le " + (moment(data.start_at).format('LT l')) + "\n";
        } else if (ora < fine_preparativi) {
            msg += "E' in corso una war, è il giorno dei preparativi, termina alle " + (fine_preparativi.format('LT l')) + "\n";
        } else if (ora < fine_war) {
            res += "E' il giorno degli eroi, ancora " + fine_war.format('LT l') + "\n";
        } else {
            msg += "La war è finita alle " + (fine_war.format('LT l')) + "\n";
        }
        if (data.strategia) {
            msg+= "Tattica: " + warspec.strategia + "\n";
        }
        return msg;
    }    
    
    warspecs = this.load();    
}

module.exports = function (robot) {

    var segreteria = new Segreteria(robot);
    var warspec = new WarSpec(robot);
    var self = this;

    robot.error(function (err, res) {
        robot.logger.error(err);
        if (res != null) {
            res.reply("`Error: " + err + "`");
        }
    });

    robot.hear(/.*/, function (res) {
        var usr = res.message.user;
        if (segreteria.messageForMe(usr)) {
            res.reply("Ci sono messaggi per te!\n" +  segreteria.getMessages(usr));
        } else {
            res.reply("Nessun messaggio.");
        }
    });

    robot.respond(/debug/, function (res) {
        res.reply("`war data: " + JSON.stringify(warspec) + ", segreteria: " + JSON.stringify(segreteria) + "`");
    });

    robot.respond(/(avvia|programma) (war|guerra) alle (\d+)/i, function (res) {
        var wdata = warspec.load(res.message.room.id);
        if (wdata) {
            res.reply(wdata.user.username + " la sta avviando...");
        } else {
            var ws = {
                user: res.message.user,
                when: new Date(),
                start_at: moment(res.match[3], 'h').toDate()
            };
            res.reply("Ok, progammata per le " + (moment(ws.start_at).format('LT l')) + "!");
            warspec.save(res.message.room.id, ws);
        }
    });

    robot.respond(/start war|avvia (war|guerra)$|avviamo.*war$/i, function (res) {
        var warspec;
        var wdata = warspec.load(res.message.room.id);
        if (!wdata) {
            wdata = {
                user: res.message.user,
                when: new Date()
            };
            res.reply("Ok, quando la lanci?");
            warspec.save(res.message.room.id, wdata);
        } else {
            res.reply(wdata.user.username + " la sta avviando... messaggio delle " + (moment(wdata.start_at).format('LT l')));
        }
    });

    robot.respond(/alle (\d+)/i, function (res) {
        var wdata = warspec.load(res.message.room.id);
        if (wdata) {
            wdata.start_at = moment(res.match[1], 'h').toDate();
            res.reply("ok " + res.message.user.username + " avviamo alle " + (moment(wdata.start_at).format('LT l')));
            warspec.save(res.message.room.id, wdata);
        } else {
            res.reply("Nessuna war programmata.");
        }
    });

    robot.respond(/cancella war/i, function (res) {
        var wdata = warspec.load(res.message.room.id);
        if (!wdata) {
            res.reply("non ci sono guerre in programma...");
        } else {
            res.reply("Ok!");
            warspec.remove(res.message.room.id);
        }
    });
    robot.respond(/(guerr[ea]|war) in (programma|previsione|corso)|(guerra|war) programmata/i, function (res) {
        res.reply(warspec.status(res.message.room.id));
    });

    // robot.respond(/avvisa tutti che (.*)$/i, function (res) {
    //     var key, msg, results, sender, usr, usrs;
    //     msg = res.match[1];
    //     sender = res.message.user;
    //     usrs = robot.brain.get('userlist');
    //     results = [];
    //     for (key in usrs) {
    //         if (!hasProp.call(usrs, key)) continue;
    //         usr = usrs[key];
    //         robot.logger.debug("avvisa " + usr.username);
    //         results.push(res.send("@" + usr.username + " > " + msg + " from " + sender.name));
    //     }
    //     return results;
    // });

    robot.respond(/quanto manca/i, function (res) {
        res.reply(warspec.status(res.message.room.id));
    });

    robot.hear(/ciao/i, function (res) {
        var msg = "ciao " + res.message.user.username;
        if (segreteria.messageForMe(res.message.username.name)) {
            msg += segreteria.getMessages();
        }
        res.reply(msg);
    });

    robot.respond(/la strategia è (.*)/i, function (res) {
        var wdata = warspec.load(res.message.room.id);
        if (wdata) {
            wdata.strategia = res.match[1];
            warspec.save(res.message.room.id, wdata);
        } else {
            res.reply("Non ho capito.")
        }
    });

    robot.respond(/strategia/i, function (res) {
        res.reply(warspec.status(res.message.room.id));
    });

    robot.respond(/status/i, function (res) {
        return status(res, load(robot));
    });

    robot.respond(/reset/i, function (res) {
        if (res.message.user.name === 'paraflu') {
            return robot.rabin.remove('userlist');
        }
    });

    robot.respond(/quando vedi @(\w*) (digli|di|dille) (.*)$/, function (res) {
        var usrname = res.match[1];
        segreteria.inviaMessaggio(username, res.message.username, res.match[3]);
        segreteria.save();
        res.reply("Messaggio per " + usrname + " archiviato.");
    });

    robot.respond(/messaggi per me|ci sono messaggi|hai messaggi/, function (res) {
        res.reply(segreteria.getMessages(res.message.username.name));
    });

    robot.respond(/cancella messaggi/, function (res) {
        segreteria.empty(res.message.username.name);
    });
};