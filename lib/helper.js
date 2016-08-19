var h = {};

h.prettyState = function(state) {
  switch(state) {
    case 'ac':    return '✔'; break;
    case 'notac': return '✘'; break;
    default:      return ' '; break;
  };
}

h.getSetCookieValue = function(resp, key) {
  var cookies = resp.headers['set-cookie'];
  if (!cookies) return null;
  for (var i=0; i<cookies.length; ++i) {
    var sections = cookies[i].split(';');
    for (var j=0; j<sections.length; ++j) {
      var kv = sections[j].trim().split('=');
      if (kv[0] == key) return kv[1];
    }
  }
}

module.exports = h;
