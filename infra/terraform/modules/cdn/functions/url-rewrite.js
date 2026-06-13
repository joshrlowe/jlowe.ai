// CloudFront viewer-request function: map directory/extensionless URIs to the
// static-export index.html that Next emits with trailingSlash:true. Associated
// on the default behavior only (asset paths always carry an extension).
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else if (!uri.split("/").pop().includes(".")) {
    request.uri = uri + "/index.html";
  }
  return request;
}
