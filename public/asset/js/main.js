const LapsManager = {
	ValidatedLogin: null,
	// btoa
	
	SubmitLoginForm: function() {
		jQuery("#floatingInput").attr("disabled", true);
		jQuery("#floatingPassword").attr("disabled", true);
		LapsManager.ValidateLogin(jQuery("#floatingInput").val(), jQuery("#floatingPassword").val()).then(function(IsSuccess) {
			jQuery("#floatingInput").removeAttr("disabled");
			jQuery("#floatingPassword").removeAttr("disabled");
			if(!IsSuccess) {
				jQuery("#InvalidLogin").slideDown();
				setTimeout(function() { jQuery("#InvalidLogin").slideUp(); }, 3000);
				return;
			}
			jQuery("main.form-signin").slideUp();
			jQuery("main.container").slideDown();
			jQuery("body").removeClass("text-center");
			LapsManager.RefreshComputerList();
		}).catch(function(err) { console.log(err); });
		
		return false;
	},
	
	ValidateLogin: function(Username, Password) {
		return new Promise(function(resolve, reject) {
			LapsManager.SetLogin(Username, Password);
			LapsManager.DoRequest("/me").then(function(UserInfo) {
				if(typeof UserInfo.Name == "undefined") {
					LapsManager.ValidatedLogin = null;
					return resolve(false);
				} else {
					return resolve(true);
				}
			}).catch(function(err) {
				LapsManager.ValidatedLogin = null;
				return resolve(false);
			});
		});
	},
	
	SetLogin: function(Username, Password) {
		LapsManager.ValidatedLogin = btoa(btoa(Username) +":"+ btoa(Password));
	},
	
	RefreshComputerList: function() {
		LapsManager.DoRequest("/computers/all").then(function(data) {
			var html = "";
			for(var i = 0; i < data.length; i++) {
				html += LapsManager.BuildSingleComputer(data[i]);
			}
			jQuery("#ComputerList").html(html);
		}).catch(function(err) {
			jQuery("#ComputerList").html('<div class="callout callout-danger">Failed to fetch: '+ JSON.stringify(err) +'</div>');
		});
	},
	
	BuildSingleComputer: function(Computer) {
		var d = Computer.Expire == null ? null : new Date(Computer.Expire);
		if(d != null) d = ("0"+d.getDate()).slice(-2) +"."+ ("0"+(d.getMonth()+1)).slice(-2) +"."+ d.getFullYear()
		return '<div class="col-12 col-md-6 col-lg-4 mb-3"><div class="card">'
			+'<div class="card-header">'+ htmlentities(Computer.DNS) +'</div>'
			+'<div class="card-body p-0">'
				+'<table class="table mb-0"><tbody>'
					+'<tr><th>CN</th><td>'+ htmlentities(Computer.CN) +'</td></tr>'
					+'<tr><th>OS</th><td>'+ htmlentities(Computer.OS.replace('Windows ', '')) +'</td></tr>'
					+'<tr><th>User</th><td>'+ (Computer.Password == null ? '<i>N/A</i>' : htmlentities(Computer.Username)) +'</td></tr>'
					+'<tr><th>Pass</th><td>'+ (Computer.Password == null ? '<i>N/A</i>' : '<button class="btn btn-sm btn-primary" onClick="LapsManager.AlertPassword(&quot;'+ escape(Computer.Password) +'&quot;)">Anzeigen</button>') +'</td></tr>'
					+'<tr><th>Expire</th><td>'+ (d == null ? '<i>N/A</i>' : htmlentities(d)) +'</td></tr>'
				+'</tbody></table>'
			+'</div>'
		+'</div></div>';
	},
	
	AlertPassword: function(PWD) {
		var html = '<div class="form-group">'
			+'<label>Passwort</label>'
			+'<input class="form-control" value="'+ htmlentities(PWD) +'" disabled="disabled" />'
		+'</div>';
		bootbox.alert(html);
	},
	
	DoRequest: function(URL) {
		return new Promise(function(resolve, reject) {
			var properties = {
				"type": "GET",
				"url": URL
			};
			if(LapsManager.ValidatedLogin != null)
				properties.beforeSend = function(xhr) { xhr.setRequestHeader("Authorization", "Basic "+ LapsManager.ValidatedLogin); };
			jQuery.ajax(properties).done(function(data) {
				return resolve(JSON.parse(data));
			}).fail(function(err) {
				return reject(err);
			});
		});
	},
	
	Search: function() {
		var text = jQuery("#searchComputers").val();
		if(text.length == 0) jQuery("");
	}
};

function htmlentities(str) { return jQuery("<div />").text(str).html(); }