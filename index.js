const Discord = require('discord.js')
const ytdl = require('ytdl-core')
const YouTube = require('youtube-node');
const randomColor = require('randomcolor')

const db = require('./db')
const cfg = require('./config.js')

const yt = new YouTube()
const client = new Discord.Client({autoReconnect: false, max_message_cache: 0})


 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 // FUNCTIONS & VARIABLES
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function emoji(name) {
  return client.emojis.find('name', name)
}

function formatSong(msg, info) {

  let id = ( info.id.videoId ? info.id.videoId : info.id)
  let duration = {
    total: 0,
    h: '00',
    m: '00',
    s: '00'
  }

  info.contentDetails.duration.match(/\d*[HMS]/g).forEach(i => {

    let char = i.slice(-1)
    i = i.slice(0,-1)

    if (i.length == 1) i = '0' + i
    else               i = i

    if      ( char === 'H' ) duration.h = i
    else if ( char === 'M' ) duration.m = i
    else if ( char === 'S' ) duration.s = i
  })

  duration.total += (+duration.h)*3600 + (+duration.m)*60 + (+duration.s)

  return {
    id: id,
    url:       `https://www.youtube.com/watch?v=${id}`,
    title:     info.snippet.title,
    thumbnail: info.snippet.thumbnails.default.url,
    duration:  duration,
    author: {
      username: msg.author.username,
      id: msg.author.id,
      avatar: msg.author.avatar
    }
  }
}

function musicEmbed(action, song) {
  let embed = new Discord.RichEmbed()

  let authorUrl = `https://cdn.discordapp.com/avatars/${song.author.id}/${song.author.avatar}.png`
  let duration = `*${song.duration.h}* : *${song.duration.m}* : *${song.duration.s}*`

  if (action === 'np') {
    embed
    .setColor('#72F522')
    .setAuthor(`${song.author.username} PLAYING`, authorUrl)
    .setTitle(song.title.toUpperCase())
    .setURL(song.url)
    .setThumbnail(song.thumbnail)
    .setDescription(`${duration}`)
  } else if (action === 'skip') {
    embed
    .setColor('#F22F41')
    .setAuthor(`${song.author.username} skiped`, authorUrl)
    .setTitle(song.title.toUpperCase())
    .setURL(song.url)
    // .setThumbnail(song.thumbnail)
  } else if (action === 'order') {
    // console.log('order')
    embed
    .setColor('#FFFFFF')
    .setAuthor(`${song.author.username} ordered`, authorUrl)
    .setTitle(song.title.toUpperCase())
    .setURL(song.url)
    .setThumbnail(song.thumbnail)
    .setDescription(`${duration}`)
  } else if (action === 'empty') {
    embed
    .setAuthor(`${song.author.username} skiped`, authorUrl)
    .setTitle('Abyssalistic abyssaloiusness abyss')
    .setColor('#333333')
    .setURL(song.url)
  }

  return embed
}

function lg(...args) {
  console.log(args)
}

let intId
let queue = {}
let commands = {}
commands.music = {
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  start: msg => {

    queue[msg.guild.id].playing = true
    let dispatcher
    let np
    const voiceChannel = msg.member.voiceChannel
    // const textChannel = msg.member.textChannel

    function play(song) {
      // if (!queue[msg.guild.id].songs.length) return msg.channel.send(musicEmbed('empty', song)).then(() => {
      //   queue[msg.guild.id].playing = false
      //   msg.channel.setTopic(`Peaceful place without noise`)
      // })
      
      msg.channel.setTopic(`np: ${song.title}`)

      msg.member.voiceChannel.join().then(connection => {
        
        let np = msg.channel.send(musicEmbed('np', song))
        dispatcher = connection.playStream(ytdl(song.url, { audioonly: true }) )
        // console.log(dispatcher)

        let collector = msg.channel.createCollector(m => m)
        collector.on('collect', m => {
          if (m.content == '=') {
            msg.channel.send('paused').then(() => {dispatcher.pause()})
          } else if (m.content == '-'){
            msg.channel.send('resumed').then(() => {dispatcher.resume()})
          } else if (m.content == '>'){
            msg.channel.send( musicEmbed('skip', song) ).then(() => {dispatcher.end()})
          }
          // } else if (m.content.startsWith('+')){
          //   if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          //   dispatcher.setVolume(Math.min((dispatcher.volume*50 + (2*(m.content.split('+').length-1)))/50,2));
          //   msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          // } else if (m.content.startsWith('volume-')){
          //   if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          //   dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50,0));
          //   msg.channel.send(`Volume: ${Math.round(dispatcher.volume*50)}%`);
          // } else if (m.content.startsWith('>>')){
          //   msg.channel.send(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
          // }
        })
        dispatcher.on('end', () => {
          // console.log(np)
          np.then(m => m.delete(1000))
          collector.stop()
          play(queue[msg.guild.id].songs.shift())
        })
        dispatcher.on('error', (err) => {
          if (err) console.log(err)
          return msg.channel.send(err).then(() => {
            // np.delete()
            collector.stop()
            play(queue[msg.guild.id].songs.shift())
          })
        })
      }, e => console.log(e))
    }
    
    play(queue[msg.guild.id].songs.shift())
  },
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  queue: msg => {
    console.log(queue[msg.guild.id].songs)
  }
}

 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 // DISCORD
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
  // msg.member.voiceChannel.leave()
})

