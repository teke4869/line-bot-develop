// LINE BOTの設定
var LINE_BOT_CHANNEL_ACCESS_TOKEN = '';
var LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

// Google Maps Places APIの設定
var GOOGLE_MAPS_API_KEY = '';
var GOOGLE_MAPS_PLACES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

function doPost(e) {
  var json = JSON.parse(e.postData.contents);
  var replyToken = json.events[0].replyToken;

  if (json.events[0].type === 'message' && json.events[0].message.type === 'location') {
    var userLatitude = json.events[0].message.latitude;
    var userLongitude = json.events[0].message.longitude;

    // Google Maps Places APIで近くの避難所を検索
    var placesUrl = `${GOOGLE_MAPS_PLACES_ENDPOINT}?location=${userLatitude},${userLongitude}&radius=5000&&keyword=避難所&language=ja&key=${GOOGLE_MAPS_API_KEY}`;
    
    var placesResponse = UrlFetchApp.fetch(placesUrl);
    var placesData = JSON.parse(placesResponse.getContentText());
    
    // 避難所の情報をカーセル型メッセージに変換
    var columns = [];
    var maxColumns = Math.min(3, placesData.results.length);
    for (var i = 0; i < maxColumns; i++) {
      var place = placesData.results[i];
      var title = place.name;
      var address = place.vicinity;
      var distance = place.geometry.location.lat + ',' + place.geometry.location.lng;
      
      var directionsUrl = `https://www.google.com/maps/dir/${userLatitude},${userLongitude}/${distance}`;
      
      var column = {
        title: title,
        text: address,
        actions: [
          {
            type: 'uri',
            label: 'ルートを表示',
            uri: directionsUrl
          }
        ]
      };

      columns.push(column);
    }
    
    // LINEに送信するカルーセル型テンプレートメッセージを作成
    var message = {
      type: 'template',
      altText: '避難所情報',
      template: {
        type: 'carousel',
        columns: columns
      }
    };
    
    // LINEにメッセージを送信
    var messages = [message];
    UrlFetchApp.fetch(LINE_REPLY_URL, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + LINE_BOT_CHANNEL_ACCESS_TOKEN,
      },
      method: 'post',
      payload: JSON.stringify({
        replyToken: replyToken,
        messages: messages,
      }),
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ content: 'post ok' })).setMimeType(ContentService.MimeType.JSON);
}
