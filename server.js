"use strict";

// ----------------------------------------------------------------------------

let matchStarted = false;

let matchStartTime = 0;
let matchCountdownTimer = null;
let matchCountdown = 5;
let matchMap = false;

let isMapLoaded = false;
let matchEndCountdown = 0;

// ----------------------------------------------------------------------------

let remainingPlayers = [];
let remainingSpawns = [];
let matchObjects = [];

// ----------------------------------------------------------------------------

addEvent("OnMapLoaded", 1);
addEvent("OnPlayerReadyForMatch", 1);
addEvent("OnPlayerSwitchToSpectator", 1);

// ----------------------------------------------------------------------------

let lobbyCamera = [
	// Camera Position						// Look-At Position
	false,
	[new Vec3(-1176.481, -17.694, 75.992), 	new Vec3(-1175.726, -17.055, 75.847)],		// GTA III
	[new Vec3(-1176.481, -17.694, 75.992), 	new Vec3(-1175.726, -17.055, 75.847)],		// GTA Vice City
	[new Vec3(1549.44, -1674.01, 54.86), 	new Vec3(1515.02, -1673.76, 18.42)], 		// GTA San Andreas
	[new Vec3(1549.44, -1674.01, 54.86), 	new Vec3(1515.02, -1673.76, 18.42)] 		// GTA Underground
];

// ----------------------------------------------------------------------------

let sumoSkins = [
	null,
	84,
	0,
	264
];

// ----------------------------------------------------------------------------

let sumoVehicles = [
	null,
	[90,91,92,93,94,95,96,97,98,99,100,101,102,
	103,104,105,106,107,108,109,110,111,112,113,
	114,115,117,118,119,121,123,127,128,129,130,
	132,133,134,135,136,137,138,139,145,146,148,149],
	[],
	[445,602,416,485,568,429,433,499,424,536,496,
	504,422,609,498,401,575,518,402,541,482,431,
	438,457,527,483,524,415,542,589,437,532,480,
	596,599,597,598,578,486,507,562,585,427,419,
	587,490,528,533,544,407,565,455,530,526,466,
	604,492,474,588,434,502,503,494,579,545,411,
	546,559,508,571,400,403,517,410,551,500,418,
	572,423,414,516,582,467,443,470,404,514,603,
	600,413,426,436,547,489,515,479,
	534,505,442,440,475,543,605,495,567,428,
	405,535,458,580,439,561,409,560,550,506,
	574,566,549,420,459,576,525,531,406,583,451,
	558,552,540,491,412,478,421,529,555,456,554,
	477,406,556,444,573,539],
];

// ----------------------------------------------------------------------------

let spectatorVehicle = [
	null,
	131,
	171,
	441,
];

// ----------------------------------------------------------------------------

let bigSumoVehicles = [
	null,
	[97, 98, 106, 117, 121, 127, 132, 133, 145],
	[],
	[],
];

// ----------------------------------------------------------------------------

bindEventHandler("OnResourceStart", thisResource, function(event, resource) {
	matchStarted = false;
	initMatch();
});

// ----------------------------------------------------------------------------

bindEventHandler("OnResourceStop", thisResource, function(event, resource) {
	collectAllGarbage();
});

// ----------------------------------------------------------------------------

addEventHandler("OnPlayerJoined", function(event, client) {
	message(`${client.name} has joined the server!`, COLOUR_AQUA);
});

// ----------------------------------------------------------------------------

addEventHandler("OnPlayerQuit", function(event, client) {
	removePlayerFromMatch(client);

	message(`${client.name} left the server!`, COLOUR_AQUA);
	console.log(`DISCONNECT: ${client.name} left the server!`);

	if(remainingPlayers.length == 0) {
		endMatch();
	}
});

// ----------------------------------------------------------------------------

addEventHandler("OnPedExitVehicle", function(event, ped, vehicle) {
	if(matchStarted) {
		if(ped.isType(ELEMENT_PLAYER)) {
			let client = getClientFromPlayerElement(ped);
			if(remainingPlayers.indexOf(client) != -1) {
				removePlayerFromMatch(client);
			}
		}
	}
});

// ----------------------------------------------------------------------------