client.on('message', msg => {
  let command, args

  if (msg.author.bot) return;

  args = msg.content.split(' ').splice(1)

  // MUSIC HAS OWN RULES
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
  if ( msg.channel.name === 'music' ) {

    msg.delete()

    if ( !queue[msg.guild.id] ) {
      queue[msg.guild.id] = {}
      queue[msg.guild.id].songs = []
    }
    if ( msg.content.startsWith('!') || msg.content.startsWith('.') ) return msg.channel.send('coms dont use tut').then(m => m.delete(5000))

    // search with link
    if ( msg.content.startsWith('http') ) {
      
      if ( !msg.content.match(/youtube/g) ) return msg.channel.send('youtube mne davai, a ne eto').then(m => m.delete(5000))

      // get id
      ytId = msg.content.split(' ')[0].split('=')[1].split('&')[0]
      yt.getById(ytId, (err, res) => {
        if (err) return console.log(err)

        let formatedSong = formatSong(msg, res.items[0])
        queue[msg.guild.id].songs.push(formatedSong)
        msg.channel.send(musicEmbed('order', formatedSong))
        if ( !queue[msg.guild.id].playing ) commands.music.start(msg)
      })
    
    } else if ( msg.content == 'q' ) {
      commands.music.queue(msg)

    } else if ( msg.content == 'boy next door' ) {
      msg.member.voiceChannel.leave()
      // search with string
    } else if ( !['>','<','+','-','=','-','>>'].includes(msg.content) ) {
      let searchTring = msg.content
      yt.search(searchTring, 1, {order: 'relevance'}, async function(err, res) {
        if (err) console.log(err)
        // search doesnt give enough info bout video
        yt.getById(res.items[0].id.videoId, (e, r) => {
          if (e) console.log(e)
          else {
            // console.log(res.items[0])
            let formatedSong = formatSong(msg, r.items[0])
            queue[msg.guild.id].songs.push(formatedSong)
            if ( !queue[msg.guild.id].playing ) commands.music.start(msg)
            msg.channel.send(musicEmbed('order', formatedSong))
          }
        })
      })
    }
  // NOT MUSIC, OTHER COMMANDS
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  } else {
    if (!msg.content.startsWith(db.prefix)) return;

    command = msg.content.split(' ')[0].slice(db.prefix.length)

    if (command === 'ping') {
      msg.channel.send(`\`${Date.now() - msg.createdTimestamp} ms\``);
    } else if ( command === 'lol' ) {
      if ( !args.includes('stop') ) {
        let role = msg.guild.roles.find('name', 'temu')
        intId = setInterval(()=> {
          role.setColor(randomColor())
        },100)
        console.log('not stop')
      }

      let collector = msg.channel.createCollector(m => m)
      collector.on('collect', m => {
        console.log(m.content)
        // console.log(m.content.split(' ').splice(1))
        if ( m.content == 'stop' ) {
          console.log('STOP')
          clearInterval(intId)
        }
      })
      // console.log(randomColor())
    } else {
      msg.channel.send(`Anata dolboeb desu ka?`);
      msg.channel.send(`${emoji('ka')}`)
    }
  }
  
})

client.login(process.env.TOKEN || cfg.token)
yt.setKey(cfg.ytKey)