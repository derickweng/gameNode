module.exports = {
    user: {
        name: { type: String, required: true },
        password: { type: String, required: true },
        email: {
            type: String,
            required: true
        }
    },
		 facebook: {
		id: String,
		token: String,
		email: String,
		name: String,
		username: String,
	  },
	  twitter: {
		id: String,
		token: String,
		displayName: String,
		username: String,
	  },
	  google: {
		id: String,
		token: String,
		email: String,
		name: String,
	  }
};