addEventHandler("OnPedWasted", function(event, ped, ped2, weapon, pedPiece) {
	if(matchStarted) {
		if(ped.isType(ELEMENT_PLAYER)) {
			let client = getClientFromPlayerElement(ped);
			if(remainingPlayers.indexOf(client) != -1) {
				removePlayerFromMatch(client);
			}
		}
	}
});

// ----------------------------------------------------------------------------

addEventHandler("OnProcess", function(event, deltaTime) {
	if(!matchStarted) {
		return false;
	}

	getClients().forEach(function(client) {
		if(client.player != null) {
			if(client.player.vehicle != null) {
				if(client.player.vehicle.position.z <= matchMap.info.threshold) {
					if(remainingPlayers.indexOf(client) != -1) {
						removePlayerFromMatch(client);
					}
				} else {
					if(client.player.health <= 0) {
						if(remainingPlayers.indexOf(client) != -1) {
							removePlayerFromMatch(client);
						}
					}
				}
			} else {
				removePlayerFromMatch(remainingPlayer);
			}
		}
	});

	getElementsByType(ELEMENT_PED).forEach(function(civilian) {
		if(civilian.vehicle == null) {
			destroyElement(civilian);
		}
	});

	//getElementsByType(ELEMENT_VEHICLE).forEach(function(civilian) {
	//	if(civilian.vehicle == null) {
	//		destroyElement(civilian);
	//	}
	//});
});

// ----------------------------------------------------------------------------

function startMatchCountdown(timerStartValue) {
	spawnAllPlayers();
	matchCountdown = timerStartValue;
	matchCountdownTimer = setTimeout(countdownToMatchStart, 1000);
	matchStarted = true;
}

// ----------------------------------------------------------------------------

function countdownToMatchStart() {
	if(matchCountdown > 0) {
		message(String(matchCountdown), COLOUR_ORANGE);
		matchCountdown -= 1;
		//clearTimeout(countdownToMatchStart);
		setTimeout(countdownToMatchStart, 1000);
	} else {
		startMatch();
	}
}

// ----------------------------------------------------------------------------

function countdownToMatchEnd() {
	if(matchEndCountdown == 15) {
		message("Match ends in 25 seconds!", toColour(237, 67, 55, 255));
		console.log("[SUMO] Match ends in 15 seconds!");
		//clearTimeout(countdownToMatchEnd);
		setTimeout(countdownToMatchEnd, 1000);
		matchEndCountdown -= 1;
	} else if(matchEndCountdown <= 5 && matchEndCountdown > 0) {
		message(String(matchEndCountdown), toColour(237, 67, 55, 255));
		console.log("[SUMO] Match ends in " + String(matchEndCountdown) + " seconds!");
		//clearTimeout(countdownToMatchEnd);
		setTimeout(countdownToMatchEnd, 1000);
		matchEndCountdown -= 1;
	} else if(matchEndCountdown == 0) {
		endMatch();
	} else {
		matchEndCountdown -= 1;
	}
}

// ----------------------------------------------------------------------------

