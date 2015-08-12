'use strict';
// Library for communicating with Sia-UI
const IPC = require('ipc');
// Library for arbitrary precision in numbers
const BigNumber = require('bignumber.js');
// Ensure precision
BigNumber.config({ DECIMAL_PLACES: 24 });
BigNumber.config({ EXPONENTIAL_AT: 1e+9 });
// Keeps track of if the view is shown
var updating;

// Make API calls, sending a channel name to listen for responses
function update() {
	IPC.sendToHost('api-call', '/wallet/status', 'balance-update');
	IPC.sendToHost('api-call', '/gateway/status', 'peers-update');
	IPC.sendToHost('api-call', '/consensus/status', 'height-update');
	updating = setTimeout(update, 1000);
}

// Updates element text
function updateField(err, caption, newValue, elementID) {
	if (err) {
		console.error(err);
	} else if (newValue === null) {
		console.error('Unknown occurence: no error and no result from API call!');
	} else {
		document.getElementById(elementID).innerHTML = caption + newValue;
	}
}

// Convert to Siacoin
function formatSiacoin(hastings) {
	var ConversionFactor = new BigNumber(10).pow(24);
	var display = new BigNumber(hastings).dividedBy(ConversionFactor);
	return display + ' SC';
}

// Called by the UI upon showing
function start() {
	// DEVTOOL: uncomment to bring up devtools on plugin view
	// IPC.sendToHost('devtools');
	
	// Call the API regularly to update page
	updating = setTimeout(update, 0);
}

// Called by the UI upon transitioning away from this view
function stop() {
	clearTimeout(updating);
}

// Ask UI to show tooltip bubble
function tooltip(message, element) {
	var rect = element.getBoundingClientRect();
	IPC.sendToHost('tooltip', message, {
		top: rect.top,
		bottom: rect.bottom,
		left: rect.left,
		right: rect.right,
		height: rect.height,
		width: rect.width,
		length: rect.length,
	});
}

document.getElementById('stop-exit').onclick = function() {
	IPC.sendToHost('api-call', '/daemon/stop');
	tooltip('Bye!', this);
}

// Define IPC listeners and update DOM per call
IPC.on('balance-update', function(err, result) {
	updateField(err, 'Balance: ', formatSiacoin(result.Balance), 'balance');
});
IPC.on('peers-update', function(err, result) {
	updateField(err, 'Peers: ', result.Peers.length, 'peers');
});
IPC.on('height-update', function(err, result) {
	updateField(err, 'Block Height: ', result.Height, 'height');
});

