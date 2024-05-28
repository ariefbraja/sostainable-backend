const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "aqwchaos123",
    host: "localhost",
    port: 5432,
    database: "sostainable"
});


module.exports = pool;
