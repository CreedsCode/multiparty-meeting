module.exports =
{
	// Passport auth conf
	auth :
	{
		// Dataporten
		dataporten :
		{
			clientID   		: 'clientID',
			clientSecret	: 'clientSecret',
			callbackURL 	: 'https://myDomainName:port/auth/dataporten/callback'
		},
		// SimpleSAMLphp + OAuth2 modul
		ssp :
		{
			authorizationURL : 'https://ssp.example.com/simplesaml/module.php/oauth2/authorize.php',
			tokenURL         : 'https://ssp.example.com/simplesaml/module.php/oauth2/access_token.php',
			profileUrl       : 'https://ssp.example.com/simplesaml/module.php/oauth2/userinfo.php',
			clientID         : 'clientID',
			clientSecret     : 'clientSecret',
			callbackURL      : 'https://myDomainName:port/auth/ssp/callback'
		}
	},
	// Listening hostname for `gulp live|open`.
	domain : 'localhost',
	tls    :
	{
		cert : `${__dirname}/../certs/mediasoup-demo.localhost.cert.pem`,
		key  : `${__dirname}/../certs/mediasoup-demo.localhost.key.pem`
	},
	// Listening port for https server.
	listeningPort         : 443,
	// Any http request is redirected to https.
	// Listening port for http server. 
	listeningRedirectPort : 80,
	// STUN/TURN 
	turnServers   : [
		{
			urls : [
				'turn:example.com:443?transport=tcp'
			],
			username   : 'example',
			credential : 'example'
		}
	],
	mediasoup :
	{
		// mediasoup Server settings.
		logLevel : 'warn',
		logTags  :
		[
			'info',
			'ice',
			'dtls',
			'rtp',
			'srtp',
			'rtcp',
			'rbe',
			'rtx'
		],
		rtcIPv4          : true,
		rtcIPv6          : true,
		rtcAnnouncedIPv4 : null,
		rtcAnnouncedIPv6 : null,
		rtcMinPort       : 40000,
		rtcMaxPort       : 49999,
		// mediasoup Room codecs.
		mediaCodecs      :
		[
			{
				kind       : 'audio',
				name       : 'opus',
				clockRate  : 48000,
				channels   : 2,
				parameters :
				{
					useinbandfec : 1
				}
			},
			// {
			// 	kind      : 'video',
			// 	name      : 'VP8',
			// 	clockRate : 90000
			// }
			{
				kind       : 'video',
				name       : 'H264',
				clockRate  : 90000,
				parameters :
				{
					'packetization-mode'      : 1,
					'profile-level-id'        : '42e01f',
					'level-asymmetry-allowed' : 1
				}
			}
		],
		// mediasoup per Peer max sending bitrate (in bps).
		maxBitrate : 500000
	}
};
