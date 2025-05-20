const bcrypt = require('bcrypt');

bcrypt.hash('MySecureAdmin123', 10).then(hash => {
  console.log('Your hashed password:', hash);
});
