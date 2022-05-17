"use strict";

// ----------------------------------------------------------------------------

let isInMatch = false;
let isSpectating = false;
let spectatingElement = null;
let countdownText = "";
let countdownFont = null;
let creatorNameText = "";
let mapNameText = "";
let isLobby = false;
let isMatchAlreadyRunning = false;

let lobbyMapNameFont = null;
let lobbyMapCreatorFont = null;
let lobbyMapReadyFont = null;
let lobbyMapPlayersFont = null;
let lobbyMapReadyHelpFont = null;

let matchCountdown = 15;

let pricedownFontFilePath = "fonts/pricedown.ttf";

let lobbyCameraPosition = null;
let lobbyCameraLookAt = null;

let vehicleAITimers = [];

// ----------------------------------------------------------------------------

bindEventHandler("OnResourceReady", thisResource, function(event, resource) {
	let fontStream = openFile(pricedownFontFilePath);
	if(fontStream != null) {
		countdownFont = lucasFont.createFont(fontStream, 64.0);
		lobbyMapReadyFont = lucasFont.createFont(fontStream, 64.0);
		fontStream.close();
	}

	lobbyMapNameFont = lucasFont.createDefaultFont(36.0, "Roboto", "Light");
	lobbyMapCreatorFont = lucasFont.createDefaultFont(16.0, "Roboto", "Light");
	lobbyMapReadyHelpFont = lucasFont.createDefaultFont(12.0, "Roboto", "Light");
	lobbyMapPlayersFont = lucasFont.createDefaultFont(12.0, "Roboto", "Light");

	triggerNetworkEvent("sumo.client");

	bindKey(SDLK_F1, KEYSTATE_UP, function() { triggerNetworkEvent("sumo.reload") });
	bindKey(SDLK_SPACE, KEYSTATE_UP, function() { triggerNetworkEvent("sumo.ready") });
	bindKey(SDLK_LCTRL, KEYSTATE_UP, function() { triggerNetworkEvent("sumo.spectator") });
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.camera", function(x, y, z) {

});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.spectate", function() {
	//if(localPlayer == null) {
	//	gta.setCameraLookAt(lobbyCameraPosition, lobbyCameraLookAt, true);
	//	gta.fadeCamera(true, 1, COLOUR_BLACK);
	//	return false;
	//}

	localPlayer.interior = 2;
	localPlayer.position = lobbyCameraLookAt;
	gta.setCameraLookAt(lobbyCameraPosition, lobbyCameraLookAt, true);
	isSpectating = true;
	isLobby = false;
	spectatingElement = getElementFromId(elementId);
	gta.fadeCamera(true, 1, COLOUR_BLACK);
	console.log(getElementFromId(elementId));
	gta.setCameraTarget(getElementFromId(elementId), true, CAMMODE_CIRCLE);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.spawned", function() {
	isLobby = false;
	gta.restoreCamera(true);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.lobby", function(mapName, creatorName, cameraX, cameraY, cameraZ, lookAtX, lookAtY, lookAtZ, isMatchActive) {
	isLobby = true;
	mapNameText = mapName;
	creatorNameText = creatorName;

	isMatchAlreadyRunning = isMatchActive;

	setHUDEnabled(false);

	gta.time.minuteDuration = 99999;

	lobbyCameraPosition = new Vec3(cameraX, cameraY, cameraZ);
	lobbyCameraLookAt = new Vec3(lookAtX, lookAtY, lookAtZ);
	gta.setCameraLookAt(lobbyCameraPosition, lobbyCameraLookAt, true);
	gta.fadeCamera(true, 1, COLOUR_BLACK);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.lockcontrols", function() {
	gta.setPlayerControl(false);
	gui.showCursor(true, false);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.matchend", function() {
	clearVehicleAITimers();
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.go", function() {
	gta.setPlayerControl(true);
	gui.showCursor(false, true);

	getVehicles().forEach(function(vehicle) {
		if(vehicle.getData("sumo.ai") == true) {
			if(vehicle.isSyncer) {
				vehicle.setCarMission(3);
				vehicle.setCarCruiseSpeed(15);
				vehicle.setDrivingStyle(1);

				let changeUpInterval = setInterval(function() { changeUpVehicleAI(vehicle); }, Math.ceil(((Math.random() * 5))+5)*1000);
				vehicleAITimers.push(changeUpInterval);
			}
		}
	});
});

function changeUpVehicleAI(vehicle) {
	if(vehicle == null) {
		return false;
	}

	let speed = Math.ceil((Math.random() * 15)) + 15;
	vehicle.setCarCruiseSpeed(speed);

	if(gta.game == GAME_GTA_III) {
		let mission = Math.round(Math.random());
		if(mission == 1) {
			vehicle.setCarMission(5);
		} else {
			vehicle.setCarMission(3);
		}
	}

	if(gta.game == GAME_GTA_III) {
		let mission = Math.round(Math.random());
		if(mission == 1) {
			vehicle.setCarMission(5);
		} else {
			vehicle.setCarMission(3);
		}
	}

	//let style = Math.round((Math.random() * 2));
	//vehicle.setDrivingStyle(style);
}

function clearVehicleAITimers() {
	if(vehicleAITimers.length > 0) {
		vehicleAITimers.forEach(function(timer) {
			clearInterval(timer);
		});
	}
}

// ----------------------------------------------------------------------------

addEventHandler("OnMouseUp", function(event, mouse, button) {
	if(isSpectating && !isLobby) {
		switch(button) {
			case 0:
				triggerNetworkEvent("sumo.spectate.prev", spectatingElement);
				break;

			case 1:
				triggerNetworkEvent("sumo.spectate.next", spectatingElement);
				break;
		}
	}
});

// ----------------------------------------------------------------------------

addEventHandler("OnDrawnHUD", function(event) {
	if(isLobby) {
		if(lobbyMapNameFont != null) {
			lobbyMapNameFont.render(mapNameText, [0, 10], gta.width, 0.5, 0.0, lobbyMapNameFont.size, COLOUR_WHITE, false, false, false, true);
		}

		if(lobbyMapCreatorFont != null) {
			lobbyMapCreatorFont.render("Created by: " + creatorNameText, [0, 60], gta.width, 0.5, 0.0, lobbyMapCreatorFont.size, COLOUR_WHITE, false, false, false, true);
		}

		if(lobbyMapReadyFont != null) {
			let readyText = localClient.getData("sumo.ready") ? "READY" : "NOT READY";
			let readyColour = localClient.getData("sumo.ready") ? COLOUR_GREEN : COLOUR_RED;
			if(isMatchAlreadyRunning) {
				readyColour = COLOUR_YELLOW;
				readyText = "PLEASE WAIT"
			}

			lobbyMapReadyFont.render(readyText, [0, gta.height-150], gta.width, 0.5, 0.0, lobbyMapReadyFont.size, readyColour, false, false, false, true);
		}

		if(lobbyMapReadyHelpFont != null) {
			let helpText = "Press SPACE BAR when ready to play!";
			if(isMatchAlreadyRunning) {
				helpText = "A match is already running. Please wait until it finishes or press SHIFT to spawn as spectator!";
			}
			lobbyMapReadyHelpFont.render(helpText, [0, gta.height-25], gta.width, 0.5, 0.0, lobbyMapReadyHelpFont.size, COLOUR_WHITE, false, false, false, true);
		}
	}
});

// ----------------------------------------------------------------------------


