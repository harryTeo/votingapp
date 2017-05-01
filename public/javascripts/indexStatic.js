// Close the Responsive Menu on Menu Item Click - Navbar Section
$('.navbar-collapse ul li a').click(function() {
  $('.navbar-toggle:visible').click();
});

// The following chunk of code is to simply remove the "#_=_" which appears in url after a facebook login (aesthetical reasons only)
if (window.location.hash == '#_=_'){
  // Check if the browser supports history.replaceState
  if (history.replaceState) {
    // Keep the exact URL up to the hash
    var cleanHref = window.location.href.split('#')[0];
    // Replace the URL in the address bar without messing with the back button.
    history.replaceState(null, null, cleanHref);
  } 
  else {
    // Well, you're on an old browser, we can get rid of the _=_ but not the #
    window.location.hash = '';
  }
}

// Handle New Poll Form - Profile Page
$("#newPoll .option.transparent button").click(function() { // The button to Add a New Option was clicked
	var newOptionId = Number($(this).closest("li").attr("id").split("newPollOption")[1]);
	// Append the new list item
	$("#newPoll li.option.transparent").before(
		'<li class="list-group-item option" id="newPollOption' + newOptionId + '">\
			<div class="input-group input-group-lg">\
				<span class="input-group-addon">' + newOptionId + '</span>\
				<input id="newPollOptionInput' + newOptionId + '" name="newPollOptionInput' + newOptionId + '" type="text" class="form-control" placeholder="Option ' + newOptionId + '">\
				<span class="input-group-btn">\
					<button class="btn btn-danger" type="button"><i class="fa fa-times" aria-hidden="true"></i></button>\
				</span>\
			</div>\
		</li>'
	);
	// Change the id-related attributes of the last list-group-item
	$("#newPoll li.option.transparent").attr("id","newPollOption" + (newOptionId + 1));
	$("#newPoll li.option.transparent .input-group-addon").text(newOptionId+1);
	$("#newPoll li.option.transparent input").attr("placeholder", "Option " + (newOptionId + 1));
	$("#newPoll li.option.transparent input").attr("id", "newPollOptionInput" + (newOptionId + 1));
	$("#newPoll li.option.transparent input").attr("name", "newPollOptionInput" + (newOptionId + 1));
});
$("#newPoll ul").on('click', "li.option button.btn-danger" , function() { // The button to Remove Option was clicked
  var removeOptionId = Number($(this).closest("li").attr("id").split("newPollOption")[1]);
  var lastListItemId = Number($("li.option.transparent").attr("id").split("newPollOption")[1]);
  $("#newPollOption"+removeOptionId).remove();
  for (var i=removeOptionId; i<lastListItemId; i++) {
		$("#newPollOption" + (i+1) + " .input-group-addon").text(i);
		$("#newPollOption" + (i+1) + " input").attr("placeholder", "Option " + i);  	
		$("#newPollOption" + (i+1) + " input").attr("id", "newPollOptionInput" + i);
		$("#newPollOption" + (i+1) + " input").attr("name", "newPollOptionInput" + i);		
		$("#newPollOption" + (i+1)).attr("id","newPollOption" + i);
  }
});
$("#newPoll input").keyup(function() { // Enable/Disable Submit Button according to completion of required fields
	if($("#pollSubject").val()!=="" && $("#newPollOptionInput1").val()!=="" && $("#newPollOptionInput2").val()!=="") {
		$("#newPoll :submit").prop("disabled", false);
	}
	else {
		$("#newPoll :submit").prop("disabled", true);
	}
});

// Handle Poll Deletion - Profile Page
$("#deletePollModal").on('show.bs.modal', function (event) {
	var pollSubject = event.relatedTarget.getAttribute("name");
	var pollId = event.relatedTarget.getAttribute("data-id");
  $("#deletePollModal .message").text('"' + pollSubject + '"');
  $("#deletePoll").attr("data-id", pollId);
})
$("#deletePollModal").on('hidden.bs.modal', function () {
  $("#deletePollModal .message").text("");
  $("#deletePoll").attr("data-id", "");
})
$("#deletePoll").click(function(event){
	$("#deletePoll").prop("disabled", true);
	var pollId = event.target.getAttribute("data-id");
	var csrf = $("input[name=_csrf]").val();
	$.ajax({
    type: "DELETE",
    url: "/poll/" + pollId, 
    headers: {
      'X-CSRF-TOKEN': csrf
    }
	})
	.done(function(data, textStatus, jqXHR){ // Success
		// console.log(data);
		location.reload();
	})
	.fail(function(jqXHR, textStatus, errorThrown){ // Failure
		// console.log(errorThrown);
		$("#deletePollModal").modal("hide");
		$("#deletePoll").prop("disabled", false);
		$("#deletePollErrorModal").modal("show");
		setTimeout(function(){
  		$("#deletePollErrorModal").modal("hide")
		}, 5000);
	})
	.always(function(){ // Always executed upon completion of ajax request
		// console.log("This part will be executed always!");
	});
});

