const crypto = require("crypto")

const getIp = headers => {
  if (headers["x-forwarded-for"]) {
    return headers["x-forwarded-for"]
  }
  const portStart = headers.host.indexOf(":")
  if (portStart >= 0) {
    return headers.host.slice(0, portStart)
  }
  return headers.host
}

const getSaltedIp = ip => {
  const hash = crypto.createHash("md5").update(ip).digest("hex")
  return hash
}

module.exports = { getSaltedIp, getIp }
