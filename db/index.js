const fs = require('fs')

module.exports = new db()

function db() {

    let self = this

    self.getLoh = () => {
        return JSON.parse(fs.readFileSync(__dirname + '/loh.json', 'utf-8'))
    }

    self.setLoh = (id) => {
        let loh = self.getLoh()
        let date = new Date()
        let dateString =
        ''+(date.getDay() < 10 ? '0'+date.getDay() : date.getDay() ) +
        (date.getDate() < 10 ? '0'+date.getDate() : date.getDate() )+
        (''+date.getFullYear()).slice(2)
        loh.history[dateString] = loh.current

        console.log('hmm')
    }
}