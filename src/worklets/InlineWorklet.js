var URL = window.URL || window.webkitURL;

module.exports = function (content) {
  try {
    var blob;

    try {
      var BlobBuilder = window.BlobBuilder ||
      window.WebKitBlobBuilder ||
      window.MozBlobBuilder ||
      window.MSBlobBuilder;

      blob = new BlobBuilder();

      blob.append(content);

      blob = blob.getBlob('application/javascript; charset=utf-8');
    } catch (e) {
      blob = new Blob([content], { type: 'application/javascript; charset=utf-8' });
    }

    return URL.createObjectURL(blob);
  } catch (e) {
    return 'data:application/javascript,' + encodeURIComponent(content);
  }
};
