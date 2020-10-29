export default async function({ addon, global, console }) {
  while (true) {
    let nav = await addon.tab.waitForElement(".menu-bar_main-menu_3wjWH", {markAsSeen: true});
    let setthumb = document.createElement("div")
    setthumb.classList.add("menu-bar_menu-bar-item_oLDa-")
    let thumbinner = document.createElement("span")
    thumbinner.setAttribute("class", "button_outlined-button_1bS__ menu-bar_menu-bar-button_3IDN0 community-button_community-button_2Lo_g")
    thumbinner.setAttribute("role", "button")
    setthumb.append(thumbinner)
    let thumbcontent = document.createElement("div")
    setthumb.classList.add("button_content_3jdgj")
    thumbinner.append(thumbcontent)
    let thumbspan = document.createElement("span")
    thumbspan.innerText = "Set Thumbnail"
    thumbcontent.append(thumbspan)
    nav.append(setthumb)
    setthumb.addEventListener("click", function(e) {
      var parser = document.createElement("a");
      parser.href = document.location.href;
      var projectID = parser.pathname.replace(/\D/g, '');
      var script = document.createElement('script');
      script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js';
      script.type = 'text/javascript';
      script.onload = animThumbnailMain;
      document.getElementsByTagName('head')[0].appendChild(script);

      function animThumbnailMain() {
        let snackBarCSS = function() {
          var css = document.createElement("style");
          css.innerHTML = '#snackbar { visibility: hidden; min-width: 250px; margin-left: -125px; background-color: black; color: #fff; text-align: center; border-radius: 2px; padding: 16px; position: fixed; z-index: 1; left: 50%; top: 50px; } #snackbar.show { visibility: visible; } ';
          document.head.appendChild(css);
        }

        let error = function error(err) {
          if (String(err).includes("parameter 1 is not of type 'Blob'.")) {
            document.getElementById("snackbar").innerHTML = 'Error - please upload a downloaded file,<br> not an image from another website.<br><a id="selectThumbnailFile">Select an image</a><br><a onclick="document.getElementById(\'snackbar\').className=\'\';">Close</a>';
            document.getElementById("selectThumbnailFile").onclick = function() {
              document.getElementById("uploadthumbnail").click();
            };
          } else {
            document.getElementById("snackbar").innerHTML = 'Error - try a smaller image.<br><a id="selectThumbnailFile">Select an image</a><br><a onclick="document.getElementById(\'snackbar\').className=\'\';">Close</a>';
            document.getElementById("selectThumbnailFile").onclick = function() {
              document.getElementById("uploadthumbnail").click();
            };
          }
        }

        let getCookie = function getCookie(name) {
          var value = "; " + document.cookie;
          var parts = value.split("; " + name + "=");
          if (parts.length == 2) return parts.pop().split(";").shift();
        }

        let upload = function upload(filelocation) {

          document.getElementById("snackbar").innerHTML = "Reading file...";

          var reader1 = new FileReader();

          try {
            reader1.readAsDataURL(filelocation);
          } catch (err) {
            error(err);
            return;
          }

          var reader = new FileReader();
          reader.onload = function(e2) {
            $.ajax({
              type: "POST",
              url: "/internalapi/project/thumbnail/" + projectID + "/set/",
              data: e2.target.result,
              headers: {
                "X-csrftoken": getCookie("scratchcsrftoken"),
              },
              contentType: "",
              processData: false,
              xhr: function() {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = function(e) {
                  if (!document.getElementById("snackbar").innerText.includes("Error")) {
                    var progress = Math.floor(e.loaded / e.total * 100) + '%';
                    document.getElementById("snackbar").innerText = "Uploading file " + progress;
                  }
                };
                return xhr;
              },
              success: function(msg) {
                document.getElementById("snackbar").innerHTML = 'The thumbnail was successfully changed.<br><a id="selectThumbnailFile">Select another image</a><br><a onclick="document.getElementById(\'snackbar\').className=\'\';">Close</a>';
                document.getElementById("selectThumbnailFile").onclick = function() {
                  document.getElementById("uploadthumbnail").click();
                };
              },
              error: function() {
                error();
              }
            });
          };
          reader.readAsArrayBuffer(filelocation);
        }

        snackBarCSS();

        var snackbar = document.createElement("div");
        snackbar.id = "snackbar";
        document.body.appendChild(snackbar);
        document.getElementById("snackbar").innerHTML = '<a id="selectThumbnailFile">Select an image</a> or drag and drop anywhere on this page.<br>Best Thumbnail size is 480x360.<br><a onclick="document.getElementById(\'snackbar\').className=\'\';">Close</a>';
        document.getElementById("selectThumbnailFile").onclick = function() {
          document.getElementById("uploadthumbnail").click();
        };
        document.getElementById("snackbar").className = "show";

        if (!document.getElementById("uploadthumbnail")) {
          var file = document.createElement("input");
          file.id = "uploadthumbnail";
          file.setAttribute("type", "file");
          file.setAttribute("accept", "image/*");
          document.body.appendChild(file);
          document.getElementById("uploadthumbnail").onchange = function() {
            if (document.getElementById('uploadthumbnail').files[0]) upload(document.getElementById('uploadthumbnail').files[0]);
          };
        } else {
          document.getElementById("uploadthumbnail").click();
        }

        if (!document.getElementById("uploadthumbnaildrag")) {
          var dragloaded = document.createElement("span");
          dragloaded.id = "uploadthumbnaildrag";
          document.body.appendChild(dragloaded);

          var dropper = $(document);
          dropper.on("dragover", function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.originalEvent.dataTransfer.dropEffect = "copy";
          });
          dropper.on("drop", function(e) {
            e.stopPropagation();
            e.preventDefault();
            upload(e.originalEvent.dataTransfer.items[0].getAsFile());
          });
        }
      }
    })
  }
}
