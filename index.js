const Discord = require("discord.js")
const client = new Discord.Client()
const yt = require('ytdl-core')

const db = require('./db.js')




//
// DISCORD
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('message', msg => {
  let command
  let args // TODO

  // no reply if msg author is bot
  if (msg.author.bot) return;

  if (msg.channel.name === db.musicChannel) {
    command = msg.content.split(' ')[0]

  } else {
    // no reply if starts not with prefix
    if (!msg.content.startsWith(db.prefix)) return;

    command = msg.content.split(' ')[0].slice(db.prefix.length)
    console.log(command)

    if (command === "play") {
      const voiceChannel = msg.member.voiceChannel;
      if (!voiceChannel){
        return msg.channel.sendMessage(":x: You must be in a voice channel first!");
      }
      voiceChannel.join()
      .then(connection => {
        console.log('1')
        let stream = yt('https://www.youtube.com/watch?v=DyhNyMLeB78', {audioonly: true});
        console.log('2')
        yt.getInfo('https://www.youtube.com/watch?v=DyhNyMLeB78', function(err, info) {
          console.log('3')
        const title = info.title
        console.log(`${msg.author.username}, Queued the song '${title}.'`)
        msg.channel.sendMessage(`Now playing \`${title}\``)
        })
        const dispatcher = connection.playStream(stream);
        dispatcher.on('end', () => {
           voiceChannel.leave();
         }).catch(e =>{
           console.error(e);
         });
      })
    }
  }
})

client.login(db.token)

