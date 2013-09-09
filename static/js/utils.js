function isBot(ua) {
  if (/bingbot/i.exec(ua)) return "Bing";
  if (/googlebot/i.exec(ua)) return "Google";
  if (/baidu/i.exec(ua)) return "Baidu";
  if (/yandex/i.exec(ua)) return "Yandex";
  if (/msnbot/i.exec(ua)) return "Bing";
  if (/blekko/i.exec(ua)) return "Blekko";
  if (/archive.org/i.exec(ua)) return "Internet Archive";
  if (/sogou/i.exec(ua)) return "Sogou";
  if (/jike/i.exec(ua)) return "Jike";
  if (/(spider)|(bot)/i.exec(ua)) {
    console.log("found unrecognized bot: " + ua);
    return "Bot";
  }
  return null;
}