// Handle Click of #shareOnTwitterButton - Individual Poll Page
$("#shareOnTwitterButton").click(function(event) {
	event.preventDefault();
	var href = $(this).attr("href");
	var width = $(window).width()>620 ? 620 : 300; // Define width, according to width of browser window
	var height = $(window).width()>620 ? 500 : 275; // Define height, according to width of browser window
  var left = (window.screen.width - width)  / 2; // Place in the middle of screen horizontally
  var top = (window.screen.height - height) / 2 - 30; // Place in the middle (almost!) of screen vertically
  var opts = 'status=1' + ',width=' + width + ',height=' + height + ',top=' + top + ',left=' + left;
  window.open(href,'Twitter',opts);
});

// Handle New Poll Options Submition (without using a form) - Individual Poll Page -> addPollOptionsModal 
$("#addPollOptionsModal .addPollOptionButton").click(function() { // The button to Add a New Option was clicked
	var optionIndex = Number($(this).closest("li").find(".input-group-addon").text());
	// Append the new list item
	$("#addPollOptionsModal li.option.transparent").before(
		'<li class="list-group-item option">\
			<div class="input-group input-group-lg">\
				<span class="input-group-addon">' + optionIndex + '</span>\
				<input type="text" class="form-control addPollOption" placeholder="Enter New Option">\
				<span class="input-group-btn">\
					<button class="btn btn-danger" type="button"><i class="fa fa-times" aria-hidden="true"></i></button>\
				</span>\
			</div>\
		</li>'
	);
	$("#addPollOptionsModal li.option.transparent .input-group-addon").text(optionIndex+1);
});
$("#addPollOptionsModal ul").on('click', "li.option button.btn-danger" , function() { // The button to Remove Option was clicked
  var removeOptionIndex = Number($(this).closest("li").find(".input-group-addon").text());
  $(this).closest("li").remove();
  var newOptionsIndexArray = $(".addPollOption").siblings(".input-group-addon");
  if(newOptionsIndexArray) {
	  for(var i=0; i<newOptionsIndexArray.length; i++){
	  	if(Number(newOptionsIndexArray[i].textContent)>removeOptionIndex) {
	  		newOptionsIndexArray[i].textContent = Number(newOptionsIndexArray[i].textContent)-1;
	  	}
	  }  	
  }
  $("#addPollOptionsModal li.option.transparent .input-group-addon").text(Number($("#addPollOptionsModal li.option.transparent .input-group-addon").text())-1);
}); 
$("#saveNewPollOptions").click(function(event){ // The button to Save  the New Options was clicked
	$("#saveNewPollOptions").prop("disabled", true);
	var pollId = event.target.getAttribute("data-id");
	var csrf = $("input[name=_csrf]").val();
	var newOptionsArrayInput = $(".addPollOption");
	var newOptionsArray = [];
	if(newOptionsArrayInput) {
		for(var i=0; i<newOptionsArrayInput.length; i++){
			if(newOptionsArrayInput[i].value.trim()) {
				newOptionsArray.push(newOptionsArrayInput[i].value.trim());
			}
	  }  			
	}
	if(newOptionsArray.length>0) {
		$.ajax({
	    type: "PUT",
	    url: "/poll/" + pollId, 
	 		data: JSON.stringify({ newOptionsArray: newOptionsArray }),
	 		contentType: 'application/json',
	    headers: {
	      'X-CSRF-TOKEN': csrf
	    }
		})
		.done(function(data, textStatus, jqXHR){ // Success
			// console.log(data);
			location.reload();
		})
		.fail(function(jqXHR, textStatus, errorThrown){ // Failure
			// console.log(errorThrown);
			$("#addPollOptionsModal").modal("hide");
			$("#saveNewPollOptions").prop("disabled", false);
			$("#addPollOptionsErrorModal").modal("show");
			setTimeout(function(){
	  		$("#addPollOptionsErrorModal").modal("hide")
			}, 5000);
		});
	}
	else {
		$("#addPollOptionsModal").modal("hide");
		$("#saveNewPollOptions").prop("disabled", false);
	}
});

