import textFieldEdit from "./text-field-edit.js"; //used for editing the forum text box without messing with the edit history

export default async function ({ addon, global, console }) {
  await addon.tab.loadScript("https://cdn.jsdelivr.net/npm/js-md5@0.7.3/src/md5.min.js");

  var projectUpload = false;
  //console.log("use project thumbnails: " + projectUpload); //commented out because spammy in console

  var toolbar =
    document.querySelector("#markItUpId_body > div > div.markItUpHeader > ul") ||
    document.querySelector("#markItUpId_signature > div > div.markItUpHeader > ul");

  var textBox = document.querySelector("#id_body") || document.querySelector("#id_signature");

  var uploadInput = document.createElement("input");

  uploadInput.type = "file";

  uploadInput.accept = "image/*";

  uploadInput.addEventListener("change", (e) => {
    var file = uploadInput.files[0];
    var extension = uploadInput.files[0].name.split(".").pop().toLowerCase();

    var reader = new FileReader();

    reader.readAsArrayBuffer(file);

    reader.onloadend = function () {
      if (projectUpload) {
        uploadProjectImage(reader.result);
      } else {
        uploadAssetImage(reader.result, extension);
      }
    };
    reader.onerror = (err) => {
      displayError("there was an error reading the file");
      throw err;
    };
  });

  uploadInput.style.display = "none";

  if (toolbar && textBox) {
    document.body.appendChild(uploadInput);
    document
      .querySelector(".markItUpButton5")
      .insertAdjacentHTML(
        "afterend",
        `<li class="markItUpButton markItUpButton17"><a id="uploadButton" href="javascript:;" title="Upload Image" style="background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABVUlEQVQ4jc3SO0tCYRzH8WcOegNtTb2BXkO1SNBuFyJqC1uihhqCNCIH8xKU8BzzcspQEskWC8IWcRCji8WxEnrSCKqh+dvQRTwcybZ+8J3+8Jn+QvyL2byHfDe9c7r/d8CdJlB5JVB5xeZOt10DcKV+gHazuVINQNi9iIUDizJfWdzsXhOQrDeXqOEz3vllvtbAngIgm822DKABJB6b27n/AeZST8zEqyylr4jmT3DsVi0A/a45rQxAOByme+2BzuUbRpOb3L4MIBbLSClNwHa5ua0SALFYDOeZTn/mnI6goke/pmvbsACCpUb+AsJfACASiTB1tULwfZF15Wb+eRDn27gFsHqE2Mh/5skhPDkANE2j/3iWseIkExcOhorD9F32moBh/4iwezEHIKVEKUWtVsMwDOr1OkopE9Bi34CUklAohK7rxONxotEomqa1Bfh++6QPwtgXjMvZERUAAAAASUVORK5CYII=');">Upload</a></li>`
      );

    document.querySelector("#uploadButton").onmousedown = (e) => {
      e.preventDefault();
      uploadInput.click();
    };

    textBox.addEventListener("paste", (e) => {
      retrieveImageFromClipboardAsBlob(e, function (imageBlob) {
        if (imageBlob) {
          if (projectUpload) {
            uploadProjectImage(imageBlob);
          } else {
            var reader = new FileReader();

            reader.readAsArrayBuffer(imageBlob);

            reader.onloadend = function () {
              var extension = imageBlob.name.split(".").pop().toLowerCase();

              uploadAssetImage(reader.result, extension);
            };
          }
        }
      });
    });

    //drag and drop. maybe it works on firefox 🤷‍♂️

    textBox.addEventListener("dragenter", () => {
      textBox.readonly = true;
      textBox.style.backgroundColor = "lightgrey";
    });

    textBox.addEventListener("dragleave", () => {
      textBox.readonly = false;
      textBox.style.backgroundColor = "white";
    });

    textBox.addEventListener("dragend", () => {
      textBox.readonly = false;
      textBox.style.backgroundColor = "white";
    });

    textBox.addEventListener("drop", (e) => {
      textBox.readonly = false;
      textBox.style.backgroundColor = "white";
      if ("undefined" == typeof e.dataTransfer.files[0]) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      e.dataTransfer.setData("image/*", "dummy"); //firefox support for drag i think

      var reader = new FileReader();

      var extension = e.dataTransfer.files[0].name.split(".").pop().toLowerCase();

      reader.readAsArrayBuffer(e.dataTransfer.files[0]);
      //console.log(e.dataTransfer)
      reader.onloadend = function () {
        if (projectUpload) {
          uploadProjectImage(reader.result);
        } else {
          uploadAssetImage(reader.result, extension);
        }
      };
      reader.onerror = (err) => {
        displayError("there was an error reading the file");
        throw err;
      };
    });
  }

  function displayError(message) {
    //display an error into the text box
    var items = [
      { name: "a cat", url: "https://cdn2.scratch.mit.edu/get_image/project/413649276_9000x7200.png" },
      { name: "a ufo cat", url: "https://cdn2.scratch.mit.edu/get_image/project/414016997_9000x7200.png" },
      { name: "an alpaca", url: "https://cdn2.scratch.mit.edu/get_image/project/414018264_9000x7200.png" },
      { name: "appel", url: "https://cdn2.scratch.mit.edu/get_image/project/414018433_9000x7200.png" },
    ];

    var randObj = items[Math.floor(Math.random() * items.length)];
    console.log("random object:", randObj);
    textFieldEdit.insert(
      textBox,
      `sorry, your image could not be uploaded. ${message} here is ${randObj.name}. [img]${randObj.url}[/img]`
    );
  }

  function makeid(length) {
    //used for random project ids to avoid the thing scratch does to projects with the same id (project-1)
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  function retrieveImageFromClipboardAsBlob(pasteEvent, callback) {
    if (pasteEvent.clipboardData == false) {
      if (typeof callback == "function") {
        callback(undefined);
      }
    }

    var items = pasteEvent.clipboardData.items;

    if (items == undefined) {
      if (typeof callback == "function") {
        callback(undefined);
      }
    }

    for (var i = 0; i < items.length; i++) {
      // Skip content if not image
      if (items[i].type.indexOf("image") == -1) continue;
      // Retrieve image on clipboard as blob
      var blob = items[i].getAsFile();

      if (typeof callback == "function") {
        callback(blob);
      }
    }
  }

  function trash(projectID, rand) {
    //send a project to the trash. it cannot perm delete the project
    console.log("trashing project " + projectID + " which was assigned the random id " + rand);
    fetch(`https://scratch.mit.edu/site-api/projects/all/${projectID}/`, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-csrftoken": addon.auth.csrfToken,
        "x-requested-with": "XMLHttpRequest",
      },
      referrer: "https://scratch.mit.edu/mystuff/",
      referrerPolicy: "no-referrer-when-downgrade",
      body: `{\"view_count\":0,\"favorite_count\":0,\"remixers_count\":0,\"creator\":{\"username\":\"Scratch\",\"pk\":53088961,\"thumbnail_url\":\"//uploads.scratch.mit.edu/users/avatars/default.png\",\"admin\":false},\"title\":\"Scratch Image Uploader Autogenerated Project ${rand}\",\"isPublished\":false,\"datetime_created\":\"2020-07-24T10:27:23\",\"thumbnail_url\":\"//uploads.scratch.mit.edu/projects/thumbnails/413641266.png\",\"visibility\":\"trshbyusr\",\"love_count\":0,\"datetime_modified\":\"2020-07-24T10:27:24\",\"uncached_thumbnail_url\":\"//cdn2.scratch.mit.edu/get_image/project/413641266_100x80.png\",\"thumbnail\":\"413641266.png\",\"datetime_shared\":null,\"commenters_count\":0,\"id\":413641266}`,
      method: "PUT",
      mode: "cors",
      credentials: "include",
    })
      .catch((err) => {
        displayError("we could not move the project to the trash folder. you should delete the project manually.");
        progresselement.remove();
        throw err;
      })
      .then((dummy) => {
        console.log("deleted project successfully 🎉");
      });
  }

  function uploadProjectImage(image) {
    //the main function
    var randomId = makeid(5);

    console.log("uploaded image: ", image);

    window.progresselement = toolbar.appendChild(document.createElement("li"));
    var token = addon.auth.xToken;

    progresselement.innerText = "creating project";

    fetch("https://projects.scratch.mit.edu/", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
      referrer: "https://scratch.mit.edu/projects/editor/",
      referrerPolicy: "no-referrer-when-downgrade",
      body:
        '{"targets":[{"isStage":true,"name":"Stage","variables":{"`jEk@4|i[#Fk?(8x)AV.-my variable":["my variable",0]},"lists":{},"broadcasts":{},"blocks":{},"comments":{},"currentCostume":0,"costumes":[{"assetId":"77582e3881becdac32ffd151dbb31f14","name":"backdrop1","bitmapResolution":1,"md5ext":"77582e3881becdac32ffd151dbb31f14.svg","dataFormat":"svg","rotationCenterX":381.96246447447436,"rotationCenterY":351.7889839939939}],"sounds":[],"volume":100,"layerOrder":0,"tempo":60,"videoTransparency":50,"videoState":"on","textToSpeechLanguage":null}],"monitors":[],"extensions":[],"meta":{"semver":"3.0.0","vm":"0.2.0-prerelease.20200720182258","agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36"}}',
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .catch((err) => {
        displayError("there was an error creating the project.");
        progresselement.remove();
        throw err;
      })
      .then((e) => e.json())
      .then((data) => {
        console.log("project creation response data: ", data);

        progresselement.innerText = "setting title";

        //set title
        console.log("project id: " + data["content-name"]);
        fetch("https://api.scratch.mit.edu/projects/" + data["content-name"], {
          headers: {
            accept: "application/json",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-token": token,
          },
          referrer: "https://scratch.mit.edu/projects/413617319/",
          referrerPolicy: "no-referrer-when-downgrade",
          body: `{\"title\":\"Scratch Image Uploader Autogenerated Project ${randomId}\"}`,
          method: "PUT",
          mode: "cors",
          credentials: "omit",
        })
          .catch((err) => {
            displayError("there was an error setting the project title.");
            progresselement.remove();
            throw err;
          })
          .then((thing) => {
            console.log("changed title successfully");

            progresselement.innerText = "setting thumbnail";

            $.ajax({
              //CREDIT TO WORLD LANGUAGES FOR THIS THING
              type: "POST",
              url: "/internalapi/project/thumbnail/" + data["content-name"] + "/set/",
              data: image,
              headers: {
                "X-csrftoken": addon.auth.csrfToken,
              },
              contentType: "",
              processData: false,
              xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = function (e) {
                  if (true) {
                    var progress = Math.floor((e.loaded / e.total) * 100) + "%";
                    progresselement.innerText = `uploading thumbnail... ${progress}`;
                  }
                };
                return xhr;
              },
              error: function () {
                displayError("perhaps try uploading a smaller image.");
                try {
                  progresselement.remove();
                } catch {}

                trash(data["content-name"], randomId); //delete the project if the upload failed
              },
              success: function (msg) {
                console.log("set thumbnail successfully");
                textFieldEdit.insert(
                  textBox,
                  `[img]https://cdn2.scratch.mit.edu/get_image/project/${data["content-name"]}_9000x7200.png[/img]`
                );
                try {
                  progresselement.remove();
                } catch {}

                uploadInput.value = null;

                trash(data["content-name"], randomId); //delete the project if the upload was successful
              },
            });
          });
      });
  }

  function uploadAssetImage(image, fileType) {
    //MAIN CODE
    window.progresselement = toolbar.appendChild(document.createElement("li"));

    console.log(image);

    var hash = md5(image);

    var type = fileType;

    console.log("type: " + fileType);

    progresselement.innerText = "uploading...";

    fetch(`https://assets.scratch.mit.edu/${hash}.${type}`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
      referrer: "https://scratch.mit.edu/projects/420455607/editor",
      referrerPolicy: "no-referrer-when-downgrade",
      body: image,
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        textFieldEdit.insert(textBox, `[img]https://assets.scratch.mit.edu/get_image/.%2E/${hash}.${type}[/img]`);
        progresselement.remove();
      })
      .catch((error) => {
        console.log("oh boi we got an error: ", error);
        displayError(error);
        progresselement.remove();
      });
  }
}
