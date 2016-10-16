//  Description:
//    Coc war bot
//  Commands:
//    hubot avvia war alle <ora> - programma una war per l'ora indicata.
//    hubot la strategia è <msg> - archivia un messaggi per la tattica generica
//    hubot cancella war - cancella una war programmata.
//    hubot quando vedi <username> digli che <msg> - invia un messaggio quando online
//    hubot cancella messaggi - cancella messaggi per me


//    hubot avvisa tutti <messaggio> - invia un `messaggio` a tutti gli utenti.
//    hubot ci sono messaggi - invia i messaggi in self.segreteria 

var hasProp = {}.hasOwnProperty;

var moment = require('moment'),
    _ = require('lodash'),
    util = require('util'),
    clashApi = require('clash-of-clans-api'),
    sprintf = require('sprintf-js').sprintf;


moment.locale('it');

function Segreteria(robot) {

    var self = this;
    this.data = [];
    this.key = 'segreteria';
    this.bot = robot;

    this.save = function () {
        self.bot.brain.set(self.key, JSON.stringify(self.data));
        // self.bot.logger.debug('segreteria.save', JSON.stringify(self.data));
        self.bot.brain.save();
    }

    this.load = function () {
        // self.bot.logger.debug("segreteria.load: ", JSON.stringify(self.bot.brain.get(self.key)));
        var loaded = self.bot.brain.get(self.key);
        if (!loaded || loaded == "") {
            return {};
        }
        return JSON.parse(loaded);
    }

    this.messageForMe = function (usr, all) {
        if (!self.data || !self.data[usr]) {
            return false;
        }
        if (!all && self.data[usr].read) {
            return false;
        }
        return self.data[usr];
    }

    this.readAll = function (usr) {
        self.data[usr].read = true;
    }

    this.getMessages = function (user, all) {
        var msgs = self.messageForMe(user, all).messages;
        if (!msgs) {
            return "Nessun messaggio";
        }
        var msg = "";
        for (var i = 0; i < msgs.length; i++) {
            var it = msgs[i];
            msg += moment(it.when).format("LT l") + ": " + (it.letto ? "*" : " ") +
                it.from + " mi ha chiesto di riferirti " +
                it.message + ".\n";
        }
        return msg;
    };

    this.empty = function (username) {
        // if (!this.data) {
        //     this.data = this.load();
        // }
        if (self.getMessages(username)) {
            // self.bot.logger.debug("empty");
            delete self.data[username];
            self.save();
        }
    }

    this.inviaMessaggio = function (destinatario, mittente, messaggio) {
        // if (!this.data) {
        //     this.data = this.load();
        // }

        if (!self.data[destinatario]) {
            self.data[destinatario] = { read: true, messages: [] }
        }

        msgs = self.data[destinatario];
        msgs.messages.push({ read: false, message: messaggio, when: new Date(), from: mittente });
        msgs.read = false;

        self.data[destinatario] = msgs;

        // self.bot.logger.debug("invia messaggio" , self.data);

        self.save();
        // self.bot.logger.debug("invia messaggio dopo save", self.data);


    }

    this.toString = function () {
        // if (!this.data) {
        //     this.data = this.load();
        // }
        return "Segreteria.class:" + this.data;
    }

    this.data = this.load();
}