function spawnAllPlayers() {
	getElementsByType(ELEMENT_VEHICLE).forEach(function(vehicle) {
		destroyElement(vehicle);
	});

	remainingPlayers.forEach(function(remainingPlayer) {
		let spawnInfo = getRandomRemainingSpawn();
		if(spawnInfo != false) {
			let spawnPosition = spawnInfo.position;
			let spawnHeading = Number(spawnInfo.heading);
			if(!matchMap.info.usesRadians) {
				spawnHeading = degToRad(spawnHeading);
			}

			let vehicleModel = getRandomVehicleModel();
			if(bigSumoVehicles[server.game].indexOf(vehicleModel) != -1) {
				spawnPosition = getPosInFrontOfPos(spawnPosition, spawnHeading, 3);
				spawnPosition.z += 1.5;
			}

			let vehicle = gta.createVehicle(vehicleModel, spawnPosition);
			vehicle.heading = spawnHeading;
			addToWorld(vehicle);

			spawnPlayer(remainingPlayer, spawnPosition, spawnHeading, sumoSkins[server.game], 0, 0);
			remainingPlayer.player.warpIntoVehicle(vehicle, 0);
			//remainingPlayer.setData("sumo.spawned", true, true);
			triggerNetworkEvent("sumo.spawned", remainingPlayer);
			triggerNetworkEvent("sumo.lockcontrols", null);
		} else {
			messageClient(`The match is full! Spawning you as a spectator ...`, toColour(237, 67, 55, 255));
			respawnAsSpectator(client);
		}
	});

	if(remainingSpawns.length > 0) {
		remainingSpawns.forEach(function(remainingSpawn) {
			let spawnPosition = remainingSpawn.position;
			let spawnHeading = Number(remainingSpawn.heading);
			if(!matchMap.info.usesRadians) {
				spawnHeading = degToRad(spawnHeading);
			}

			let vehicleModel = getRandomVehicleModel();
			if(bigSumoVehicles[server.game].indexOf(vehicleModel) != -1) {
				spawnPosition = getPosInFrontOfPos(spawnPosition, spawnHeading, 3);
				spawnPosition.z += 1.5;
			}

			let vehicle = gta.createVehicle(vehicleModel, spawnPosition);
			vehicle.heading = spawnHeading;
			addToWorld(vehicle);

			let civilian = gta.createCivilian(sumoSkins[server.game], spawnPosition);
			civilian.position = spawnPosition;
			addToWorld(civilian);
			civilian.warpIntoVehicle(vehicle, 0);
			vehicle.engine = false;

			vehicle.setData("sumo.ai", true, true);
		});
	}
	console.log(`[SUMO] All players spawned!`);
}

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.spectate.prev", function(client, currentSpectatingElement) {
	let currentClient = remainingPlayers.filter((remainingPlayer) => remainingPlayer.player.vehicle == currentSpectatingElement);
	let currentIndex = remainingPlayers.indexOf(currentClient);
	let previousClient = (currentIndex == 0) ? remainingPlayers[remainingPlayers.length-1] : remainingPlayers[currentIndex-1];
	triggerNetworkEvent("sumo.spectate", client, previousClient.player);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.spectate.next", function(client, currentSpectatingElement) {
	let currentClient = remainingPlayers.filter((remainingPlayer) => remainingPlayer.player.vehicle == currentSpectatingElement);
	let currentIndex = remainingPlayers.indexOf(currentClient);
	let previousClient = (currentIndex == remainingPlayers.length-1) ? remainingPlayers[0] : remainingPlayers[currentIndex+1];
	triggerNetworkEvent("sumo.spectate", client, previousClient.player);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.client", function(client) {
	client.setData("sumo.client", true, false);
	client.setData("sumo.ready", false, true);

	if(matchStarted) {
		triggerNetworkEvent("sumo.lobby", client,
			matchMap.info.name || "",
			matchMap.info.creator || "",
			Number(matchMap.camera.position.x) || lobbyCamera[server.game][0].x,
			Number(matchMap.camera.position.y) || lobbyCamera[server.game][0].y,
			Number(matchMap.camera.position.z) || lobbyCamera[server.game][0].z,
			Number(matchMap.camera.lookAt.x) || lobbyCamera[server.game][1].x,
			Number(matchMap.camera.lookAt.y) || lobbyCamera[server.game][1].y,
			Number(matchMap.camera.lookAt.z) || lobbyCamera[server.game][1].z,
			true
		);
	} else {
		sendClientToLobby(client);
	}
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.ready", function(client) {
	triggerEvent("OnPlayerReadyForMatch", client, client);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.spectator", function(client) {
	triggerEvent("OnPlayerSwitchToSpectator", client, client);
});

// ----------------------------------------------------------------------------

addNetworkHandler("sumo.reload", function(client) {
	if(client.administrator) {
		changeMap();
	}
});

// ----------------------------------------------------------------------------

addCommandHandler("reload", function(command, params, client) {
	if(client.administrator) {
		changeMap();
	}
});

// ----------------------------------------------------------------------------

function removePlayerFromMatch(client) {
	if(remainingPlayers.indexOf(client) == -1) {
		return false;
	}

	if(client.getData("sumo.spectator")) {
		respawnAsSpectator(client);
		return;
	}

	remainingPlayers.splice(remainingPlayers.indexOf(client), 1);

	if(client.player != null) {
		if(client.player.vehicle != null) {
			destroyElement(client.player.vehicle);
		}
		client.despawnPlayer();
	}

	if(remainingPlayers.length > 1) {
		let currentTimestamp = Math.round((new Date()).getTime() / 1000);
		message(`${client.name} died after ${currentTimestamp-matchStartTime} seconds. ${remainingPlayers.length} players remain!`, COLOUR_YELLOW);
		console.log(`[SUMO] ${client.name} died after ${currentTimestamp-matchStartTime} seconds. ${remainingPlayers.length} players remain!`);
		respawnAsSpectator(client);
	} else {
		endMatch();
	}

	client.setData("sumo.spawned", false, true);
	client.setData("sumo.ready", false, true);
}

