const { createJWT, isTokenValid } = require("./jwt");
const attachCookiesToResponse = require("./cookie");
const checkPermissions = require("./checkPermissions");

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
  checkPermissions,
};