function WarSpec(robot) {
    var self = this;
    this.bot = robot;
    this.warspecs = {};

    this.load = function () {
        // var wdata = self.bot.brain.get('warspec');
        // var wspecs = {};
        // if (!wdata || wdata == "") {
        //     wspecs = {};
        // } else {
        //     wspecs = JSON.parse(wdata);
        // }

        // if (roomid) {
        //     return wspecs[roomid];
        // } else {
        //     return wspecs;
        // }
        self.warspecs = self.bot.brain.get('war.spec') || {};
        self.bot.logger.debug("load:", self.warspecs);
    }

    this.save = function () {
        // self.bot.logger.debug("warspec type " + typeof(self.warspecs));
        // if (id !== undefined) {
        //     self.warspecs[id] = data;
        //     self.bot.logger.debug("save", JSON.stringify(self.warspecs[id]),
        //         " json ", JSON.stringify(self.warspecs));
        // }
        // self.bot.logger.debug('warspec.save ',JSON.stringify(self.warspecs));
        // self.bot.brain.set('warspec', JSON.stringify(self.warspecs));
        // self.bot.brain.save();
        self.bot.logger.debug("warspecs:", JSON.stringify(self.warspecs));
        self.bot.brain.set('war.spec', self.warspecs);
        self.bot.brain.save();
    }

    this.remove = function (id) {
        // if (!self.warspecs) {
        //     self.warspecs = this.load();
        // }
        if (self.warspecs[id]) {
            delete self.warspecs[id];
            this.save();
        }
    }

    this.status = function (roomid) {
        var data = self.warspecs[roomid];
        if (!data) {
            return "Nessuna war in corso.";
        }

        var inizio = moment(data.start_at);
        var fine_preparativi = moment(data.start_at).add(23, 'h');
        var fine_war = moment(data.start_at).add(24+23, 'h');
        var ora = moment();
        var msg = "";
        if (ora < inizio) {
            msg += "C'è la war programmata da " + data.user + " per le " + (moment(data.start_at).format('LT l')) + ". Fine della giornata dei preparativi alle " +
                fine_preparativi.format("dddd H:mm") + " fine della war alle " + fine_war.format("LT l") + ". ";
        } else if (ora < fine_preparativi) {
            msg += "E' in corso una war, è il giorno dei preparativi, termina alle " + (fine_preparativi.format('LT l')) + ".\n";
        } else if (ora < fine_war) {
            res += "E' il giorno degli eroi, ancora " + fine_war.format('LT l') + ".\n";
        } else {
            msg += "La war è finita alle " + (fine_war.format('LT l')) + ".\n";
        }
        if (data.strategia) {
            msg += "*Tattica*: " + data.strategia + "\n";
        } else {
            msg += "Nessuna tattica indicata per ora."
        }
        return msg;
    }

    this.add = function (id, data) {
        self.warspecs[id] = data;
    }

    this.get = function (id) {
        return self.warspecs[id] || false;
    }

    this.watchclock = function (id) {
        var data = self.warspecs[id];
        var inizio = moment(data.start_at);
        var fine_preparativi = moment(data.start_at).add(23, 'h');
        var fine_war = moment(data.start_at).add(24+23, 'h');
        var ora = moment();

        var duration = {
            inizio_war: moment.duration(inizio.diff(ora)),
            fine_preparativi: moment.duration(fine_preparativi.diff(ora)),
            fine_war: moment.duration(fine_war.diff(ora))
        };
        return (duration);
    }

    this.toString = function () {
        return "warspec.class:" + this.warspecs;
    }

    // robot.logger.debug("load>");
    this.load();
    // robot.logger.debug(self.warspecs);
}


function DbCommand(robot) {
    var bot = robot;
    this.set = function (key, value) {
        bot.brain.set(key, value);
    }
    this.get = function (key) {
        return bot.brain.get(key);
    }
    this.save = function () {
        bot.brain.save();
    }
}

