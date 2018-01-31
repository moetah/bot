const Discord = require("discord.js")
const ytdl = require('ytdl-core')
const YouTube = require('youtube-node');

const db = require('./db.js')

const yt = new YouTube();
const client = new Discord.Client()

yt.setKey('AIzaSyBD6IR-yjjSoVsa-u9yOKj7virVmF3S60M')

function emoji(name) {
  return client.emojis.find('name', name)
}

function formatSong(msg, linkInfo) {
  return {
    url:       linkInfo.video_url,
    title:     linkInfo.title,
    thumbnail: linkInfo.thumbnail_url,
    length:    linkInfo.length_seconds,
    author: {
      username: msg.author.username,
      id: msg.author.id,
      avatar: msg.author.avatar
    }
  }
}

let queue = {
  songs: [],
  playing: false
}
let commands = {}


// DISCORD
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  let command, args
  
  // const musicChannel = msg.guild.channels.find('name', 'music');
  
  if (msg.author.bot) return;
  
  args = msg.content.split(' ').splice(1)
  
  // console.log(msg.member)
  
  
  commands.music = {
    start: (msg) => {
      queue.playing = true
      let dispatcher
      const voiceChannel = msg.member.voiceChannel

      function play(song) {
        if (!song) return msg.channel.sendMessage('Pustata').then(() => {
          queue.playing = false
        })

        voiceChannel.join().then(connection => {
          msg.channel.send((new Discord.RichEmbed())
          .setColor([ // random color
            Math.floor(Math.random()*255),
            Math.floor(Math.random()*255),
            Math.floor(Math.random()*255)
          ])
          .setAuthor(song.author.username, `https://cdn.discordapp.com/avatars/${song.author.id}/${msg.author.avatar}.png`)
          .setTitle(song.title)
          .setURL(song.url)
          .setDescription(`**${song.length}sec** | n in queue`)
          .setThumbnail(song.thumbnail)
        )
          dispatcher = connection.playStream(ytdl(song.url, { audioonly: true }), {passes: 1})
          dispatcher.on('end', () => {
            // collector.stop()
            play(queue.songs.shift())
          })
          dispatcher.on('err', () => {
            return msg.channel.send('error: ' + err).then(() => {
              collector.stop()
              play(queue[msg.guild.id].songs.shift())
            })
          })
        })
      }
      
      play(queue.songs.shift())
    }
  }

  if ( msg.channel.name === 'music' ) {
    if ( msg.content.startsWith('http') ) {
      command = msg.content.split(' ')[0]
      ytdl.getInfo(command, (err, songInfo) => {
        queue.songs.push(formatSong(msg, songInfo))
        if ( !queue.playing ) commands.music.start(msg)
      })
    } else {
      command = msg.content.split(' ')[0]

      yt.search(command, 1, function(err, res) {
        if (err) msg.channel.send('cheta huinya')
        else {
          ytdl.getInfo(`https://www.youtube.com/watch?v=${res.items[0].id.videoId}`, (err, songInfo) => {
            queue.songs.push(formatSong(msg, songInfo))
            if ( !queue.playing ) commands.music.start(msg)
          })
        }
      })
    }
    msg.delete(3000)


// ------------------------------------------------
  } else {
    if (!msg.content.startsWith(db.prefix)) return;

    command = msg.content.split(' ')[0].slice(db.prefix.length)

    if (command === "ping") {
      msg.channel.send(`\`${Date.now() - msg.createdTimestamp} ms\``);
    } else {
      msg.channel.send(`Anata dolboeb desu ka?`);
      msg.channel.send(`${emoji('ka')}`)
    }
  }
  
})

client.login(process.env.TOKEN || db.token)