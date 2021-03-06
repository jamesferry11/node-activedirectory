'use strict'
/* eslint-env mocha, chai */

const expect = require('chai').expect
const ActiveDirectory = require('../index').promiseWrapper
const config = require('./config')

let server = require('./mockServer')

describe('Promised getGroupMembershipForUser Method', function () {
  let ad
  const settings = require('./settings').getGroupMembershipForUser

  before(function (done) {
    server(function (s) {
      ad = new ActiveDirectory(config)
      server = s
      done()
    })
  })

  describe('#getGroupMembershipForUser()', function () {
    settings.users.forEach((user) => {
      ['dn', 'userPrincipalName', 'sAMAccountName'].forEach((attr) => {
        const len = user.members.length
        it(`should return ${len} groups for ${attr}`, function (done) {
          ad.getGroupMembershipForUser(user[attr])
            .then((groups) => {
              expect(groups.length).to.gte(user.members.length)

              const groupNames = groups.map((g) => {
                return g.cn
              })
              user.members.forEach((g) => {
                expect(groupNames).to.contain(g)
              })

              done()
            })
            .catch((err) => {
              console.log(err)
              done()
            })
        })
      })
    })

    it('should return empty groups if groupName doesn\'t exist', function (done) {
      ad.getGroupMembershipForUser('!!!NON-EXISTENT GROUP!!!')
        .then((groups) => {
          expect(groups).to.be.an.instanceof(Array)
          expect(groups.length).to.equal(0)
          done()
        })
        .catch(done)
    })

    it('should return default group attributes when not specified', function (done) {
      const defaultAttributes = [ 'objectCategory', 'distinguishedName', 'cn', 'description' ]
      const user = settings.users[0]
      ad.getGroupMembershipForUser(user.userPrincipalName)
        .then((groups) => {
          expect(groups).to.not.be.undefined

          groups.forEach((g) => {
            const keys = Object.keys(g)
            defaultAttributes.forEach((attr) => {
              expect(keys).to.contain(attr)
            })
          })

          done()
        })
        .catch(done)
    })
  })

  describe('#getGroupMembershipForUser(opts)', function () {
    it('should return only requested attributes', function (done) {
      const opts = {
        attributes: [ 'createTimeStamp' ]
      }
      const user = settings.users[0]

      ad.getGroupMembershipForUser(opts, user.userPrincipalName)
        .then((groups) => {
          expect(groups).to.not.be.undefined
          expect(groups.length).to.gte(user.members.length)

          groups.forEach((g) => {
            const keys = Object.keys(g)
            keys.forEach((attr) => {
              expect(opts.attributes).to.contain(attr)
            })
          })

          done()
        })
        .catch((err) => {
          console.log(err)
          done()
        })
    })
  })
})

