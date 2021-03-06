var last_id = 0;
var sound = 1;
var news = 0;
var upd = 0;
var hl = 0;
var skipsystem = 1;
var click;
var active_user;

$(document).ready(function(){
	$(window).blur(function() {
	  if(click == 1)
	  {
	    $("#chatUsers LI#chatuser_"+active_user+" IMG.activestatus").attr("src","/components/ajaxchat/img/offline.png");
	    $.ajax({
	      url:	'/ajaxchat/userstatus',
	      type:	'post',
	      data:	'status=offlie'
	    })
	  }
	  else
	  {
	    click = 1;
	  }
	});
	
	$(window).focus(function() {
	  $("#chatUsers LI#chatuser_"+active_user+" IMG.activestatus").attr("src","/components/ajaxchat/img/online.png");
	  $.ajax({
	    url:	'/ajaxchat/userstatus',
	    type:	'post',
	    data:	'status=online'
	  }) 
	});
	
	get_userlist();
	get_messages();
	setInterval(loadNewMessages, 5000);
	setInterval(onLineUsers, 15000);

	$f("player", "http://releases.flowplayer.org/swf/flowplayer-3.2.14.swf",{
	  clip:{
	    autoPlay: false,
	  },
	  playlist:
	  [
	    {url: "/components/ajaxchat/sounds/Im-User-Auth.mp3"},
	    {url: "/components/ajaxchat/sounds/Im-Message-In.mp3"},
	    {url: "/components/ajaxchat/sounds/Im-Sms.mp3"}
	  ]
	});

	var code = null;

	$("#chatText").keypress(function(e)
        {
            code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13)
	    {
	      sendMessage();
	    };
        });
	
	$("#chatrum").addClass("active");

	$("#chatTopBar UL LI").click(function(){listTab($(this).attr("id"))});
	
});

function get_userlist()
{
  $('#flag').removeClass();
  $('#flag').addClass('yellow');
  $.ajax({
    url:	'/ajaxchat/get_userlist',
    type:   	'post',
    success: function(json)
      {
	$("#chatUsers").html("<ul></ul>");
	var users = jQuery.parseJSON(json);
	if(!users)
	{
	  $('#flag').removeClass();
	  $('#flag').addClass('red');
	  alert("Получены неверные данные: отсутствует список пользователей");
	}
	else
	{
	  $.each(users, function(){
	    if(!this.imageurl)
	    {
	      this.imageurl = "nopic.jpg";
	    }
	    if(this.active)
	    {
	      active_user = this.user_id;
	    }
	    var userstring = '<li class="chatuser" id="chatuser_'+this.user_id+'"><a href="/users/'+this.login+'">';
	    if(this.on_chat == "1")
	    {
	      userstring += '<img class="activestatus" src="/components/ajaxchat/img/online.png">';
	    }
	    else
	    {
	      userstring += '<img class="activestatus" src="/components/ajaxchat/img/offline.png">';
	    }
	    userstring += '<img src="/images/users/avatars/small/'+this.imageurl+'">'+this.nickname+'</a></li>';
	    $("#chatUsers UL").append(userstring);
	  });
	  $('#flag').removeClass();
	  $('#flag').addClass('green');
	}
      }
  });
}

function get_messages()
{
  $('#flag').removeClass();
  $('#flag').addClass('yellow');
  $.ajax({
    url:	'/ajaxchat/get_messages',
    type:	'post',
    data:	'skipsystem=1',
    success:	function(json)
    {
      $("#chatLineHolder").html("<ul></ul>");
      var str = jQuery.parseJSON(json);
      if(!str)
      {
	$('#flag').addClass('red');
	alert("Получены неверные данные: отсутствует список сообщений");
      }
      else if(str.error)
      {
	$('#flag').removeClass();
	$('#flag').addClass('red');
	alert(str.error_message);
      }
      else
      {
	$.each(str.messages,function(){
	  $("#chatLineHolder UL").append(formatMessage(this));
	    last_id = this.id;
	});
	
	$.each(str.dialogs,function(){
	  if($('#open_'+from_id).text().length == 0)
	  {
	    from_id = this.from_id;
	    $("#chatTopBar UL").append("<li id=\"open_"+this.from_id+"\" class=\"dialog\">"+this.from_nickname+"</div>");
	    $("#open_"+from_id).click(function(){listTab("open_"+from_id)});
	  }
	})
      }
      var height = $("#chatLineHolder UL").height();
      $("#chatLineHolder").animate({"scrollTop":height},"fast");
      $('#flag').removeClass();
      $('#flag').addClass('green');
    }
  });
}

