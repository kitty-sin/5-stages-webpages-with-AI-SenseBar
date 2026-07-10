/**
 * 寫教學應用程式的五個等級 - Lv.2 Google Sheets 試算表後端
 * 
 * 此版本為自動化免設定版：
 * 1. 部署為網頁應用程式後，第一次收到資料或執行時，會自動在您的 Google 雲端硬碟建立名為「寫教學應用程式的五個等級 - Lv.2 測驗成績單」的試算表。
 * 2. 提供 doGet 端點，前端可以直接查詢對應試算表的雲端網址。
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  
  try {
    // 取得或自動建立試算表工作表
    var sheet = getOrCreateSheet();
    
    // 解析前端傳來的 JSON 資料
    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date();
    var nickname = data.nickname || "未填寫";
    var score = data.score !== undefined ? data.score : 0;
    var answers = data.answers || [];
    
    // 組裝寫入行
    var rowData = [
      timestamp,
      nickname,
      score,
      answers[0] || "",
      answers[1] || "",
      answers[2] || "",
      answers[3] || ""
    ];
    
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "資料已成功寫入試算表！",
      row: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 支援透過 GET 取得試算表網址，方便前端直接超連結開啟
function doGet(e) {
  try {
    var sheet = getOrCreateSheet();
    var parentSs = sheet.getParent();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheetUrl: parentSs.getUrl(),
      sheetId: parentSs.getId()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

// 取得或建立試算表核心邏輯
function getOrCreateSheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty("SHEET_ID");
  
  if (sheetId) {
    try {
      var ss = SpreadsheetApp.openById(sheetId);
      return ss.getActiveSheet();
    } catch (e) {
      // 試算表可能被刪除，清除紀錄並重新建立
      props.deleteProperty("SHEET_ID");
    }
  }
  
  // 建立全新試算表
  var ss = SpreadsheetApp.create("寫教學應用程式的五個等級 - Lv.2 測驗成績單");
  var sheet = ss.getActiveSheet();
  sheet.appendRow(["時間戳記", "座號/暱稱", "測驗得分", "題目 1 回答", "題目 2 回答", "題目 3 回答", "題目 4 回答"]);
  
  // 保存試算表 ID 到屬性服務中
  props.setProperty("SHEET_ID", ss.getId());
  
  return sheet;
}