module.exports = function (robot) {

    // this.segreteria = new Segreteria(robot);
    // this.warspec = new WarSpec(robot);
    var self = this;
    var uptime = moment();

    robot.error(function (err, res) {
        robot.logger.error(err);
        if (res != null) {
            res.reply("`Error: " + err + "`");
        }
    });

    robot.respond(/.*/, function (res) {
        var segreteria = new Segreteria(robot);
        var warspec = new WarSpec(robot);
        var usr = res.message.user;
        // robot.logger.debug("usr", res.message);
        var wdata = warspec.get(res.message.room);
        var lastwarning = robot.brain.get('reminder') || {};
        var roomid = res.message.room;
        var ora = moment();
        if (wdata) {
            var difference = warspec.watchclock(res.message.room);
            robot.logger.info(lastwarning[roomid]);
            if (!lastwarning[roomid] || (lastwarning[roomid].add(15, 'minute') < ora) || difference.fine_war.asHours() < 1) {
                lastwarning[roomid] = moment();
                var msg = "*Vorrei ricordare a tutti che mancano " ;
                if (difference.inizio_war.asHours() > 0) {
                    msg += Math.floor(difference.inizio_war.asHours()) + " ore all'inizio del giorno dei preparativi.";
                } else if (difference.fine_preparativi.asHours() > 0) {
                    msg += Math.floor(difference.fine_preparativi.asHours()) + " ore alla fine del giorno dei preparativi.";
                } else {
                    if (difference.fine_war.asHours() > 1) {
                        msg += Math.floor(difference.fine_war.asHours()) + " ore alla fine della war.";
                    } else {
                        msg += Math.floor(difference.fine_war.asHours()) + " minuti alla fine della war.";
                    }
                    
                }
                res.reply( msg + "*");
                robot.brain.set('reminder', lastwarning);
                robot.brain.save();
            }
        }
        if (segreteria.messageForMe(usr.name, false)) {
            res.reply("Ci sono messaggi per te!\n" +
                segreteria.getMessages(usr.name));
            segreteria.readAll(usr.name);
            segreteria.save();
        } else {
            // res.reply("Nessun messaggio. " + self.segreteria.toString());
        }
    });

    robot.respond(/messaggi|messaggi per me|ci sono messaggi|hai messaggi/i, function (res) {
        var segreteria = new Segreteria(robot);
        res.reply("Si eccoli:\n" + segreteria.getMessages(res.message.user.name, true));
        // self.segreteria.readAll(res.message.user.name);
    });


    robot.respond(/debug\s*(.*)/i, function (res) {
        var segreteria = new Segreteria(robot);
        var warspec = new WarSpec(robot);
        if (res.match[1] == "messaggi") {
            res.reply(segreteria.data);
            return;
        }
        // robot.logger.debug(warspec.warspecs);
        // robot.logger.debug(segreteria.data);
        res.reply("`warspec: " + warspec.toString() + ", segreteria: " + segreteria.data + "`");
    });

    robot.respond(/(avvia|programma) (war|guerra) alle (\d+)/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.get(res.message.room);
        if (wdata) {
            res.reply(wdata.user + " la sta avviando...");
        } else {
            var startAt = moment(res.match[3], 'h');
            if (startAt < moment()) {
                startAt.add(1, 'day');
            }
            var ws = {
                user: res.message.user.name,
                when: new Date(),
                start_at: startAt.toDate()
            };
            robot.logger.debug("prima del save");
            warspec.add(res.message.room, ws);
            warspec.save();
            res.reply("Ok, progammata per le " + (moment(ws.start_at).format('LT l')) + "!");
        }
    });

    robot.respond(/start war|avvia (war|guerra)$|avviamo.*war$/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.get(res.message.room);
        if (!wdata) {
            wdata = {
                user: res.message.user.name,
                when: new Date()
            };
            res.reply("Ok, quando la lanci?");
            warspec.add(res.message.room, wdata);
            warspec.save();
        } else {
            res.reply(wdata.user + " la sta avviando... messaggio delle " + (moment(wdata.start_at).format('LT l')));
        }
    });

    robot.respond(/alle (\d+)/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.get(res.message.room);
        if (wdata) {
            wdata.start_at = moment(res.match[1], 'h').toDate();
            res.reply("ok " + res.message.user + " avviamo alle " + (moment(wdata.start_at).format('LT l')));
            warspec.set(res.message.room, wdata);
        } else {
            res.reply("Nessuna war programmata.");
        }
    });

    robot.respond(/cancella war/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.get(res.message.room);
        if (!wdata) {
            res.reply("non ci sono guerre in programma...");
        } else {
            res.reply("Ok!");
            warspec.remove(res.message.room);
            warspec.save();
        }
    });

    robot.respond(/(guerr[ea]|war) in (programma|previsione|corso)|(guerra|war) programmata/i, function (res) {
        var warspec = new WarSpec(robot);
        res.reply(warspec.status(res.message.room));
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
        var warspec = new WarSpec(robot);
        res.reply(warspec.status(res.message.room));
    });

    robot.hear(/ciao/i, function (res) {
        if (!res.match["@warbotres"]) {
            var segreteria = new Segreteria(robot);
            if (segreteria.messageForMe(res.message.user.name)) {
                var msg = "ciao " + res.message.user.name + " ho dei messaggi per te!\n";
                msg += segreteria.getMessages(res.message.user.name);
                segreteria.readAll(res.message.user.name);
                res.reply(msg);
            }
        }
    });

    robot.respond(/ciao/i, function (res) {
        var segreteria = new Segreteria(robot);
        var msg = "ciao " + res.message.user.name;
        if (segreteria.messageForMe(res.message.user.name)) {
            msg += segreteria.getMessages(res.message.user.name);
            segreteria.readAll(res.message.user.name)
        }
        res.reply(msg);
    });

    robot.respond(/la strategia è (.*)/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.get(res.message.room);
        if (wdata) {
            wdata.strategia = res.match[1];
            warspec.save(res.message.room, wdata);
            res.reply("Ok, capito.");
        } else {
            res.reply("Non ho capito.")
        }
    });

    robot.respond(/strategia/i, function (res) {
        var warspec = new WarSpec(robot);
        res.reply(warspec.status(res.message.room));
    });

    robot.respond(/status/i, function (res) {
        var warspec = new WarSpec(robot);
        res.reply(warspec.status(res.message.room));
    });

    robot.respond(/uptime/i, function (res) {
        res.reply(uptime.fromNow());
    });

    robot.respond(/ci sei/i, function (res) {
        res.reply("si, si ... son qui dalle " + uptime.toNow());
    });

    robot.respond(/(quando|appena) vedi @(\w*) (digli|di|dille) (.*)$/i, function (res) {
        var username = res.match[2];
        var segreteria = new Segreteria(robot);
        segreteria.inviaMessaggio(username, res.message.user.name, res.match[4]);
        // self.segreteria.save();
        res.reply("Messaggio per " + username + " archiviato.");
    });


    robot.respond(/cancella messaggi/i, function (res) {
        var segreteria = new Segreteria(robot);
        var db = segreteria.messageForMe(res.message.user.name, true );
        if (db) {
            res.reply("Cancellati " + db.messages.length + " messaggi.");
            segreteria.empty(res.message.user.name);
        } else {
            res.reply("Nessun messaggio presente.");
        }
    });

    robot.respond(/set (\w+) (.*)$/i, function (res) {
        var db = new DbCommand(robot);
        var key = res.match[1];
        var value = res.match[2];
        db.set(key, value);
        res.reply("Ok.");
    });

    robot.respond(/get (\w+)/i, function (res) {
        var key = res.match[1];
        var db = new DbCommand(robot);
        var value = db.get(key);
        res.reply(key + "=" + value);
    });

    robot.respond(/save/, function (res) {
        var db = new DbCommand(robot);
        db.save();
        res.reply("Ok");
    });

    robot.respond(/clan_status/, function (res) {
        robot.logger.debug("TOKEN" + process.env.COCTOKEN);
        var client = clashApi({ token: process.env.COCTOKEN });
        client
            .clanMembersByTag('#9YLQ9PQP')
            .then(function (response) {
                var msg = "";
                response.items.forEach(function (it) {
                    msg += sprintf("#%d) %s (%d) +%d -%d (*%d*) \n", +it.clanRank, it.name, +it.expLevel, +it.donations,
                        +it.donationsReceived, +it.donations - it.donationsReceived);
                });
                res.reply(msg + "\n");
            })
            .catch(function (error) { res.reply("Errore:" + error) });
    });
};