exports.dateFormatter = (date) => {
  var pad = function (num) {
    return ("00" + num).slice(-2);
  };

  date =
    date.getUTCFullYear() +
    "-" +
    pad(date.getUTCMonth() + 1) +
    "-" +
    pad(date.getUTCDate()) +
    " " +
    pad(date.getUTCHours()) +
    ":" +
    pad(date.getUTCMinutes()) +
    ":" +
    pad(date.getUTCSeconds());
  return date;
};

exports.generateUserId = (fullName) => {
  const randId = Math.floor(Math.random()*8999+1000)
  return `${fullName[0].toUpperCase()+fullName.slice(1,fullName.length-1).split(' ')[0]}#${randId}`;
}

exports.httpResponse = (res, statusCode, status, message, data = null) => {
  return res.status(statusCode).json({
    status,
    message,
    data
  });
};
