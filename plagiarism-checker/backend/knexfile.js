module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '@Auzan1234',
      database: 'seoplagiarismchecker'
    },
    migrations: {
      directory: './migrations'
    }
  }
};
