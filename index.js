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
	let authorUrl
	let duration

	if (song) {
		authorUrl = `https://cdn.discordapp.com/avatars/${song.author.id}/${song.author.avatar}.png`
		duration = `*${song.duration.h}* : *${song.duration.m}* : *${song.duration.s}*`
	}

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
	} else if (action === 'order') {
		embed
		.setColor('#FFFFFF')
		.setAuthor(`${song.author.username} ordered`, authorUrl)
		.setTitle(song.title.toUpperCase())
		.setURL(song.url)
		.setThumbnail(song.thumbnail)
		.setDescription(`${duration}`)
	} else if (action === 'empty') {
		embed
		.setTitle('Abyssalistic abyssaloiusness abyss')
		.setColor('#333333')
	}

	return embed
}

function lg(...args) {
	console.log(args)
}

let guilds

let intId
let queue = {}
let commands = {}
commands.music =	{
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// let self = this

	start: msg => {
		// console.log(this)
		console.log('start playing')
		// let guild = guilds[msg.guild.id].queue.playing = true
		queue[msg.guild.id].playing = true
		let dispatcher
		let np
		const voiceChannel = msg.member.voiceChannel.join()
		// const textChannel = msg.member.textChannel

		function play(song, opts = {}) {
			if (song === undefined) return msg.channel.send(musicEmbed('empty')).then((m) => {
				console.log('empty')
				m.delete(3000)
				queue[msg.guild.id].playing = false
				msg.channel.setTopic(`Peaceful place without noise`)
			})
			console.log(`playing: ${song.title}`)
			
			msg.channel.setTopic(`np: ${song.title}`)

			voiceChannel.then(connection => {
				console.log('connection')
				let np = msg.channel.send(musicEmbed('np', song))
				try {
					dispatcher = connection.playStream(ytdl(song.url, { audioonly: true, retries: 22 }).on('error', e => console.log(e)), {passes: 3})

				} catch(e) {
					console.log(e)
				}
				// console.log(dispatcher)

				let collector = msg.channel.createCollector(m => m)
				collector.on('collect', m => {
					if (m.content == '||') {
						msg.channel.send('paused').then(() => {dispatcher.pause()})
					} else if (m.content == '|>'){
						msg.channel.send('resumed').then(() => {dispatcher.resume()})
					} else if (m.content == '>'){
						msg.channel.send( musicEmbed('skip', song) ).then(() => {
							console.log('skipped')
							dispatcher.end()
						})
					} else if (m.content.startsWith('>>')){
						msg.channel.send(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0'+Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
					}
				})
				dispatcher.on('end', () => {
					console.log('dispatcher end')
					np.then(m => m.delete())
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
	add: (msg, song) => {
		let formatedSong = formatSong(msg, song.items[0])

		queue[msg.guild.id].songs.push(formatedSong)
		console.log(`queued: ${formatedSong.title}`)
		msg.channel.send(musicEmbed('order', formatedSong))
		
		if ( !queue[msg.guild.id].playing ) commands.music.start(msg)
	},
	seek: (msg, moment, plus) => {

	},
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	queue: msg => {
		console.log(queue[msg.guild.id])
	}
}

process.on('unhandledRejection', (err) => {
	console.error(err)
	process.exit(1)
})

 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
 // DISCORD
 ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`)
	// msg.member.voiceChannel.leave()
	// console.log(client)
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
				if (err) return console.error(err)

				commands.music.add(msg, res)
			})
		} else if ( msg.content == '@' ) {
			commands.music.start(msg)
		} else if ( msg.content == 'q' ) {
			commands.music.queue(msg)

		} else if ( msg.content == 'boy next door' ) {
			msg.member.voiceChannel.leave()
			// search with string
		} else if ( !['>','<','+','-','=','-','>>'].includes(msg.content[0])	) {
			console.log(msg.content)
			let searchTring = msg.content.split('\n')[0]
			yt.search(searchTring, 1, {order: 'relevance'}, function(err, res) {
				if (err) console.error(err)
				// search doesnt give enough info bout video
				yt.getById(res.items[0].id.videoId, (e, r) => {
					if (e) return console.error(e)

					commands.music.add(msg, r)
				})
			})
		}
	// NOT MUSIC, OTHER COMMANDS
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	} else {
		if (!cfg.prefix.includes(msg.content[0]) ) return;

		command = msg.content.split(' ')[0].slice(1)

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