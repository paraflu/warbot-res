Helper = require('hubot-test-helper')
# helper loads all scripts passed a directory
helper = new Helper('../scripts')


co     = require('co')
expect = require('chai').expect
moment = require('moment')

describe 'warbot-res', ->

  beforeEach ->
    @room = helper.createRoom()

  afterEach ->
    @room.destroy()

  context 'user says hi to hubot', ->
    beforeEach ->
      co =>
        yield @room.user.say 'alice', '@hubot ciao'
        yield @room.user.say 'bob',   '@hubot ciao'

    it 'should reply to user', ->
      expect(@room.messages).to.eql [
        ['alice', '@hubot ciao']
        ['hubot', '@alice ciao alice']
        ['bob',   '@hubot ciao']
        ['hubot', '@bob ciao bob']
      ]

  context "verifica status", ->
    beforeEach ->
      co =>
        yield @room.user.say 'alice', '@hubot status'

    it 'deve rispondere che non c\'è nessuna war attiva', ->
      expect(@room.messages).to.eql [
        ['alice', '@hubot status']
        ['hubot', '@alice Nessuna war in corso.']
      ]
  context "avvia war", ->
    beforeEach ->
      co =>
        yield @room.user.say 'alice', '@hubot avvia war'
        yield @room.user.say 'bob', '@hubot avvia war'

    it 'deve chiedere a che ora avviarla', ->
      expect(@room.messages).to.eql [
        ['alice', '@hubot avvia war']
        ['hubot', '@alice Ok, quando la lanci?']
        ['bob', '@hubot avvia war']
        ['hubot', "@bob undefined la sta avviando... messaggio delle " + moment().format('LT l')]
      ]

