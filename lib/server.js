const express = require('express')
const prefontaine = require('./prefontaine');

module.exports = (program) => {

	const app = express()

	app.get('/profiles', (req, res) => {
		// debugger;
		// console.log(prefontaine.config.get('profiles'))

		// res.json(prefontaine.config.get('profiles'))
    prefontaine(program)
      .then(function (pre) {
        res.json(pre.config.get('profiles'))
      });
	});
	app.post('/profiles/run/:profile', (req, res) => {
		let prog = Object.assign({}, program, {profile: req.params.profile, fromServer: true})
		prefontaine(prog)
      .then(function (pre) {
      	// console.log(pre);
        return prefontaine.start(pre);
      })
			.then(function (pre) {
				res.json({launched: true,
					ts: pre.config.get('profiles:base:reports')
				});
			})
			.catch(function (err) {
				res.json({launched: false});
			});
	});
	app.listen(3000, () => console.log('Nemo-Runner listening on port 3000!'))
}