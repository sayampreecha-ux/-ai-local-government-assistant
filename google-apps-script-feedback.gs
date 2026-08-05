/** GovPrompt Thailand Feedback Receiver
 *  ผูกกับ Google Sheet แล้ว Deploy > New deployment > Web app
 *  Execute as: Me | Who has access: Anyone
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Feedback');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Feedback');
      sheet.appendRow(['timestamp','promptCode','rating','comment','device','version','page']);
    }
    var data = JSON.parse(e.postData.contents || '{}');
    sheet.appendRow([
      new Date(),
      sanitize_(data.promptCode),
      Number(data.rating) || '',
      sanitize_(data.comment),
      sanitize_(data.device),
      sanitize_(data.version),
      sanitize_(data.page)
    ]);
    return json_({ok:true});
  } catch (err) {
    return json_({ok:false,error:String(err)});
  }
}
function doGet() { return json_({ok:true,service:'GovPrompt Feedback'}); }
function sanitize_(value) {
  var text = String(value == null ? '' : value).slice(0, 2000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
