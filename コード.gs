// You have to run GetEmailOnDay for the first time.

function SetTrigger(){
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var day = today.getDate();
  let date = new Date(year, month, day+1, 0, 1);
  ScriptApp.newTrigger('GetEmailOnDay').timeBased().at(date).create();
}

function DeleteTrigger(){
  let triggers = ScriptApp.getProjectTriggers();
  for (let trigger of triggers){
    let funcName = trigger.getHandlerFunction();
    if(funcName == 'GetEmailOnDay'){
      ScriptApp.deleteTrigger(trigger);
    }
  }
}

function GetEmailOnDay() {
  var today = new Date();
  var yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  var startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
  var endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
  GetEmail(startOfYesterday, endOfYesterday, yesterday);
}

function GetEmail(startTime, endTime, day) {
  var from = "mail@debit.bk.mufg.jp";

  // Get all threads
  var threads = GmailApp.getInboxThreads();

  // Get day for line notify
  var yesterday = new Date(day);
  var Month = yesterday.getMonth()+1;
  var Day = yesterday.getDate(); 
  let num = 0;
  // Search for threads with a matching sender
  outerloop: for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();

    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      var timestamp = message.getDate();
      if (timestamp >= startTime && timestamp <= endTime) {
        if (message.getFrom() === from){
          if(num == 0){
            NoticeToLINE("無駄遣い発表");
          }
          var body = message.getBody()
          var amountMatch = body.match(/ご利用金額（円）\s*:\s*([\d,]+)/);
          var shopMatch = body.match(/ご利用先\s*:\s*([^\n\r]+)/);
          var amount = amountMatch[1].replace(/,/g, ''); 
          var shop = shopMatch[1].trim();
          var amount = parseInt(amount).toLocaleString();
          var message = '【'+ Month + '月' + Day + '日】\n\n利用金額:' + amount + '円\n利用先:' + shop;
          NoticeToLINE(message);
          num += 1;
        }
      }else{
        break outerloop;
      }
    }
  }

  if (parseInt(num) == 0){
    message = '【'+ Month + '月' + Day + '日】\n\nカードの利用はありませんでした'
    NoticeToLINE(message);
  }
  DeleteTrigger();
  SetTrigger();
}

function NoticeToLINE(message) {
  var accessToken = "LINE_ACCESS_TOKEN";
  
  // 送信先のuserID
  var userId = "YOUR_LINE_USER_ID";

  var options = {
    "contentType": "application/json",
    "method" : "post",
    "payload" : JSON.stringify({
      "to" : userId,
      "messages" : [{
        "type" : "text",
        "text" : message
      }]
    }),
    "headers" : {"Authorization" : "Bearer " + accessToken}
  };

  var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", options);
  if (parseInt(response.getResponseCode()) != 200){
    Logger.log("message:"+message);
    Logger.log(response.getContentText());
  }
}
