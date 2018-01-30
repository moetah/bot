const Discord = require("discord.js")
const client = new Discord.Client()
// const yt = require('ytdl-core')

const db = require('./db.js')


System.out.println("Hello, logs!");
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
    msg.channel.sendMessage(`pong`);
  }
  
})

client.login((''+process.env.TOKEN) || db.token)