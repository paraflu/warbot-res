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
    util = require('util');

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
        // if (!this.data) {
        //     this.data = this.load();
        // }
        // self.bot.logger.debug("self.data " + self.data  + " self.data[usr.name] " + self.data[usr]);
        if (!self.data || !self.data[usr]) {
            return false;
        }
        if (!all && self.data[usr].read) {
            return false;
        }
        return self.data[usr];
    }

    this.readAll = function (usr) {
        // if (!this.data) {
        //     this.data = this.load();
        // }
        if (self.messageForMe(usr)) {
            self.data[usr].read = true;
        }
    }

    this.getMessages = function (user, all) {
        var msgs = self.messageForMe(user, all).messages;
        if (!msgs) {
            return "Nessun messaggio";
        }
        var msg = "";
        for (var i = 0; i < msgs.length; i++) {
            var it = msgs[i];
            msg += (it.letto ? "*" : " ") +
                " da: " + it.from + " il " + moment(it.when).format("LT l") + "\n" +
                it.message;
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
    this.warspecs = [];

    this.load = function (roomid) {
        var wdata = self.bot.brain.get('warspec');

        if (!wdata || wdata == "") {
            self.warspecs = [];
        } else {
            self.warspecs = JSON.pars(wdata);
        }

        if (roomid) {
            return self.warspcs[roomid];
        }
    }

    this.save = function (id, data) {
        self.bot.logger.debug("save" + id + "=" + data);
        if (id !== undefined) {
            self.warspecs[id] = data;
        }
        self.bot.logger.debug('warspec.save ',self.warspecs);
        self.bot.brain.set('warspec', JSON.stringify(self.warspecs));
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
        // if (!self.warspecs) {
        //     this.load();
        // }

        var data = self.warspecs[roomid];
        if (!data) {
            return "Nessuna war in corso.";
        }

        var inizio = moment(data.start_at);
        var fine_preparativi = moment(data.start_at).add(23, 'h');
        var fine_war = moment(fine_preparativi).add(24, 'h');
        var ora = moment();
        var msg = "";
        if (ora < inizio) {
            msg += "C'è la war programmata da " + data.user + " per le " + (moment(data.start_at).format('LT l')) + "\n";
        } else if (ora < fine_preparativi) {
            msg += "E' in corso una war, è il giorno dei preparativi, termina alle " + (fine_preparativi.format('LT l')) + "\n";
        } else if (ora < fine_war) {
            res += "E' il giorno degli eroi, ancora " + fine_war.format('LT l') + "\n";
        } else {
            msg += "La war è finita alle " + (fine_war.format('LT l')) + "\n";
        }
        if (data.strategia) {
            msg += "Tattica: " + data.strategia + "\n";
        }
        return msg;
    }

    this.toString = function () {
        return "warspec.class:" + this.warspecs;
    }

    // robot.logger.debug("load>");
    self.warspecs = this.load();
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
        var usr = res.message.user;
        // robot.logger.debug("usr", res.message);
        if (segreteria.messageForMe(usr.name)) {
            res.reply("Ci sono messaggi per te!\n" +
                segreteria.getMessages(usr.name));
            segreteria.readAll(usr.name);
        } else {
            // res.reply("Nessun messaggio. " + self.segreteria.toString());
        }
    });

    robot.respond(/messaggi per me|ci sono messaggi|hai messaggi/i, function (res) {
        var segreteria = new Segreteria(robot);
        res.reply(segreteria.getMessages(res.message.user.name, true));
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
        var wdata = warspec.load(res.message.room);
        if (wdata) {
            res.reply(wdata.user + " la sta avviando...");
        } else {
            var ws = {
                user: res.message.user.name,
                when: new Date(),
                start_at: moment(res.match[3], 'h').toDate()
            };
            res.reply("Ok, progammata per le " + (moment(ws.start_at).format('LT l')) + "!");
            warspec.save(res.message.room, ws);
        }
    });

    robot.respond(/start war|avvia (war|guerra)$|avviamo.*war$/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.load(res.message.room);
        if (!wdata) {
            wdata = {
                user: res.message.user.name,
                when: new Date()
            };
            res.reply("Ok, quando la lanci?");
            warspec.save(res.message.room, wdata);
        } else {
            res.reply(wdata.user + " la sta avviando... messaggio delle " + (moment(wdata.start_at).format('LT l')));
        }
    });

    robot.respond(/alle (\d+)/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.load(res.message.room);
        if (wdata) {
            wdata.start_at = moment(res.match[1], 'h').toDate();
            res.reply("ok " + res.message.user + " avviamo alle " + (moment(wdata.start_at).format('LT l')));
            warspec.save(res.message.room, wdata);
        } else {
            res.reply("Nessuna war programmata.");
        }
    });

    robot.respond(/cancella war/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.load(res.message.room);
        if (!wdata) {
            res.reply("non ci sono guerre in programma...");
        } else {
            res.reply("Ok!");
            warspec.remove(res.message.room);
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
        var segreteria = new Segreteria(robot);
        var msg = "ciao " + res.message.user.name;
        if (segreteria.messageForMe(res.message.user.name)) {
            msg += segreteria.getMessages(res.message.user.name);
            // self.segreteria.readAll(res.message.user.name)
        }
        res.reply(msg);
    });

    robot.respond(/la strategia è (.*)/i, function (res) {
        var warspec = new WarSpec(robot);
        var wdata = warspec.load(res.message.room);
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
        var db = segreteria.messageForMe(res.message.user.name);
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
    })
};