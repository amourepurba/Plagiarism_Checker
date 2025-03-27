// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'mysql2',
    connection: {
      host: 'localhost',       // Ganti dengan host MySQL kamu
      user: 'root',   // Ganti dengan username MySQL kamu
      password: '@Auzan1234', // Ganti dengan password MySQL kamu
      database: 'seoplagiarischecker'  // Ganti dengan nama database kamu
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'mysql2',
    connection: {
      host: 'localhost',       // Ganti dengan host MySQL kamu
      user: 'root',   // Ganti dengan username MySQL kamu
      password: '@Auzan1234', // Ganti dengan password MySQL kamu
      database: 'seoplagiarischecker'  // Ganti dengan nama database kamu
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'mysql2',
    connection: {
      host: 'localhost',       // Ganti dengan host MySQL kamu
      user: 'root',   // Ganti dengan username MySQL kamu
      password: '@Auzan1234', // Ganti dengan password MySQL kamu
      database: 'seoplagiarischecker'  // Ganti dengan nama database kamu
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
