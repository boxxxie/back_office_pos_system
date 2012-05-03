

var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/";
var MenuButton = couchDoc.extend(
    {
	urlRoot:urlBase + "menu_buttons",
	emptyMenuButton:function(){
	    return {
		"display": {
		    "is_enabled": false,
		    "image": "",
		    "color": "255,255,255",
		    "description": [" ", " ", " "]
		},
		"foodItem": {
		    "price": "",
		    "apply_taxes": {
			"exemption": false,
			"tax1": true,
			"tax2": true,
			"tax3": false
		    },
		    "use_scale": false,
		    "print_to_kitchen": false,
		    "duplicate": false,
		    "has_modifier": false
		}
	    };
	}
    });