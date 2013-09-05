function isBot(update) {
  return update.userAgent.match("(bingbot)|(googlebot)|(baidu)|(yandex)|(crawler)|(spider)|(msnbot)|(bot)") 
}