function sendMessage()
{
  $('#flag').removeClass();
  $('#flag').addClass('yellow');
  var message = $("#chatText").val();
  var id = $(".active").attr("id");

  if(message.length >= 2)
  {
    if(message == "/clean")
    {
      $("#chatLineHolder UL").html("");
    }
    else if(message == "/sound on")
    {
      sound = 1;
    }
    else if(message == "/sound off")
    {
      sound = 0;
    }
    else if(message == "/help")
    {
      $.ajax({
	url:	"/ajaxchat/get_help",
	type:	"post",
	success: function(help)
	{
	  $("#chatLineHolder UL").append("<li>"+help+"</li>");
	  $("#chatLineHolder").scrollTop("99999999");
	}
      });
    }
    else
    {
      $.ajax({
	url:	'/ajaxchat/send_message',
	type:	'post',
	data:	'message='+message+'&id='+id,
	success: function(answer)
	{
	  if(answer == "pass")
	  {
	    if(upd == 0)
	    {
	      loadNewMessages();
	    }
	    
	    if(id)
	    {
	      var act_nickname = $('#chatuser_'+active_user).text();
	      $("#dialogLineHolder UL").append("<li class=\"mess_stub\" style=\"color:black\"><tt>00:00:00</tt> <b>"+act_nickname+"</b>:"+message+"</li>");
	    }
	  }
	  else
	  {
	    $('#flag').removeClass();
	    $('#flag').addClass('red');
	    alert(answer);
	  }
	}
      });
    }
  }
  $('#flag').removeClass();
  $('#flag').addClass('green');
  $("#chatText").val("");
}

function onLineUsers()
{
  $('#flag').removeClass();
  $('#flag').addClass('yellow');
  $.ajax({
    url:	"/ajaxchat/get_userlist",
    type:	"post",
    success: function(json)
    {
      var users = jQuery.parseJSON(json);
      if(users)
      {
	$("#chatUsers UL").children().addClass("oldOnlineUsers");
	$.each(users,function(){
	  if(!this.imageurl)
	  {
	    this.imageurl = "nopic.jpg";
	  }

	  if($("#chatuser_"+this.user_id).text().length == 0)
	  {
	    var userstring = '<li class="chatuser" id="chatuser_'+this.user_id+'"><a href="/users/'+this.login+'">';
	    if(this.on_chat == "1")
	    {
	      userstring += '<img class="activestatus" src="/components/ajaxchat/img/online.png">';
	    }
	    else
	    {
	      userstring += '<img class="activestatus" src="/components/ajaxchat/img/offline.png">';
	    }
	    userstring += '<img src="/images/users/avatars/small/'+this.imageurl+'">'+this.nickname+'</a></li>';
	    $("#chatUsers UL").append(userstring);
	    if(sound == 1)
	    {
	      $f().play(0);
	    }
	    $("#chatLineHolder").scrollTop("99999999");
	  }
	  else
	  {
	    $("#chatuser_"+this.user_id).removeClass("oldOnlineUsers");
	  }
	});
	$(".oldOnlineUsers").remove();
      }
      $('#flag').removeClass();
      $('#flag').addClass('green');
    }
  });

}

function loadNewMessages()
{
  $('#flag').removeClass();
  $('#flag').addClass('yellow');
  
  if(upd == 0)
  {
    upd = 1;
    $.ajax({
      url:	"/ajaxchat/load_new",
      type:	"post",
      data:	"last_id="+last_id+"&skipsystem="+skipsystem,
      success: function(json)
      {
	var str = jQuery.parseJSON(json);
	if(!str)
	{
	  $('#flag').removeClass();
	  $('#flag').addClass('blue');
	  return false;
	}
	
	if(str.messages)
	{
	  $.each(str.messages,function(){
	    if($("#mess_"+this.id).text().length == 0)
	    {
	      $("#chatLineHolder UL").append(formatMessage(this));
	      if(last_id < this.id)
	      {
		last_id = this.id;
	      }
	      if(this.hl)
	      {
		hl = 1;
	      }
	      news = 1;
	    }
	  });
	
	 if(news == 1)
	  {
	    if(sound == 1)
	    {
	      if(hl == 1)
	      {
		$f().play(2);
	      }
	      else
	      {
		$f().play(1);
	      }
	    }
	    news = 0;
	    hl = 0;
	  }
	  $('#flag').addClass('green');
	  $("#chatLineHolder").scrollTop("99999999");
	}
	else
	{
	  $('#flag').removeClass();
	  $('#flag').addClass('green');
	}
	
	if(str.dialogs)
	{
	  $.each(str.dialogs,function(){
	    from_id = this.from_id;

	    if($('#open_'+from_id).text().length == 0)
	    {
	      $("#chatTopBar UL").append("<li id=\"open_"+this.from_id+"\" class=\"dialog\">"+this.from_nickname+"</div>");
	      $("#open_"+from_id).click(function(){listTab("open_"+from_id)});
	    }
	    else if($('#open_'+from_id).hasClass('active'))
	    {
	      loadDialog(from_id);
	    }
	  })
	}
      }
    });
    upd = 0;
  }
}