// ----------------------------------------------------------------------------

function respawnAsSpectator(client) {
	if(client.getData("sumo.spectating") == null) {
		client.setData("sumo.spectating", true, true);
	}

	let spawnInfo = getRandomSpectatorSpawn();
	let spawnPosition = spawnInfo.position;
	let spawnHeading = Number(spawnInfo.heading);
	if(!matchMap.info.usesRadians) {
		spawnHeading = degToRad(spawnHeading);
	}

	let vehicle = gta.createVehicle(spectatorVehicle[server.game], spawnPosition);
	vehicle.heading = spawnHeading;
	addToWorld(vehicle);

	if(server.game !== GAME_GTA_SA) {
		vehicle.engine = false;
	}

	spawnPlayer(client, vehicle.position, spawnHeading, sumoSkins[server.game], 0, 0);
	client.player.warpIntoVehicle(vehicle, 0);

	messageClient(`You have been respawned as a spectator`, client, COLOUR_YELLOW);
	console.log(`[SUMO] ${client.name} was respawned as spectator`);
}

// ----------------------------------------------------------------------------

function startMatch() {
	//getElementsByType(ELEMENT_VEHICLE).filter(v => !v.getOccupant(0)).forEach((v) => {destroyElement(v)});

	matchStartTime = Math.round((new Date()).getTime() / 1000);
	message("GO", COLOUR_ORANGE);
	triggerNetworkEvent("sumo.go", null);

	if(server.game !== GAME_GTA_SA) {
		getElementsByType(ELEMENT_VEHICLE).forEach(v => v.engine = true);
	}

	matchEndCountdown = Number(matchMap.info.winTime);

	setTimeout(countdownToMatchEnd, 1000);
	message(`Match ends in ${matchEndCountdown}`, COLOUR_YELLOW);
	console.log(`[SUMO] Match started! Automatically ends in ${matchEndCountdown} seconds`);
}

// ----------------------------------------------------------------------------

function initMatch() {
	remainingPlayers = [];
	getClients().forEach(function(client) {
		if(client.player != null) {
			client.despawnPlayer();
			client.removeData("sumo.spectating");
		}
	});

	let mapName = getRandomMap(server.game);
	console.log(`Chose ${mapName} as new map`);

	loadMapData(mapName, server.game);

	collectAllGarbage();
}

// ----------------------------------------------------------------------------

function getRandomRemainingSpawn() {
	if(remainingSpawns.length > 0) {
		let spawnId = Math.floor((Math.random() * remainingSpawns.length));
		let spawnData = remainingSpawns[spawnId];
		remainingSpawns.splice(spawnId, 1);
		return spawnData;
	} else {
		return false;
	}
}

// ----------------------------------------------------------------------------

function getRandomSpectatorSpawn() {
	let spawnId = Math.floor((Math.random() * matchMap.spawns.length));
	let spawnData = matchMap.spawns[spawnId];
	return spawnData;
}

// ----------------------------------------------------------------------------

function getFileData(filePath) {
	let fileData = loadTextFile(filePath);
	if(!fileData) {
		return false;
	}
	return fileData;
}

// ----------------------------------------------------------------------------

function setFileData(filePath, fileData) {
	saveTextFile(filePath, fileData);
	return true;
}

// ----------------------------------------------------------------------------

function getFileLines(filePath) {
	let fileData = getFileData(filePath);

	if(!fileData) {
		return new Array(0);
	}

	// Fix line endings
	fileData = fileData.replace("\r\n", "\n");
	fileData = fileData.replace("\r", "\n");

	return fileData.split("\n") || new Array(0);
}

// ----------------------------------------------------------------------------

addEventHandler("OnMapLoaded", function(event, mapData) {
	matchMap = mapData;
	isMapLoaded = true;

	remainingSpawns = matchMap.spawns;

	sendAllClientsToLobby();
});

// ----------------------------------------------------------------------------

