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

  if (msg.author.bot) return;
  if (!msg.content.startsWith(db.prefix)) return;

  command = msg.content.split(' ')[0].slice(db.prefix.length)
  args = msg.content.split(' ').splice(1)
  
  if (command === "ping") {
    msg.channel.sendMessage(`\`${Date.now() - msg.createdTimestamp} ms\``);
  }
  if (command === "play") {
    const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel){
      return msg.channel.sendMessage(":x: You must be in a voice channel first!");
    }
    voiceChannel.join()
    .then(connection => {
      let stream = yt(args.join(" "), {audioonly: true});
      yt.getInfo(args.join(" "), function(err, info) {
      const title = info.title
      console.log(`${msg.author.username}, Queued the song '${title}.'`)
      msg.channel.send(`Now playing \`${title}\``)
      })
      const dispatcher = connection.playStream(stream);
      dispatcher.on('end', () => {
         voiceChannel.leave();
       }).catch(e =>{
         console.error(e);
       });
    })
  }
  
})

client.login(process.env.TOKEN || db.token)

