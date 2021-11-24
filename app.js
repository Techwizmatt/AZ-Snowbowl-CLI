#! /usr/bin/env node --no-warnings
const chalk = require("chalk")
const osmosis = require('osmosis')

function doGetAllSnowbowlLifts () {
    const lifts = []

    return new Promise((resolve, reject) => {
        osmosis.get('https://www.snowbowl.ski/snow-report/')
            .find('#sr-tab-content-2 .lift-deets > li')
            .set(
                {
                    name: '.header .lift-deets-left',
                    desc: '.header .lift-deets-left span',
                    hours: '.header .lift-deets-right',
                    status: '.header .lift-deets-right',
                    trails: [
                        osmosis.find('.trails-for-lift > li')
                            .set({
                                name: '.lift-deets-left',
                                status: '.lift-deets-right',
                                level: '.lift-deets-left img@alt'
                            })
                    ]
                }
            ).data(lift => {

                const trails = lift.trails.map(trail => {
                    return {
                        name: trail.name,
                        status: trail.status,
                        open: trail.status != 'Closed',
                        level: trail.level
                    }
                })

                lifts.push(
                    {
                        name: lift.name.substring(0, lift.name.indexOf('\t')),
                        description: lift.desc,
                        hours: lift.hours.substring(0, lift.hours.indexOf('\t')).trim().replace(' -', '-'),
                        status: lift.status.substring(lift.status.indexOf('\t'), lift.status.length).trim(),
                        trails: trails
                    }
                )
        }).then(_ => {
            if (lifts.length >= 1) resolve(lifts)
            reject(new Error('No lifts found'))
        })
    })
}

doGetAllSnowbowlLifts().then(lifts => {
    const openTrails = []
    const difficulties = {}

    lifts.forEach(lift => {
        lift.trails.forEach(trail => {
            if (trail.open) {

                object = {
                    lift: lift.name,
                    trail: {
                        name: trail.name,
                        difficulty: trail.level
                    }
                }

                if (!(lift.status != 'Closed')) {
                    object.notice = 'Lift Closed'
                }

                openTrails.push(object)

                difficulties[trail.level] = typeof(difficulties[trail.level]) === 'undefined' ? 1 : difficulties[trail.level] + 1
            }
        })
    })

    if (openTrails.length >= 1) {
        const diffKeyList = Object.keys(difficulties)

        console.log(`There are ${chalk.cyan.bold(openTrails.length)} trail(s) ${chalk.green.bold('open')} right now.`)

        diffKeyList.forEach(diffKey => {
            switch (difficulties[diffKey]) {
                case 1:
                    console.log(`${chalk.cyan.bold(difficulties[diffKey])} trail is ${chalk.magenta.bold(diffKey)}`)
                    break
                default:
                    console.log(`${chalk.cyan.bold(difficulties[diffKey])} trails are ${chalk.magenta.bold(diffKey)}`)
                    break
            }
        })

        console.log(openTrails)
    } else {
        console.log(chalk.red('No trails currently open'))
    }
})