function loadMapData(mapName, gameId = server.game) {
	console.warn(`[SUMO] Loading map '${mapName}'!`);

	let usesRadians = doesMapUseRadians(mapName);
	let mapFilePath = `maps/${gameId}/${mapName}.ini`;
	let mapFileData = getFileLines(mapFilePath);
	if(mapFileData.length == 0) {
		console.error(`[SUMO] Could not load map '${mapName}.ini`);
		thisResource.stop();
		return false;
	}

	let mapSpawns = [];
	mapFileData.filter((mapData) => mapData[0] === "S").forEach(function(spawnData) {
		let position = spawnData.split(" ").slice(1, 4);
		let heading = spawnData.split(" ")[4];
		mapSpawns.push({position: new Vec3(Number(position[0]), Number(position[1]), Number(position[2])), heading: heading});
	});

	let mapObjects = [];
	mapFileData.filter((mapData) => mapData[0] === "O").forEach(function(objectData) {
		let thisObject = objectData.split(" ");
		let model = thisObject[1];
		let position = thisObject.slice(2, 5);
		let rotation = thisObject.slice(5, 8);

		let position2 = new Vec3(Number(position[0]), Number(position[1]), Number(position[2]));
		let rotation2 = new Vec3(Number(rotation[0]), Number(rotation[1]), Number(rotation[2]));
		let heading = Number(rotation[2]);
		if(!usesRadians) {
			rotation2 = new Vec3(degToRad(Number(rotation[0])), degToRad(Number(rotation[1])), degToRad(Number(rotation[2])));
			heading = degToRad(Number(rotation[2]));
		}

		let tempObject = gta.createObject(Number(model), position2);
		if(tempObject != null) {
			tempObject.setRotation(rotation2);
			tempObject.onAllDimensions = true;
			addToWorld(tempObject);
			mapObjects.push(tempObject);
		}
	});

	let cameraPositionData = mapFileData.filter((mapData) => mapData[0] === "C")[0].split(" ");
	let cameraLookAtData = mapFileData.filter((mapData) => mapData[0] === "L")[0].split(" ");

	let mapData = {
		info: {
			name: mapFileData.filter((mapData) => mapData[0] === "N")[0].slice(2),
			creator: mapFileData.filter((mapData) => mapData[0] === "A")[0].slice(2),
			threshold: Number(mapFileData.filter((mapData) => mapData[0] === "T")[0].slice(2)),
			winTime: Number(mapFileData.filter((mapData) => mapData[0] === "W")[0].slice(2)) || 60,
			usesRadians: usesRadians,
		},
		camera: {
			position: new Vec3(Number(cameraPositionData[1]), Number(cameraPositionData[2]), Number(cameraPositionData[3])),
			lookAt: new Vec3(Number(cameraLookAtData[1]), Number(cameraLookAtData[2]), Number(cameraLookAtData[3])),
		},
		spawns: mapSpawns,
		objects: mapObjects,
	};

	triggerEvent("OnMapLoaded", null, mapData);
}

// ----------------------------------------------------------------------------

addEventHandler("OnPlayerReadyForMatch", function(event, client) {
	if(client.getData("sumo.spectating")) {
		return false;
	}

	if(matchStarted) {
		return false;
	}

	if(remainingPlayers.indexOf(client) == -1) {
		if(client.getData("sumo.ready") == null || !client.getData("sumo.ready")) {
			client.setData("sumo.ready", true, true);
			remainingPlayers.push(client);

			console.log("[SUMO] " + String(client.name) + " is ready for the match! (" + String(remainingPlayers.length) + "/" + String(getClients().length) + ")");
			message(String(client.name) + " is ready for the match! (" + String(remainingPlayers.length) + "/" + String(getClients().length) + ")", COLOUR_YELLOW);

			setTimeout(function() {
				if(remainingPlayers.length == getClients().length) {
					console.warn("[SUMO] All players are ready! Beginning match countdown!");
					startMatchCountdown(5);
				} else {
					console.log("[SUMO] Some players are still not ready. Waiting for them ...");
				}
			}, 1000);
		}
	}
});

// ----------------------------------------------------------------------------

