const gzappy = require("gzappy-js").default;
const dotenv = require("dotenv")
dotenv.config()

const gClient = new gzappy({
    token: process.env.GZAPPY_API_TOKEN,
    instanceId: process.env.GZAPPY_INSTANCE_ID,
  });

module.exports = gClient