function addLogin(login)
{
  $("#chatText").val("/to "+login+" ");
  $("#chatText").focus();
}

function listTab(tab)
{
  $("#chatTopBar UL LI").removeClass("active");
  $("#"+tab).addClass("active");
  if(tab == "chatrum")
  {
    $("#chatLineHolder").show();
    $("#chatBottomBar").show();
    $("#dialogLineHolder").hide();
    $("#chatUsers").show();
    $("#chatLineHolder").scrollTop("99999999");
    id = "";
  }
  else
  {
    $("#chatLineHolder").hide();
    $("#dialogLineHolder").show();
    $("#chatBottomBar").show();
    $("#chatUsers").hide();
    if($("#"+tab).hasClass("dialog"))
    {
      id = tab.replace("open_","");
      loadDialog(tab);
    }
  }
}

function formatMessage(mess)
{
  if(!mess.imageurl)
  {
    mess.imageurl = "nopic.jpg";
  }
  if(mess.user_id == "0")
  {
    var str = "<li class=\"sysmes\" id=\"mess_"+mess.id+"\"><tt>"+mess.time+"</tt> <i>"+mess.message+"</i></li>";
  }
  else if(mess.to_id == "0")
  {
    var str = "<li id=\"mess_"+mess.id+"\" style=\"color:"+mess.color+"\"><tt onClick=\"fixMess(this)\">"+mess.time+"</tt> <b"; 
    if(mess.login)
    {
      if(mess.from_id != active_user)
      {
	str += " onClick=addLogin('"+mess.login+"')";
      }
    }
    str += ">"+mess.nickname+"</b>:"+mess.message+"</li>";
  }
  else
  {
    var cls = "";
    if(mess.to_id == active_user)
    {
      cls = "toyou";
    }
    var str = "<li class=\""+cls+"\" id=\"mess_"+mess.id+"\" style=\"color:"+mess.color+"\"><tt onClick=\"fixMess(this)\">"+mess.time+"</tt> <b onClick=addLogin('"+mess.login+"')>"+mess.nickname+"</b> для <b ";
    if(mess.to_id != active_user)
    {
      str += "onClick=addLogin('"+mess.to_login+"')";
    }
    str += ">"+mess.to_nickname+"</b>:"+mess.message+"</li>";
  }
  return str;
}

function loadDialog(id)
{
  $.ajax({
    url:	"/ajaxchat/get_converstation",
    type:	"post",
    data:	"id="+id,
    success: function(json)
    {
      var dialog = jQuery.parseJSON(json);
      if(dialog)
      {
	$("#dialogLineHolder").html("<ul></ul>");
	$.each(dialog.messages, function(){
	    $("#dialogLineHolder UL").append(formatMessage(this));
	});
	var height = $("#dialogLineHolder UL").height();
	$("#dialogLineHolder").animate({"scrollTop":height},"fast");
      }
    }
  });
}

function loadUser(id)
{
  if(active_user != id)
  {
    username = $('#chatuser_'+id).text()
    $("#chatTopBar UL").append("<li id=\"open_"+id+"\" class=\"dialog\">"+username+"</div>");
    $("#open_"+id).click(function(){listTab("open_"+id)});    
    listTab("open_"+id);
    loadDialog(id);
  }
}

function sysMes()
{
  if(skipsystem == 0)
  {
    $("#sysvoice").removeClass("on");
    skipsystem = 1;
  }
  else
  {
    $("#sysvoice").addClass("on");
    skipsystem = 0;
  }
}

function sysSound()
{
  if(sound == 1)
  {
    $("#sound").addClass("off");
    sound = 0;
  }
  else
  {
    $("#sound").removeClass("off");
    sound = 1;
  }
}

function fixMess(mess)
{
  var id = $(mess).parent().attr("id");
  if($("#"+id).hasClass("fixed"))
  {
    $("#"+id).removeClass("fixed");
  }
  else
  {
    var fcount = $(".fixed").size();
    var top = 50+20*fcount;
    $("#"+id).addClass("fixed");
    $("#"+id).css("top",top+"px");
  }
}