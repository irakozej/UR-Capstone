// hash.js
const bcrypt = require('bcrypt');
bcrypt.hash('MySecureAdmin123', 10).then(console.log);