// Handle Poll Form Submission - Individual Poll Page
$("#pollSection form").submit(function(event) {
	event.preventDefault();
	if ($('input[name=pollOptions]:checked').val()) { // Continue, iff an Option was Chosen (else do nothing)
		$("#pollSection form :submit").prop("disabled", true); // Temporarilly Disable the Submit Button
		var postURL = $("#pollSection form").attr("action");
		var formData = $("#pollSection form").serialize();
	  $.ajax({
	  	type: "POST",
	  	url: postURL, 
	  	data: formData
	  })
	  .done(function(serverData){
	  	if (serverData) { 
	  		var chartData =[];
	  		serverData.options.forEach((element, index) => chartData.push({option: element.option, votes: 0, backgroundColor: backgroundColorArray[index%backgroundColorArray.length], borderColor: borderColorArray[index%borderColorArray.length]}));
	  		for (var i=0; i<chartData.length; i++) {
	  			chartData[i].votes = serverData.votes.filter(vote => vote.option===chartData[i].option).length;
	  		}
	  		$('#pollChart').remove();
	  		$('iframe.chartjs-hidden-iframe').remove();
  			$('#pollChartContainer').append('<canvas id="pollChart" width="400" height="400"></canvas>');
	  		createPollChart(chartData, serverData.subject);
	  	}
	  	$("#pollSection form :submit").prop("disabled", false);
	  });	
	}
});

// Handle First Visit to specific Poll - Individual Poll Page
$(document).ready(function() {
	if($("#pollData").val()){
		var pollData = $("#pollData").val();
		pollData = JSON.parse(pollData);
		var chartData =[];
		pollData.options.forEach((element, index) => chartData.push({option: element.option, votes: 0, backgroundColor: backgroundColorArray[index%backgroundColorArray.length], borderColor: borderColorArray[index%borderColorArray.length]}));
		for (var i=0; i<chartData.length; i++) {
			chartData[i].votes = pollData.votes.filter(vote => vote.option===chartData[i].option).length;
		}
		$('#pollChart').remove();
		$('iframe.chartjs-hidden-iframe').remove();
		$('#pollChartContainer').append('<canvas id="pollChart" width="400" height="400"></canvas>');
		createPollChart(chartData, pollData.subject);		
	}
});

// Chart Colors Array
var backgroundColorArray = ['rgba(255,99,132,0.4)','rgba(54,162,235,0.4)','rgba(255,206,86,0.4)','rgba(75,192,192,0.4)','rgba(153,102,255,0.4)','rgba(255,159,64,0.4)','rgba(32,32,32,0.4)','rgba(255,153,204,0.4)','rgba(0,76,153,0.4)','rgba(153,153,0,0.4)'];
var borderColorArray = ['rgba(255,99,132,1)','rgba(54,162,235,1)','rgba(255,206,86,1)','rgba(75,192,192,1)','rgba(153,102,255,1)','rgba(255,159,64,1)','rgba(32,32,32,1)','rgba(255,153,204,1)','rgba(0,76,153,1)','rgba(153,153,0,1)'];

// Create the Poll Chart
function createPollChart(data, title){
	var ctx = document.getElementById("pollChart");
	var pollChart = new Chart(ctx, {
	  type: 'bar',
	  data: {
	    labels: data.map(element => element.option),
	    datasets: [{
	      label: '# of Votes',
	      data: data.map(element => element.votes),
	      backgroundColor: data.map(element => element.backgroundColor),
	      borderColor: data.map(element => element.borderColor),
	      borderWidth: 1
	    }]
	  },
	  options: {
      responsive: true,
      maintainAspectRatio: false,
	    legend: {
	      display: false
	    },	  	
      title: {
        display: true,
        text: title,
        fontSize: 18,
        padding: 22
      },	       	
		  scales: {
		    xAxes: [{
          gridLines: {
            display:false
          }
		    }],		  	
		    yAxes: [{  		    	
		      ticks: {
		        beginAtZero:true,
		        stepSize: 1,
		        // suggestedMax: 5
		      }
		    }]
		  }
	  }
	});
}