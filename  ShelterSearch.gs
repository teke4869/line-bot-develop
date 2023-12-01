// LINE BOTの設定
var LINE_BOT_CHANNEL_ACCESS_TOKEN = '1pTIotgCiIQQ2sEEukAyrzYTolG1IH22YrvIvffBXGT3lVSpcMKrVIV8wKshdg6KZzV0zu5+XQLO8FniJdjBDIjJyTaYdoWloi+u4E1U00zUf0/0ww3sX9nZjt9o5RaB6yk+WvMTZT5ouAeE7oH0BgdB04t89/1O/w1cDnyilFU=';
var LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

// Google Maps Geocoding APIの設定
var GOOGLE_MAPS_GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';
var API_KEY = 'AIzaSyCfHV9FggOdJYU_MpghBygjZoPocVJ6a5c';

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
      var tsunamiShelterResults = searchNearbyTsunamiShelters(userLatitude, userLongitude);

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

  // メッセージのタイプを特定
  if (json.events[0].type === 'message' && json.events[0].message.type === 'text') {
    var userMessage = json.events[0].message.text;
    // メッセージの内容に応じて messageType を設定
    if (userMessage === '屋内') {
      var quickReplies = createQuickReplies('屋内');
      UrlFetchApp.fetch(LINE_REPLY_URL, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + LINE_BOT_CHANNEL_ACCESS_TOKEN,
        },
        method: 'post',
        payload: JSON.stringify({
          replyToken: replyToken,
          messages: [{
              type: 'text',
              text: '今いる場所に近いものを選んでください',
              quickReply: {
                items: quickReplies
              },
          }]
        }),
      });
    } else if (userMessage === '屋外') {
      var quickReplies = createQuickReplies('屋外');
      UrlFetchApp.fetch(LINE_REPLY_URL, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + LINE_BOT_CHANNEL_ACCESS_TOKEN,
        },
        method: 'post',
        payload: JSON.stringify({
          replyToken: replyToken,
          messages: [{
              type: 'text',
              text: '今いる場所に近いものを選んでください',
              quickReply: {
                items: quickReplies
              },
          }]
        }),
      });    
    } else if (userMessage === 'わからない'){
      var quickReplies = createQuickReplies('わからない');
      // LINEにメッセージを送信
      UrlFetchApp.fetch(LINE_REPLY_URL, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + LINE_BOT_CHANNEL_ACCESS_TOKEN,
        },
        method: 'post',
        payload: JSON.stringify({
          replyToken: replyToken,
          messages: [{
              type: 'text',
              text: '今いる場所に近いものを選んでください',
              quickReply: {
                items: quickReplies
              },
          }]
        }),
      });
    }else {
      var ToDo = handleQuickReply(json.events[0].message.text);
      UrlFetchApp.fetch(LINE_REPLY_URL, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + LINE_BOT_CHANNEL_ACCESS_TOKEN,
        },
        method: 'post',
        payload: JSON.stringify({
          replyToken: replyToken,
          messages: ToDo,
        }),
      });
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
        messages: [{
            type: 'text',
            text: '今いる場所に近いものを選んでください',
            quickReply: {
              items: quickReplies
            },
        }]
      }),
    });
  }




  if (json.events[0].type === 'message' && json.events[0].message.type === 'text') {
    // クイックリプライに応じてメッセージを送信
    var ToDo = handleQuickReply(json.events[0].message.text);

    UrlFetchApp.fetch(LINE_REPLY_URL, {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_BOT_CHANNEL_ACCESS_TOKEN,
    },
    method: 'post',
    payload: JSON.stringify({
      replyToken: replyToken,
      messages: ToDo,
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

function searchNearbyTsunamiShelters(latitude, longitude) {
  // 5km以内の津波避難場所またはビルを検索
  var placesUrl = `${GOOGLE_PLACES_ENDPOINT}?location=${latitude},${longitude}&rankby=distance&keyword=津波避難所OR学校OR津波避難ビル&language=ja&key=${API_KEY}`;
  
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
  var placesUrl = `${GOOGLE_PLACES_ENDPOINT}?location=${latitude},${longitude}&rankby=distance&keyword=中学校 OR 小学校 OR 高校 OR 高台 OR 工業高校 OR 高等専門学校 OR 図書館 OR 情報制御工学科棟 OR 大学&language=ja&key=${API_KEY}`;
  
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


function createQuickReplies(messageType) {
  // クイックリプライを作成
  var quickReplies = [];

  if (messageType === '屋内') {
    quickReplies.push(
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "自宅",
          "text": "自宅"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "エレベーター",
          "text": "エレベーター"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "施設",
          "text": "施設"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "劇場ホール",
          "text": "劇場ホール"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "地下道",
          "text": "地下道"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "この中に無い",
          "text": "この中に無い"
        }
      }
      // 他の屋内オプションを追加
    );
  } else if (messageType === '屋外') {
    quickReplies.push(
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "路上",
          "text": "路上"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "車内",
          "text": "車内"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "公共交通機関",
          "text": "公共交通機関"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "海岸",
          "text": "海岸"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "山の中",
          "text": "山の中"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "この中に無い",
          "text": "この中に無い"
        }
      }
      // 他の屋外オプションを追加
    );
  } else {
    // わからない場合
    quickReplies.push(
       {
        "type": "action",
        "action": {
          "type": "message",
          "label": "自宅",
          "text": "自宅"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "エレベーター",
          "text": "エレベーター"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "施設",
          "text": "施設"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "劇場ホール",
          "text": "劇場ホール"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "地下道",
          "text": "地下道"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "路上",
          "text": "路上"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "車内",
          "text": "車内"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "公共交通機関",
          "text": "公共交通機関"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "海岸",
          "text": "海岸"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "山の中",
          "text": "山の中"
        }
      },
      {
        "type": "action",
        "action": {
          "type": "message",
          "label": "この中に無い",
          "text": "この中に無い"
        }
      }
      // 他のわからないオプションを追加
    );
  }

  return quickReplies;
}


function handleQuickReply(quickReplyText) {
  // クイックリプライに応じてメッセージを送信する関数
  var replyMessages = [];

  // クイックリプライの選択肢に応じてメッセージを作成
  switch (quickReplyText) {
    case '自宅':
      replyMessages.push({ type: 'text', text: '【自宅】\n\n①家具や落下物に注意する\n\n②頭を守る\n\n③ドアを開け脱出経路を確保\n\n④火元を確認する\n\n⑤屋外に出る\n\n⑥現在の地震の状況を確認する' });
      break;
    case 'エレベーター':
      replyMessages.push({ type: 'text', text: '【エレベーターの中】\n\n①全ての階のボタンを押す\n\n②[閉じ込められた場合]\n\n・非常ボタンを押す\n\n・外部と連絡を取る\n\n・相手からの指示に従う \n\n③[エレベーターから出られた場合]\n\n・落下物に注意しつつ屋外に出る\n\n・倒壊や落下物から安全を確保する\n\n・地震の情報を確認する\n\n④[下への経路が断たれた場合]\n\n・救助隊(119)に連絡を取る\n\n・救助隊の指示の従う' });
      break;
    case '施設':
      replyMessages.push({ type: 'text', text: '【施設】\n\n①落下物などに注意する\n\n②荷物などで頭を守る\n\n③柱や壁の近くに行く\n\n④[避難経路が断たれた場合]\n\n・救助隊に連絡を取る\n\n・救助隊の指示の従う' });
      break;
    case '劇場ホール':
      replyMessages.push({ type: 'text', text: '【劇場ホール】\n\n①頭上の安全を確保する\n\n②頭上が安全な場所でうずくまる\n\n③荷物などで頭を守る\n\n④係員の指示があるまで待つ\n\n⑤指示があったら冷静に行動する\n\n⑥倒壊や落下物から安全を確保する\n\n⑦現在の地震の状況を確認する\n\n⑧[避難経路が断たれた場合]\n\n・救助隊(119)に連絡を取る\n\n・救助隊の指示の従う' });
      break;
    case '地下道':
      replyMessages.push({ type: 'text', text: '【地下道】\n\n①荷物などで頭を守る\n\n②壁や柱の近くによる\n\n③慌てず地下道の出口に向かう\n\n④倒壊や落下物から安全を確保する\n\n⑤地震の情報を確認する\n\n⑥車での移動は避け避難所に行く' });
      break;
    case '路上':
      replyMessages.push({ type: 'text', text: '【路上】\n\n①荷物などで頭を守る\n\n②周りを確認する\n\n③困っている人がいたら共に動く\n\n④広場などの開けた場所へ向かって進む\n\n⑤倒壊や落下物から安全を確保する\n\n⑥石塀や自動販売機から離れる\n\n⑦橋は避ける\n\n⑨地震の情報を確認する' });
      break;
    case '車内':
      replyMessages.push({ type: 'text', text: '【車内】\n\n①減速し路肩に停車する\n\n②停車後、地震の情報を確認する\n\n[車を放置して避難する場合]\n\n③車の窓を開ける\n\n④エンジンを切る\n\n⑤車検証、貴重品を持つ\n\n⑥キーをつけたまま外に出る\n\n⑦混雑が見込まれる場合は、売るまでの移動は避け、避難所に行く' });
      break;
    case '公共交通機関':
      replyMessages.push({ type: 'text', text: '【公共交通機関】\n\n①荷物などで頭を守る\n\n②係員からの指示に従う\n\n③安全な場所で現在の状況を確認\n\n④車での移動は避け避難所に行く' });
      break;
    case '海岸':
      replyMessages.push({ type: 'text', text: '【海岸】\n\n①いち早く高台に逃げる\n\n②海や崖には行かない、戻らない\n\n③安全な場所で現在の状況を確認\n\n④津波の危険がないことを確認\n\n⑤車での移動は避け避難所に行く' });
      break;
    case '山の中':
      replyMessages.push({ type: 'text', text: '【山の中】\n\n①姿勢を低くする\n\n②荷物などで頭を守る\n\n③急いで下山をしない\n\n④安全を確保し様子を見る\n\n⑤危険な道は避け下山する\n\n⑥登山口まで戻る\n\n⑦現在の地震の状況を確認する\n\n⑧車での移動は避け避難所に行く' });
      break;
    case 'この中に無い':
      replyMessages.push({ type: 'text', text: '【この中に無いと回答した場合】\n\n①荷物などで頭を守る\n\n②倒壊等の危険がない場所へ行く\n\n③現在の地震の状況を確認する\n\n④車での移動は避け避難所に行く' });
      break;
    
    // 他のクイックリプライに対する処理を追加
    default:
      replyMessages.push({ type: 'text13', text: '選択されたオプションに対するメッセージがありません' });
  }
  return replyMessages
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


/**
* スプレッドシートから前回のスクリプト実行時間を取得する
*/
function getTimeLog (timeLogCell,timeFormat){
 let preExcuteTime = ''
 if (!timeLogCell.isBlank()) {
   preExcuteTime = timeFormat(timeLogCell.getValue())
 }
 return preExcuteTime
}

/**
* XMLのURLを元にルート要素を探して返す
*/
function findXmlRoot (url){
 const response = UrlFetchApp.fetch(url).getContentText()
 return XmlService.parse(response).getRootElement()
}

/**
* 引数のelementの配下で引数のtagNameと一致する要素を配列で返す
*/
function getElementsByTagName(element, tagName){
 const data = []
 const children = element.getDescendants()
 for (let i = 0; i < children.length; i++) {
   const elem = children[i].asElement()
   if (elem != null && elem.getName() == tagName) {
     data.push(elem)
   } 
 }
 return data;
}

/**
* 地震情報を取得し、条件に合格した際にはLINEに通知する
*/
function earthNotify(){
  const timeFormat = (date) => Utilities.formatDate(date, 'JST', "yyyy-MM-dd HH:mm:ss")
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('シート1')
  const now = timeFormat(new Date())
  const timeLogCell = sheet.getRange('A2')
  const namespace = XmlService.getNamespace('http://www.w3.org/2005/Atom');
  const feedUrl = 'http://www.data.jma.go.jp/developer/xml/feed/eqvol.xml' // 気象庁の情報サイト
  const feedRoot = findXmlRoot(feedUrl)
  const entries = getElementsByTagName(feedRoot, 'entry')
  const message1 = '【　地震速報　】\n'
  const message2 = '震度3以上の地震がありました。\n'
  const message3 = '位置情報を送信してください。'
  const nameList = [];

  for (let i = 0; i < entries.length; i++) {
    const title = entries[i].getChild('title', namespace).getText()
    if (title !== '震度速報') continue

    const link = entries[i].getChild('link', namespace).getAttribute('href').getValue()
    const newsRoot = findXmlRoot(link)
    const items = getElementsByTagName(newsRoot, 'Item')
    const targetDateTime = getElementsByTagName(newsRoot, 'TargetDateTime')[0].getValue()

    for (let j = 0; j < items.length; j++) {
      // 震度3以上、かつ前回のスクリプト実行以降に更新された情報なら、LINEに最新情報として通知
      if (items[j].getValue().match(/震度[３-９]/) !== null 
        && new Date(targetDateTime) > new Date(getTimeLog(timeLogCell,timeFormat))) {
          const nameElements = getElementsByTagName(items[j], 'Name');
          for(let k=0; k<nameElements.length; k++){
            nameList.push(nameElements[k].getValue());
          }
          timeLogCell.setValue(now)

      }
    }
  }
  if(nameList.length > 0){
    const message = message1 + message2 + ('\n') + nameList.join('\n') + ('\n') + ('\n') + message3;
    sendInfoToLine(message);
  }
}


function usenotify(){
  const use_message = '【　運営からお知らせ　】\n\nこんにちは！\n運営からお知らせです！\n\nユーザーのみなさん!\n防災対策はしていますか？\n\n「避難所表示」と「ToDoリスト」は平常時にも使用できます！\n防災対策に活かしてください！'
  sendInfoToLine(use_message); 
}


function sendInfoToLine(text1){
  const url = 'https://api.line.me/v2/bot/message/broadcast';
  const token = LINE_BOT_CHANNEL_ACCESS_TOKEN; //ここにチャネルアクセストークン入れる

  const payload = {
    messages: [
      { type: 'text', text: text1 }
    ]
  };

  const params = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(url, params);
}
