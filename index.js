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
        if (!song) return msg.channel.send('Pustata').then(() => {
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
          let collector = msg.channel.createCollector(m => m);
			    collector.on('message', m => {
            if (m.content.startsWith('=')) {
              msg.channel.send('paused').then(() => {dispatcher.pause()})
            } else if (m.content.startsWith('-')){
              msg.channel.send('resumed').then(() => {dispatcher.resume()})
            } else if (m.content.startsWith('>')){
              msg.channel.send('skipped').then(() => {dispatcher.end()})
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
          });
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
    },
    skip: (msg) => {

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