function getRandomMap(gameId = server.game) {
	let mapsFileData = getFileLines("maps/maps.ini");
	if(mapsFileData.length == 0) {
		console.error("[SUMO] Could not load maps directory file!");
		thisResource.stop();
		return false;
	}

	let thisGameMaps = mapsFileData.filter((maps) => maps[0] === String(gameId));

	let randomMapId = (thisGameMaps.length > 1) ? Math.floor(Math.random()*thisGameMaps.length) : 0;
	return thisGameMaps[randomMapId].split(" ")[1];
}

// ----------------------------------------------------------------------------

function sendClientToLobby(client) {
	triggerNetworkEvent("sumo.lobby", client,
		matchMap.info.name || "",
		matchMap.info.creator || "",
		Number(matchMap.camera.position.x) || lobbyCamera[server.game][0].x,
		Number(matchMap.camera.position.y) || lobbyCamera[server.game][0].y,
		Number(matchMap.camera.position.z) || lobbyCamera[server.game][0].z,
		Number(matchMap.camera.lookAt.x) || lobbyCamera[server.game][1].x,
		Number(matchMap.camera.lookAt.y) || lobbyCamera[server.game][1].y,
		Number(matchMap.camera.lookAt.z) || lobbyCamera[server.game][1].z);
}

// ----------------------------------------------------------------------------

function sendAllClientsToLobby() {
	getClients().forEach(function(client) {
		sendClientToLobby(client);
	});
}

// ----------------------------------------------------------------------------

function endMatch() {
	if(remainingPlayers.length == 1) {
		message(String(remainingPlayers[0].name) + " wins " + String(matchMap.info.name) + "!", COLOUR_LIME);
		console.log("[SUMO] Match ended. Winner is " + remainingPlayers[0].name);
	} else {
		message("It seems nobody could win " + String(matchMap.info.name), COLOUR_LIME);
		console.log("[SUMO] Match ended. No winner!");
	}

	triggerNetworkEvent("sumo.matchend", null);

	getElementsByType(ELEMENT_VEHICLE).forEach(function(vehicle) {
		destroyElement(vehicle);
	});

	getClients().forEach(function(client) {
		if(client.player != null) {
			client.despawnPlayer();
		}

		client.removeData("sumo.ready", false, true);
		client.removeData("sumo.spectating");
	});



	matchStarted = false;
	changeMap();
	setTimeout(function() { sendAllClientsToLobby(); }, 500);
}

// ----------------------------------------------------------------------------

function getRandomVehicleModel() {
	let max = sumoVehicles[server.game].length;
	let randomId = Math.floor(Math.random()*max);
	return sumoVehicles[server.game][randomId];
}

// ----------------------------------------------------------------------------

function getPosInFrontOfPos(pos, angle, distance) {
	let x = (pos.x+((Math.cos(angle+(Math.PI/2)))*distance));
	let y = (pos.y+((Math.sin(angle+(Math.PI/2)))*distance));
	let z = pos.z;

	return new Vec3(x, y, z);
}

// ----------------------------------------------------------------------------

function changeMap(mapName = null) {
	getElementsByType(ELEMENT_VEHICLE).forEach(function(vehicle) {
		destroyElement(vehicle);
	});

	getClients().forEach(function(client) {
		if(client.player != null) {
			client.despawnPlayer();
		}
	});

	matchObjects.forEach(function(object) {
		destroyElement(object);
	});

	matchStarted = false;
	matchStartTime = 0;
	initMatch();
}

// ----------------------------------------------------------------------------

function degToRad(deg) {
	return deg * Math.PI / 180;
}

// ----------------------------------------------------------------------------

function radToDeg(rad) {
	return rad * 180 / Math.PI;
}

// ----------------------------------------------------------------------------

function doesMapUseRadians(mapFileName) {
	let mapsFileData = getFileLines("maps/maps.ini");
	let thisGameMaps = mapsFileData.filter((maps) => maps[0] == String(server.game));

	for(let i in thisGameMaps) {
		let splitInfo = thisGameMaps[i].split(" ");
		if(splitInfo[1] == mapFileName) {
			if(splitInfo[2] == "D") {
				return false;
			}
		}
	}
	return true;
}

// ----------------------------------------------------------------------------

addEventHandler("OnPlayerSwitchToSpectator", function(event, client) {
	if(remainingPlayers.indexOf(client) == -1) {
		respawnAsSpectator(client);
		return false;
	}
});

// ----------------------------------------------------------------------------