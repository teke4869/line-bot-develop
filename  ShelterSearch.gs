// LINE BOTの設定
var LINE_BOT_CHANNEL_ACCESS_TOKEN = '';
var LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

// Google Maps Geocoding APIの設定
var GOOGLE_MAPS_GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';
var API_KEY = '';

// Google Places APIの設定
var GOOGLE_PLACES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

function doPost(e) {
  var json = JSON.parse(e.postData.contents);
  var replyToken = json.events[0].replyToken;

  if (json.events[0].type === 'message' && json.events[0].message.type === 'location') {
    var userLatitude = json.events[0].message.latitude;
    var userLongitude = json.events[0].message.longitude;

    // 5km以内に海岸と漁港があるかどうかを判定
    var isNearCoastAndHarbor = checkIfNearCoastAndHarbor(userLatitude, userLongitude);

    // カルーセル型メッセージを初期化
    var messages = [];

    if (isNearCoastAndHarbor) {
      // 海岸と漁港が近くにある場合、津波避難場所またはビルを検索
      var tsunamiShelterResults = searchNearbyTsunamiShelters(userLatitude, userLongitude, 5000);

      if (tsunamiShelterResults.length > 0) {
        // 距離が近い順にソート
        tsunamiShelterResults = sortResultsByDistance(tsunamiShelterResults);

        messages.push(createCarouselMessage(tsunamiShelterResults,userLatitude,userLongitude));
      } else {
        messages.push({ type: 'text', text: '近くの津波避難場所またはビルが見つかりませんでした。' });
      }
    } else {
      // 海岸と漁港が近くにない場合、学校または避難所を検索
      var schoolOrShelterResults = searchNearbySchollOrShelters(userLatitude, userLongitude);

      if (schoolOrShelterResults.length > 0) {
        messages.push(createCarouselMessage(schoolOrShelterResults,userLatitude,userLongitude));
      } else {
        messages.push({ type: 'text', text: '近くの学校または避難所が見つかりませんでした。' });
      }
    }

    // LINEにメッセージを送信
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

function checkIfNearCoastAndHarbor(latitude, longitude) {
  // 半径5km圏内に海があるかどうかを判定
  var seaKeyword = '海岸 AND 漁港';
  var seaSearchUrl = `${GOOGLE_PLACES_ENDPOINT}?location=${latitude},${longitude}&radius=5000&keyword=${seaKeyword}&language=ja&key=${API_KEY}`;
  
  var seaResponse = UrlFetchApp.fetch(seaSearchUrl);
  var seaData = JSON.parse(seaResponse.getContentText());
  
  return seaData.results.length > 0;
}

function searchNearbyTsunamiShelters(latitude, longitude, radius) {
  // 5km以内の津波避難場所またはビルを検索
  var placesUrl = `${GOOGLE_PLACES_ENDPOINT}?location=${latitude},${longitude}&radius=${radius}&keyword=津波避難場所 OR 津波避難ビル OR 神社&language=ja&key=${API_KEY}`;
  
  var placesResponse = UrlFetchApp.fetch(placesUrl);
  var placesData = JSON.parse(placesResponse.getContentText());
  
  return placesData.results;
}

function searchNearbyShelters(latitude, longitude) {
  // 3km以内の学校または避難所を検索
  var placesUrl = `${GOOGLE_PLACES_ENDPOINT}?location=${latitude},${longitude}&rankby=distance&keyword=避難所&language=ja&key=${API_KEY}`;
  
  var placesResponse = UrlFetchApp.fetch(placesUrl);
  var placesData = JSON.parse(placesResponse.getContentText());
  
  return placesData.results;
}

function searchNearbySchools(latitude, longitude) {
  // 3km以内の学校または避難所を検索
  var placesUrl = `${GOOGLE_PLACES_ENDPOINT}?location=${latitude},${longitude}&rankby=distance&keyword=小学校OR中学校OR高校&language=ja&key=${API_KEY}`;
  
  var placesResponse = UrlFetchApp.fetch(placesUrl);
  var placesData = JSON.parse(placesResponse.getContentText());
  
  return placesData.results;
}

function searchNearbySchollOrShelters(latitude, longitude) {
  // 3km以内の学校または避難所を検索
  // 避難所と学校の情報を合わせて検索
  var shelterResults = searchNearbyShelters(latitude, longitude);
  var schoolResults = searchNearbySchools(latitude, longitude);

  // 合わせた結果をソート
  var combinedResults = shelterResults.concat(schoolResults);
  combinedResults = sortResultsByDistance(combinedResults, latitude, longitude);
  
  return combinedResults;
}

function sortResultsByDistance(results,latitude,longitude) {
  results.sort(function (a, b) {
    var locationA = a.geometry.location;
    var locationB = b.geometry.location;
    var latitudeA = locationA.lat;
    var longitudeA = locationA.lng;
    var latitudeB = locationB.lat;
    var longitudeB = locationB.lng;

    // aからbまでの距離を計算
    var distanceA = calculateDistance(latitudeA, longitudeA, latitude, longitude);
    var distanceB = calculateDistance(latitudeB, longitudeB, latitude, longitude);

    // 距離が近い順にソート
    return distanceA - distanceB;
  });

  return results;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // 地球の半径（km）
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c; // km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


function createCarouselMessage(results,userLatitude,userLongitude) {
  // カルーセル型メッセージを作成
  var columns = [];

  for (var i = 0; i < 3; i++) {
    var place = results[i];
    var placeName = place.name;
    var placeAddress = place.vicinity;

    var directionsUrl = `https://www.google.com/maps/dir/${userLatitude},${userLongitude}/${place.geometry.location.lat},${place.geometry.location.lng}`;

    var column = {
      title: placeName,
      text: placeAddress,
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

  var message = {
    type: 'template',
    altText: '近くの場所情報',
    template: {
      type: 'carousel',
      columns: columns
    }
  };

  return message;
}