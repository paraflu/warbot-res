Helper = require('hubot-test-helper')
# helper loads all scripts passed a directory
helper = new Helper('./scripts')

# helper loads a specific script if it's a file
# scriptHelper = new Helper('./scripts/specific-script.coffee')

co     = require('co')
expect = require('chai').expect

describe 'hello-world', ->

  beforeEach ->
    @room = helper.createRoom()

  afterEach ->
    @room.destroy()

  context "l'utente saluta il canale'", ->
    beforeEach ->
      co =>
        yield @room.user.say 'paraflu', 'ciao'
        yield @room.user.say 'bob',   '@hubot ciao'

    it 'should reply to user', ->
      expect(@room.messages).to.eql [
        ['alice', '@hubot ciao']
        ['hubot', '@alice ciao']
        ['bob',   '@hubot ciao']
        ['hubot', '@bob ciao']
      ]