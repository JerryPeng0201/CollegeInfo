$(function () {

  var groupId;

  $.ajax({
      type: "GET",
      url: "/api/chatgroup"
  }).success(function (groups) {
      groupId = group_list[0].id;
      getMessages();
      $.each(groups, function (key, group) {
          var a = '<a href="#" data-group-id="' + group.id + '" class="group list-group-item">' + group.name + '</a>';
          $("#groups").append(a);
      });

  });

  $("#post").click(function () {
      var message = {text: $("#message").val()};

      $.ajax({
          type: "POST",
          url: "/api/groups/" + groupId + "/messages",
          data: JSON.stringify(message),
          contentType : "application/json"
      }).success(function () {
          $("#message").val("");
          getMessages();
      });
  });

  $('body').on('click', 'a.group', function (event) {
      groupId = $(event.target).attr("data-group-id");
      getMessages();
  });

  function getMessages() {
      $.ajax({
          type: "GET",
          url: "/api/groups/" + groupId + "/messages",
      }).success(function (data) {
          $("#groupName").text("Messages for " + data.group.name);
          var messages = "";
          $.each(data.messages, function (key, message) {
              messages += message.text + "\r";
          });
          $("#messages").val(messages);
      });
  }

  $("#delete").click(function(){
      $.ajax({
          type: "DELETE",
          url: "/api/groups/" + groupId + "/messages",
      }).success(function () {
          $("#messages").val("");
      });
  });


});