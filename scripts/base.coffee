# Description:
#   Coc war bot
#
# Commands:
#   hubot avvia war - programma una war.
#   hubot cancella war - cancella una war programmata.
#   hubot quando vedi <username> digli che <msg> - invia un messaggio quando online
#   hubot ci sono messaggi - invia i messaggi in segreteria

#   hubot avvisa tutti <messaggio> - invia un `messaggio` a tutti gli utenti. 

moment = require('moment')



moment.locale('it')
module.exports = (robot) ->
  lastwar = undefined

  save = (robot, warspec) ->
    robot.brain.set('warspec', warspec)

  load = (robot) ->
    return robot.brain.get('warspec')
  
  # userlist = (roomid) ->
  
  #    robot.emit('telegram:invoke', 'users.getUsers', { chat_id:roomit }, function (error, response) {
  #           robot.logger.debug(error);
  #           robot.logger.debug(response);
  #       });

  status = (res, warspec) ->
    inizio = moment(warspec.start_at)
    fine_preparativi = moment(warspec.start_at).add(24,'h')
    fine_war = moment(fine_preparativi).add(24,'h')
    ora = moment()
    if (ora < inizio)
      res.send "C'è la war programmata da #{warspec.user.username} per le #{moment(warspec.start_at).format('LT l')}"
    else if ora < fine_preparativi
      res.send "E' in corso una war, è il giorno dei preparativi, termina alle #{fine_preparativi.format('LT l')}"
    else if ora < fine_war
      res.send "E' il giorno degli eroi, ancora #{fine_war.fromNow()}"
    else
      res.send "La war è finita alle #{fine_war.format('LT l')}"
    
    if warspec.strategia
      res.send "Tattica: #{warspec.strategia}"

  robot.hear /.*/, (res) ->
     # log utenti
     usrs = robot.brain.get('userlist')
     if (!usrs) 
       usrs = []
     usrs[res.message.user.id] = res.message.user
     robot.brain.set 'userlist', usrs

  robot.respond /debug/, (res) ->
    res.reply "war data", JSON.stringify(load(robot))
    res.reply "users", robot.brain.get('userlist')

  robot.respond /(avvia|programma) (war|guerra) alle (\d+)/i, (res) ->
    warspec = load(robot)
    if warspec
      res.reply "#{warspec.user.username} la sta avviando... messaggio delle #{moment(warspec.when).format('LT l')}"
    else
      warspec = { user: res.message.user, when: new Date(), start_at: moment(res.match[3], 'h').toDate() } 
      res.reply "Ok, progammata per le #{moment(warspec.start_at).format('LT l')}!"
      save(robot, warspec)
    
  robot.respond /start war|avvia (war|guerra)$|avviamo.*war$/i, (res) ->
    warspec = load(robot)
    if !warspec 
      warspec = { user: res.message.user, when: new Date() } 
      res.reply "Ok, quando la lanci?"
    else
      res.reply "#{warspec.user.username} la sta avviando... messaggio delle #{moment(warspec.start_at).fromNow()}"
    
  robot.respond /alle (\d+)/i, (res) ->
    warspec = load(robot)
    if (warspec && res.message.user.id == warspec.user.id) 
      warspec.start_at = moment(res.match[1],'h').toDate()
      res.reply "ok #{res.message.user.username} avviamo alle #{moment(warspec.start_at).format('LT di l')}"
      save(robot, warspec)
    else
      res.reply "Nessuna war programmata."

  robot.respond /cancella war/i, (res) ->
    warspec = load(robot)
    if (!warspec)
      res.reply "non ci sono guerre in programma..."
    else 
      res.reply "Ok!"
      warspec = undefined
      robot.brain.remove('warspec')

  robot.respond /(guerra|war) in (programma|previsione)|(guerra|war) programmata/i, (res) ->
    warspec = load(robot)
    
    if warspec
      status res, warspec
    else
      res.reply "Nessuna war in programma."


  robot.respond /avvisa tutti che (.*)$/i, (res) ->
    msg = res.match[1]
    sender = res.message.user
    usrs = robot.brain.get('userlist')
    for own key, usr of usrs
        robot.logger.debug "avvisa #{usr.username}"
        res.send "@#{usr.username} > #{msg} from #{sender.name}"

  robot.respond /quanto manca/i, (res) ->
    warspec = load(robot)
    if (!warspec)
      res.reply "Non c'è nessuna war avviata."
      return
    status res, warspec

  robot.hear /ciao/i, (res) ->
    # robot.logger.debug res.message.user
    res.reply "ciao #{res.message.user.username}"
    usr = res.message.user
    segreteria = robot.brain.get('segreteria')
    if (segreteria && segreteria[usr.name] && segreteria[usr.name].length > 0)
      res.reply "ho #{segreteria[usr.name].length} messaggi per te!"

  robot.respond /la strategia è (.*)/, (res) ->
    warspec = load(robot)
    warspec.strategia = res.match[1]
    status res, warspec

  robot.respond /strategia?$/, (res) ->
    warspec = load(robot)
    status res, warspec

  robot.respond /status/, (res) ->
    status res, load(robot)
 
 
  robot.respond /quando vedi @(\w*) (digli|di|dille) (.*)$/, (res) ->
    segreteria = robot.brain.get('segreteria')
    if (!segreteria) 
      segreteria = []
    
    usrname = res.match[1]
    msg = res.match[3]
    if (!segreteria[usrname])
      segreteria[usrname] = []
    segreteria[usrname].push {from: res.message.user, msg: msg, when: new Date()}

    robot.brain.set('segreteria', segreteria)
    res.reply "Messaggio per #{usrname} archiviato."
    robot.logger.debug segreteria

  robot.respond /messaggi per me|ci sono messaggi|hai messaggi/, (res) ->
    segreteria = robot.brain.get('segreteria')
    if !segreteria 
      res.reply "Nessun messaggio."
      return

    me = res.message.user.name
    robot.logger.debug segreteria[me]
    if !segreteria[me] || segreteria[me].length == 0
      res.reply "Nessun messaggio"
      return

    for msg in segreteria[me]
      res.reply "- Messaggio da #{msg.from.name} delle #{moment(msg.when).format('LT l')}: #{msg.msg}."

  robot.respond /cancella messaggi/, (res) ->
    segreteria = robot.brain.get('segreteria')
    if !segreteria 
      res.reply "Nessun messaggio."
      return

    me = res.message.user.name
    robot.logger.debug segreteria[me]
    if !segreteria[me] || segreteria[me].length == 0
      res.reply "Nessun messaggio"
      return 

    res.reply "#{segreteria[me].length} messaggi cancellati."
    delete segreteria[me] 