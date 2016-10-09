# Description:
#   Coc war bot
#
# Commands:
#   hubot avvia war - programma una war
#   hubot cancella war - cancella una war programmata
#   hubot avvisa tutti <messaggio> - invia un messaggio a tutti gli utenti 
#
# Author:
#   spajus
#   vinta
#   m-seldin

moment = require('moment')

moment.locale('it')
module.exports = (robot) ->
  lastwar = undefined

  warspec = undefined

  robot.respond /avvia (war|guerra) alle (\d+)/i, (res) ->
    if warspec
      res.send "#{warspec.user.username} la sta avviando... messaggio delle #{moment(warspec.when).fromNow()}"
    else
      warspec = { user: res.message.user, when: new Date(), start_at: moment(res.match[3], 'h').toDate() } 
      res.send "Ok, progammata!"
    
  robot.respond /start war|avvia (war|guerra)|avviamo.*war/i, (res) ->
    if !warspec 
      warspec = { user: res.message.user, when: new Date() } 
      res.send "Ok, quando la lanci?"
    else
      res.send "#{warspec.user.username} la sta avviando... messaggio delle #{moment(warspec.start_at).fromNow()}"
    
  robot.respond /alle (\d+)/i, (res) ->
    if (warspec && res.message.user.id == warspec.user.id) 
      warspec.start_at = moment(res.match[1],'h').toDate()
      res.send "ok #{res.message.user.username} avviamo alle #{moment(warspec.start_at).fromNow()}"

  robot.respond /cancella war/i, (res) ->
    if (!warspec)
      res.send "non ci sono guerre in programma..."
    else 
      res.send "Ok!"
      warspec = undefined

  robot.respond /(guerra|war) in (programma|previsione)/i, (res) ->
    if warspec
      res.send "C'è la war programmata da #{warspec.user.username} per le #{moment(warspec.start_at).fromNow()}"
    else
      res.send "Nessuna war in programma."


  robot.respond /avvisa tutti che (.*)$/i, (res) ->
    msg = res.match[1]
    sender = res.message.user
    # robot.logger.debug 'response',res.message.room
    robot.logger.debug 'brain', robot.brain.data.users[res.message.room]
    for usr in robot.brain.data.users[res.message.room]
      robot.logger.debug "avvisa #{usr.username}"

  

  robot.hear /ciao/i, (res) ->
    # robot.logger.debug res.message.user
    res.send "ciao #{res.message.user.username}"
  # robot.hear /badger/i, (res) ->
  #   res.send "Badgers? BADGERS? WE DON'T NEED NO STINKIN BADGERS"
  #
  # robot.respond /open the (.*) doors/i, (res) ->
  #   doorType = res.match[1]
  #   if doorType is "pod bay"
  #     res.reply "I'm afraid I can't let you do that."
  #   else
  #     res.reply "Opening #{doorType} doors"
  #
  # robot.hear /I like pie/i, (res) ->
  #   res.emote "makes a freshly baked pie"
  #
  # lulz = ['lol', 'rofl', 'lmao']
  #
  # robot.respond /lulz/i, (res) ->
  #   res.send res.random lulz
  #
  # robot.topic (res) ->
  #   res.send "#{res.message.text}? That's a Paddlin'"
  #
  #
  # enterReplies = ['Hi', 'Target Acquired', 'Firing', 'Hello friend.', 'Gotcha', 'I see you']
  # leaveReplies = ['Are you still there?', 'Target lost', 'Searching']
  #
  # robot.enter (res) ->
  #   res.send res.random enterReplies
  # robot.leave (res) ->
  #   res.send res.random leaveReplies
  #
  # answer = process.env.HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING
  #
  # robot.respond /what is the answer to the ultimate question of life/, (res) ->
  #   unless answer?
  #     res.send "Missing HUBOT_ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING in environment: please set and try again"
  #     return
  #   res.send "#{answer}, but what is the question?"
  #
  # robot.respond /you are a little slow/, (res) ->
  #   setTimeout () ->
  #     res.send "Who you calling 'slow'?"
  #   , 60 * 1000
  #
  # annoyIntervalId = null
  #
  # robot.respond /annoy me/, (res) ->
  #   if annoyIntervalId
  #     res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
  #     return
  #
  #   res.send "Hey, want to hear the most annoying sound in the world?"
  #   annoyIntervalId = setInterval () ->
  #     res.send "AAAAAAAAAAAEEEEEEEEEEEEEEEEEEEEEEEEIIIIIIIIHHHHHHHHHH"
  #   , 1000
  #
  # robot.respond /unannoy me/, (res) ->
  #   if annoyIntervalId
  #     res.send "GUYS, GUYS, GUYS!"
  #     clearInterval(annoyIntervalId)
  #     annoyIntervalId = null
  #   else
  #     res.send "Not annoying you right now, am I?"
  #
  #
  # robot.router.post '/hubot/chatsecrets/:room', (req, res) ->
  #   room   = req.params.room
  #   data   = JSON.parse req.body.payload
  #   secret = data.secret
  #
  #   robot.messageRoom room, "I have a secret: #{secret}"
  #
  #   res.send 'OK'
  #
  # robot.error (err, res) ->
  #   robot.logger.error "DOES NOT COMPUTE"
  #
  #   if res?
  #     res.reply "DOES NOT COMPUTE"
  #
  # robot.respond /have a soda/i, (res) ->
  #   # Get number of sodas had (coerced to a number).
  #   sodasHad = robot.brain.get('totalSodas') * 1 or 0
  #
  #   if sodasHad > 4
  #     res.reply "I'm too fizzy.."
  #
  #   else
  #     res.reply 'Sure!'
  #
  #     robot.brain.set 'totalSodas', sodasHad+1
  #
  # robot.respond /sleep it off/i, (res) ->
  #   robot.brain.set 'totalSodas', 0
  #   res.reply 'zzzzz'
