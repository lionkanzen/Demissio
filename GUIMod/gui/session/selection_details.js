function layoutSelectionSingle()
{
	Engine.GetGUIObjectByName("detailsAreaSingle").hidden = false;
	Engine.GetGUIObjectByName("detailsAreaMultiple").hidden = true;
}

function layoutSelectionMultiple()
{
	Engine.GetGUIObjectByName("detailsAreaMultiple").hidden = false;
	Engine.GetGUIObjectByName("detailsAreaSingle").hidden = true;
}

function getResourceTypeDisplayName(resourceType)
{
	var resourceCode = resourceType["generic"];
	var displayName = "";
	if (resourceCode == "treasure")
		displayName = getLocalizedResourceName(resourceType["specific"], "firstWord");
	else
		displayName = getLocalizedResourceName(resourceCode, "firstWord");
	return displayName;
}

// Fills out information that most entities have
function displaySingle(entState, context)
{
	// Get general unit and player data
	var template = GetTemplateData(entState.template);
	var specificName = template.name.specific;
	var genericName = template.name.generic;
	// If packed, add that to the generic name (reduces template clutter)
	if (genericName && template.pack && template.pack.state == "packed")
		genericName = sprintf(translate("%(genericName)s — Packed"), { genericName: genericName });
	var playerState = g_Players[entState.player];

	var civName = g_CivData[playerState.civ].Name;
	var civEmblem = g_CivData[playerState.civ].Emblem;

	var playerName = playerState.name;
	var playerColor = playerState.color.r + " " + playerState.color.g + " " + playerState.color.b + " 128";

	// Indicate disconnected players by prefixing their name
	if (g_Players[entState.player].offline)
		playerName = sprintf(translate("\\[OFFLINE] %(player)s"), { player: playerName });

	// Rank
	if (entState.identity && entState.identity.rank && entState.identity.classes)
	{
		Engine.GetGUIObjectByName("rankIcon").tooltip = sprintf(translate("%(rank)s Rank"), { rank: translateWithContext("Rank", entState.identity.rank) });
		Engine.GetGUIObjectByName("rankIcon").sprite = getRankIconSprite(entState);
		Engine.GetGUIObjectByName("rankIcon").hidden = false;
	}
	else
	{
		Engine.GetGUIObjectByName("rankIcon").hidden = true;
		Engine.GetGUIObjectByName("rankIcon").tooltip = "";
	}

	// Hitpoints
	Engine.GetGUIObjectByName("healthSection").hidden = !entState.hitpoints;
	if (entState.hitpoints)
	{
		var unitHealthBar = Engine.GetGUIObjectByName("healthBar");
		var healthSize = unitHealthBar.size;
		healthSize.rright = 100*Math.max(0, Math.min(1, entState.hitpoints / entState.maxHitpoints));
		unitHealthBar.size = healthSize;

		if (entState.foundation && entState.visibility == "visible" && entState.foundation.numBuilders !== 0)
		{
			// logic comes from Foundation component.
			var speed = Math.pow(entState.foundation.numBuilders, 0.7);
			var timeLeft = (1.0 - entState.foundation.progress / 100.0) * template.cost.time;
			var timeToCompletion = Math.ceil(timeLeft/speed);
			Engine.GetGUIObjectByName("health").tooltip = sprintf(translatePlural("This foundation will be completed in %(seconds)s second.", "This foundation will be completed in %(seconds)s seconds.", timeToCompletion), { "seconds": timeToCompletion });
		}
		else
			Engine.GetGUIObjectByName("health").tooltip = "";

		Engine.GetGUIObjectByName("healthStats").caption = sprintf(translate("%(hitpoints)s / %(maxHitpoints)s"), {
			hitpoints: Math.ceil(entState.hitpoints),
			maxHitpoints: entState.maxHitpoints
		});
	}

	// CapturePoints
	Engine.GetGUIObjectByName("captureSection").hidden = !entState.capturePoints;
	if (entState.capturePoints)
	{
		let setCaptureBarPart = function(playerID, startSize) {
			var unitCaptureBar = Engine.GetGUIObjectByName("captureBar["+playerID+"]");
			var sizeObj = unitCaptureBar.size;
			sizeObj.rleft = startSize;

			var size = 100*Math.max(0, Math.min(1, entState.capturePoints[playerID] / entState.maxCapturePoints));
			sizeObj.rright = startSize + size;
			unitCaptureBar.size = sizeObj;
			unitCaptureBar.sprite = "color: " + rgbToGuiColor(g_Players[playerID].color, 128);
			unitCaptureBar.hidden=false;
			return startSize + size;
		};

		// first handle the owner's points, to keep those points on the left for clarity
		let size = setCaptureBarPart(entState.player, 0);

		for (let i in entState.capturePoints)
			if (i != entState.player)
				size = setCaptureBarPart(i, size);

		Engine.GetGUIObjectByName("captureStats").caption = sprintf(translate("%(capturePoints)s / %(maxCapturePoints)s"), {
			capturePoints: Math.ceil(entState.capturePoints[entState.player]),
			maxCapturePoints: entState.maxCapturePoints
		});
	}

	// TODO: Stamina

	// Experience
	Engine.GetGUIObjectByName("experience").hidden = !entState.promotion;
	if (entState.promotion)
	{
		var experienceBar = Engine.GetGUIObjectByName("experienceBar");
		var experienceSize = experienceBar.size;
		experienceSize.rtop = 100 - (100 * Math.max(0, Math.min(1, 1.0 * +entState.promotion.curr / +entState.promotion.req)));
		experienceBar.size = experienceSize;
 
		if (entState.promotion.curr < entState.promotion.req)
			Engine.GetGUIObjectByName("experience").tooltip = sprintf(translate("%(experience)s %(current)s / %(required)s"), {
				experience: "[font=\"sans-bold-13\"]" + translate("Experience:") + "[/font]",
				current: Math.floor(entState.promotion.curr),
				required: entState.promotion.req
			});
		else
			Engine.GetGUIObjectByName("experience").tooltip = sprintf(translate("%(experience)s %(current)s"), {
				experience: "[font=\"sans-bold-13\"]" + translate("Experience:") + "[/font]",
				current: Math.floor(entState.promotion.curr)
			});
	}

	// Resource stats
	Engine.GetGUIObjectByName("resourceSection").hidden = !entState.resourceSupply;
	if (entState.resourceSupply)
	{
		var resources = entState.resourceSupply.isInfinite ? translate("∞") :  // Infinity symbol
						sprintf(translate("%(amount)s / %(max)s"), { amount: Math.ceil(+entState.resourceSupply.amount), max: entState.resourceSupply.max });
		var resourceType = getResourceTypeDisplayName(entState.resourceSupply.type);

		var unitResourceBar = Engine.GetGUIObjectByName("resourceBar");
		var resourceSize = unitResourceBar.size;

		resourceSize.rright = entState.resourceSupply.isInfinite ? 100 :
						100 * Math.max(0, Math.min(1, +entState.resourceSupply.amount / +entState.resourceSupply.max));
		unitResourceBar.size = resourceSize;
		Engine.GetGUIObjectByName("resourceLabel").caption = sprintf(translate("%(resource)s:"), { resource: resourceType });
		Engine.GetGUIObjectByName("resourceStats").caption = resources;

		if (entState.hitpoints)
			Engine.GetGUIObjectByName("resourceSection").size = Engine.GetGUIObjectByName("captureSection").size;
		else
			Engine.GetGUIObjectByName("resourceSection").size = Engine.GetGUIObjectByName("healthSection").size;
	}

	// Resource carrying
	if (entState.resourceCarrying && entState.resourceCarrying.length)
	{
		// We should only be carrying one resource type at once, so just display the first
		var carried = entState.resourceCarrying[0];

		Engine.GetGUIObjectByName("indicatorIcon[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[2]").sprite = "stretched:session/icons/resources/"+carried.type+".png";
		Engine.GetGUIObjectByName("indicatorText[2]").caption = sprintf(translate("%(amount)s"), { amount: carried.amount });
		Engine.GetGUIObjectByName("indicatorIcon[2]").tooltip = "";
		Engine.GetGUIObjectByName("indicatorIcon[3]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[3]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[3]").sprite = "stretched:session/icons/capacity.png";
		Engine.GetGUIObjectByName("indicatorText[3]").caption = sprintf(translate("%(max)s"), { max: carried.max });
		Engine.GetGUIObjectByName("indicatorIcon[3]").tooltip = "";
	}
	// Use the same indicators for traders
	else if (entState.trader && entState.trader.goods.amount)
	{
		Engine.GetGUIObjectByName("indicatorIcon[3]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[3]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[3]").sprite = "stretched:session/icons/resources/"+entState.trader.goods.type+".png";
		var totalGain = entState.trader.goods.amount.traderGain;
		if (entState.trader.goods.amount.market1Gain)
			totalGain += entState.trader.goods.amount.market1Gain;
		if (entState.trader.goods.amount.market2Gain)
			totalGain += entState.trader.goods.amount.market2Gain;
		Engine.GetGUIObjectByName("indicatorText[3]").caption = totalGain;
		Engine.GetGUIObjectByName("indicatorIcon[3]").tooltip = sprintf(translate("Gain: %(gain)s"), { "gain": getTradingTooltip(entState.trader.goods.amount) });
	}
	// And for number of workers
	else if (entState.foundation && entState.visibility == "visible")
	{
		Engine.GetGUIObjectByName("indicatorIcon[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[2]").sprite = "stretched:session/icons/repair.png";
		Engine.GetGUIObjectByName("indicatorText[2]").caption = entState.foundation.numBuilders;
		if (entState.foundation.numBuilders !== 0)
		{
			var speedup = Math.pow((entState.foundation.numBuilders+1)/entState.foundation.numBuilders, 0.7);
			var timeLeft = (1.0 - entState.foundation.progress / 100.0) * template.cost.time;
			var timeSpeedup = Math.ceil(timeLeft - timeLeft/speedup);
			Engine.GetGUIObjectByName("indicatorIcon[2]").tooltip = sprintf(translatePlural("Number of builders.\nTasking another to this foundation would speed construction up by %(speedup)s second.", "Number of builders.\nTasking another to this foundation would speed construction up by %(speedup)s seconds.", timeSpeedup), { "speedup": timeSpeedup });
		}
		else
			Engine.GetGUIObjectByName("indicatorIcon[2]").tooltip = translate("Number of builders.");
	}
	else if (entState.repairable && entState.repairable.numBuilders > 0 && entState.visibility == "visible")
	{
		Engine.GetGUIObjectByName("indicatorIcon[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[2]").sprite = "stretched:session/icons/repair.png";
		Engine.GetGUIObjectByName("indicatorText[2]").caption = entState.repairable.numBuilders;
		Engine.GetGUIObjectByName("indicatorIcon[2]").tooltip = translate("Number of builders.");
	}
	else if (entState.resourceSupply && (!entState.resourceSupply.killBeforeGather || !entState.hitpoints) && entState.visibility == "visible")
	{
		Engine.GetGUIObjectByName("indicatorIcon[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[2]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[2]").sprite = "stretched:session/icons/repair.png";
		Engine.GetGUIObjectByName("indicatorText[2]").caption = sprintf(translate("%(amount)s"), { amount: entState.resourceSupply.numGatherers });
		Engine.GetGUIObjectByName("indicatorIcon[2]").tooltip = translate("Current gatherers");
		Engine.GetGUIObjectByName("indicatorIcon[3]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[3]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[3]").sprite = "stretched:session/icons/capacity.png";
		Engine.GetGUIObjectByName("indicatorText[3]").caption = sprintf(translate("%(max)s"), { max: entState.resourceSupply.maxGatherers });
		Engine.GetGUIObjectByName("indicatorIcon[3]").tooltip = "Max gatherers";
	}
	else
	{
		Engine.GetGUIObjectByName("indicatorIcon[2]").hidden = true;
		Engine.GetGUIObjectByName("indicatorText[2]").hidden = true;
		Engine.GetGUIObjectByName("indicatorIcon[3]").hidden = true;
		Engine.GetGUIObjectByName("indicatorText[3]").hidden = true;
	}

	// Set Player details
	Engine.GetGUIObjectByName("specific").caption = specificName;
	Engine.GetGUIObjectByName("player").caption = playerName;
	Engine.GetGUIObjectByName("playerColorBackground").sprite = "color: " + playerColor;
	
	if (genericName !== specificName)
		Engine.GetGUIObjectByName("generic").caption = sprintf(translate("(%(genericName)s)"), { genericName: genericName });
	else
		Engine.GetGUIObjectByName("generic").caption = "";

	if ("gaia" != playerState.civ)
	{
		Engine.GetGUIObjectByName("playerCivIcon").sprite = "stretched:grayscale:" + civEmblem;
		Engine.GetGUIObjectByName("player").tooltip = civName;
	}
	else
	{
		Engine.GetGUIObjectByName("playerCivIcon").sprite = "";
		Engine.GetGUIObjectByName("player").tooltip = "";
	}

	// Icon image
	if (template.icon)
		Engine.GetGUIObjectByName("icon").sprite = "stretched:session/portraits/" + template.icon;
	else
		// TODO: we should require all entities to have icons, so this case never occurs
		Engine.GetGUIObjectByName("icon").sprite = "bkFillBlack";

	if (entState.armour)
	{
		var types = entState.identity.classes.indexOf("Structure") === -1 ? ["hack", "pierce"] : ["hack", "crush"];
		var armorIcons = {"hack" : "aggressive.png", "pierce" : "defensive.png", "crush" : "standground.png"};
		Engine.GetGUIObjectByName("indicatorText[0]").caption = Math.round(100 - Math.pow(0.9, entState.armour[types[0]])*100) + "%";
		Engine.GetGUIObjectByName("indicatorIcon[0]").sprite = "stretched:session/icons/stances/" + armorIcons[types[0]];
		Engine.GetGUIObjectByName("indicatorText[0]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[0]").hidden = false;
		Engine.GetGUIObjectByName("indicatorText[1]").caption = Math.round(100 - Math.pow(0.9, entState.armour[types[1]])*100) + "%";
		Engine.GetGUIObjectByName("indicatorIcon[1]").sprite = "stretched:session/icons/stances/" + armorIcons[types[1]];
		Engine.GetGUIObjectByName("indicatorText[1]").hidden = false;
		Engine.GetGUIObjectByName("indicatorIcon[1]").hidden = false;
	}
	else
	{
		Engine.GetGUIObjectByName("indicatorText[0]").hidden = true;
		Engine.GetGUIObjectByName("indicatorIcon[0]").hidden = true;
		Engine.GetGUIObjectByName("indicatorText[1]").hidden = true;
		Engine.GetGUIObjectByName("indicatorIcon[1]").hidden = true;
	}

	
	// Let's show context-sensitive information
	// Those depend on what we are currently hovering the cursor above.
	// Can be gathering, repairing, attacking (which is default)
	Engine.GetGUIObjectByName("gatheringStatPanel").hidden = true;
	Engine.GetGUIObjectByName("attackStatPanel").hidden = true;

	var contextDependantPanel = "";
	if (context && context.type == "gather" && entState.resourceGatherRates)
		contextDependantPanel = "gather";
	else if (context && context.type == "repair" && entState.builder)
		contextDependantPanel = "repair";
	else if (context && context.type == "attack" && entState.attack && (entState.attack.Melee || entState.attack.Ranged))
		contextDependantPanel = "attack";
	else if (context && context.type == "heal")
		contextDependantPanel = "heal";
	else if (entState.healer)
		contextDependantPanel = "heal";
	else if (entState.unitAI && entState.unitAI.orders.length)
	{
		var orders = entState.unitAI.orders;
		if (orders[0].type == "Gather")
		{
			contextDependantPanel = "gather";
			context = { "data" : {"type": entState.unitAI.orders[0].data.type }};
		}
		else if (orders[0].type == "ReturnResource" && orders[1] && orders[1].type == "Gather") 
		{
			contextDependantPanel = "gather";
			context = { "data" : {"type": entState.unitAI.orders[1].data.type }};
		}
	}
	// from then on only for structures
	else if (entState.attack)
		contextDependantPanel = "attack";
	else if (entState.populationBonus)
		contextDependantPanel = "housing";
	
	// if still empty at this point, try adding attacking stats as default
	if (contextDependantPanel == "")
	{
		if (entState.attack && (entState.attack.Melee || entState.attack.Ranged))
			contextDependantPanel = "attack";
	}

	if (contextDependantPanel == "gather")
	{
		var type = context.data.type.generic + "." + context.data.type.specific;
		if (entState.resourceGatherRates[type])
		{
			Engine.GetGUIObjectByName("gatheringStatPanel").hidden = false;
			Engine.GetGUIObjectByName("gatherRateIcon").sprite = "stretched:session/icons/resources/" + context.data.type.generic + ".png";
			Engine.GetGUIObjectByName("gatherRateIcon").hidden = false;
			Engine.GetGUIObjectByName("gatherRateText").caption = sprintf(translate("%(rate)s / s"), { "rate" : Math.round(entState.resourceGatherRates[type]*100)/100});
			Engine.GetGUIObjectByName("gatherRateText").hidden = false;

			Engine.GetGUIObjectByName("capacityIcon").sprite = "stretched:session/icons/capacity.png";
			Engine.GetGUIObjectByName("capacityIcon").hidden = false;
			Engine.GetGUIObjectByName("capacityText").caption = entState.resourceCapacities[context.data.type.generic];
			Engine.GetGUIObjectByName("capacityText").hidden = false;
		}
	}
	else if (contextDependantPanel == "repair")
	{
		Engine.GetGUIObjectByName("gatheringStatPanel").hidden = false;
		Engine.GetGUIObjectByName("gatherRateIcon").sprite = "stretched:session/icons/repair.png";
		Engine.GetGUIObjectByName("gatherRateIcon").hidden = false;
		Engine.GetGUIObjectByName("gatherRateText").caption =  sprintf(translate("%(rate)s / s"), { "rate" : Math.round(entState.builderRate*100)/100});
		Engine.GetGUIObjectByName("gatherRateText").hidden = false;
		Engine.GetGUIObjectByName("capacityIcon").hidden = true;
		Engine.GetGUIObjectByName("capacityText").hidden = true;
	}
	else if (contextDependantPanel == "housing")
	{
		Engine.GetGUIObjectByName("gatheringStatPanel").hidden = false;
		Engine.GetGUIObjectByName("gatherRateIcon").sprite = "stretched:session/icons/resources/population.png";
		Engine.GetGUIObjectByName("gatherRateIcon").hidden = false;
		Engine.GetGUIObjectByName("gatherRateText").caption = entState.populationBonus;
		Engine.GetGUIObjectByName("gatherRateText").hidden = false;
		Engine.GetGUIObjectByName("capacityIcon").hidden = true;
		Engine.GetGUIObjectByName("capacityText").hidden = true;
	}
	else if (contextDependantPanel == "heal")
	{
		Engine.GetGUIObjectByName("attackStatPanel").hidden = false;

		Engine.GetGUIObjectByName("AttackStatText").caption = Math.round(entState.healer.rate*10)/10;
		Engine.GetGUIObjectByName("AttackStatIcon").sprite = "stretched:session/icons/heal.png";
		Engine.GetGUIObjectByName("AttackStatIcon").hidden = false;
		Engine.GetGUIObjectByName("AttackStatText").hidden = false;

		Engine.GetGUIObjectByName("RangeStatText").hidden = false;
		Engine.GetGUIObjectByName("RangeStatIcon").hidden = false;
		Engine.GetGUIObjectByName("RangeStatText").caption = Math.round(entState.healer.maxRange*100)/100;

		Engine.GetGUIObjectByName("CaptureStatIcon").hidden = true;
		Engine.GetGUIObjectByName("CaptureStatText").hidden = true;
	}
	else if (contextDependantPanel == "attack")
	{
		Engine.GetGUIObjectByName("attackStatPanel").hidden = false;
		Engine.GetGUIObjectByName("ArrowCountIcon").hidden = true;
		Engine.GetGUIObjectByName("ArrowCountText").hidden = true;

		var attackIcon = "stretched:session/icons/attacktypes/melee.png";
		if (entState.attack.Melee)
		{
			var attackType = entState.attack.Melee; // reference, this is an object.
			Engine.GetGUIObjectByName("RangeStatText").hidden = true;
			Engine.GetGUIObjectByName("RangeStatIcon").hidden = true;
		}
		else if (entState.attack.Ranged)
		{
			attackIcon = "stretched:session/icons/attacktypes/ranged.png";
			attackType = entState.attack.Ranged;

			Engine.GetGUIObjectByName("RangeStatText").caption = Math.round(attackType.maxRange*100)/100;
			Engine.GetGUIObjectByName("RangeStatText").hidden = false;
			Engine.GetGUIObjectByName("RangeStatIcon").hidden = false;

			if (entState.buildingAI)
			{
				// assume buildings can't capture and show arrow count instead
				Engine.GetGUIObjectByName("ArrowCountText").caption = sprintf(translate("x%(count)s"), { "count": entState.buildingAI.arrowCount });
				Engine.GetGUIObjectByName("ArrowCountIcon").hidden = false;
				Engine.GetGUIObjectByName("ArrowCountText").hidden = false;
			}
		}

		if (attackType.crush > attackType.hack + attackType.pierce)
			attackIcon = "stretched:session/icons/attacktypes/siege.png";
		
		var DPS = attackType.crush + attackType.hack + attackType.pierce;
		DPS /= attackType.repeatTime/1000;
		
		Engine.GetGUIObjectByName("AttackStatText").caption = Math.round(DPS);
		Engine.GetGUIObjectByName("AttackStatIcon").sprite = attackIcon;
		Engine.GetGUIObjectByName("AttackStatIcon").hidden = false;
		Engine.GetGUIObjectByName("AttackStatText").hidden = false;

		if (entState.attack.Capture)
		{
			Engine.GetGUIObjectByName("CaptureStatText").caption = Math.round(entState.attack.Capture.value/(entState.attack.Capture.repeatTime/1000));
			Engine.GetGUIObjectByName("CaptureStatIcon").hidden = false;
			Engine.GetGUIObjectByName("CaptureStatText").hidden = false;
		}
		else
		{
			Engine.GetGUIObjectByName("CaptureStatIcon").hidden = true;
			Engine.GetGUIObjectByName("CaptureStatText").hidden = true;
		}
	}

	// Icon Tooltip
	var iconTooltip = "";

	if (genericName)
		iconTooltip = "[font=\"sans-bold-16\"]" + genericName + "[/font]";

	if (template.visibleIdentityClasses && template.visibleIdentityClasses.length)
	{
		iconTooltip += "\n[font=\"sans-bold-13\"]" + translate("Classes:") + "[/font] ";
		iconTooltip += "[font=\"sans-13\"]" + translate(template.visibleIdentityClasses[0]) ;
		for (var i = 1; i < template.visibleIdentityClasses.length; i++)
			iconTooltip += ", " + translate(template.visibleIdentityClasses[i]);
		iconTooltip += "[/font]";
	}

	if (template.auras)
		iconTooltip += getAurasTooltip(template);

	if (template.tooltip)
		iconTooltip += "\n[font=\"sans-13\"]" + template.tooltip + "[/font]";

	Engine.GetGUIObjectByName("iconBorder").tooltip = iconTooltip;

	// Unhide Details Area
	Engine.GetGUIObjectByName("detailsAreaSingle").hidden = false;
	Engine.GetGUIObjectByName("detailsAreaMultiple").hidden = true;
}

// Fills out information for multiple entities
function displayMultiple(selection)
{
	var averageHealth = 0;
	var maxHealth = 0;
	var maxCapturePoints = 0;
	var capturePoints = (new Array(9)).fill(0);
	var playerID = 0;

	for (let i = 0; i < selection.length; i++)
	{
		let entState = GetEntityState(selection[i]);
		if (!entState)
			continue;
		playerID = entState.player; // trust that all selected entities have the same owner
		if (entState.hitpoints)
		{
			averageHealth += entState.hitpoints;
			maxHealth += entState.maxHitpoints;
		}
		if (entState.capturePoints)
		{
			maxCapturePoints += entState.maxCapturePoints;
			capturePoints = entState.capturePoints.map(function(v, i) { return v + capturePoints[i]; });
		}
	}

	Engine.GetGUIObjectByName("healthMultiple").hidden = averageHealth <= 0;
	if (averageHealth > 0)
	{
		var unitHealthBar = Engine.GetGUIObjectByName("healthBarMultiple");
		var healthSize = unitHealthBar.size;
		healthSize.rtop = 100-100*Math.max(0, Math.min(1, averageHealth / maxHealth));
		unitHealthBar.size = healthSize;

		var hitpointsLabel = "[font=\"sans-bold-13\"]" + translate("Hitpoints:") + "[/font]";
		var hitpoints = sprintf(translate("%(label)s %(current)s / %(max)s"), { label: hitpointsLabel, current: averageHealth, max: maxHealth });
		Engine.GetGUIObjectByName("healthMultiple").tooltip = hitpoints;
	}

	Engine.GetGUIObjectByName("captureMultiple").hidden = maxCapturePoints <= 0;
	if (maxCapturePoints > 0)
	{
		let setCaptureBarPart = function(playerID, startSize)
		{
			var unitCaptureBar = Engine.GetGUIObjectByName("captureBarMultiple["+playerID+"]");
			var sizeObj = unitCaptureBar.size;
			sizeObj.rtop = startSize;

			var size = 100*Math.max(0, Math.min(1, capturePoints[playerID] / maxCapturePoints));
			sizeObj.rbottom = startSize + size;
			unitCaptureBar.size = sizeObj;
			unitCaptureBar.sprite = "color: " + rgbToGuiColor(g_Players[playerID].color, 128);
			unitCaptureBar.hidden=false;
			return startSize + size;
		};

		let size = 0;
		for (let i in capturePoints)
			if (i != playerID)
				size = setCaptureBarPart(i, size);

		// last handle the owner's points, to keep those points on the bottom for clarity
		setCaptureBarPart(playerID, size);

		var capturePointsLabel = "[font=\"sans-bold-13\"]" + translate("Capture points:") + "[/font]";
		var capturePointsTooltip = sprintf(translate("%(label)s %(current)s / %(max)s"), { label: capturePointsLabel, current: Math.ceil(capturePoints[playerID]), max: Math.ceil(maxCapturePoints) });
		Engine.GetGUIObjectByName("captureMultiple").tooltip = capturePointsTooltip;
	}

	// TODO: Stamina
	// Engine.GetGUIObjectByName("staminaBarMultiple");

	Engine.GetGUIObjectByName("numberOfUnits").caption = selection.length;

	// Unhide Details Area
	Engine.GetGUIObjectByName("detailsAreaMultiple").hidden = false;
	Engine.GetGUIObjectByName("detailsAreaSingle").hidden = true;
}

// Updates middle entity Selection Details Panel
function updateSelectionDetails(context = undefined)
{
	var supplementalDetailsPanel = Engine.GetGUIObjectByName("supplementalSelectionDetails");
	var detailsPanel = Engine.GetGUIObjectByName("selectionDetails");
	var commandsPanel = Engine.GetGUIObjectByName("unitCommands");

	var selection = g_Selection.toList();

	if (selection.length == 0)
	{
		Engine.GetGUIObjectByName("detailsAreaMultiple").hidden = true;
		Engine.GetGUIObjectByName("detailsAreaSingle").hidden = true;
		hideUnitCommands();

		supplementalDetailsPanel.hidden = true;
		detailsPanel.hidden = true;
		commandsPanel.hidden = true;
		return;
	}

	/* If the unit has no data (e.g. it was killed), don't try displaying any
	 data for it. (TODO: it should probably be removed from the selection too;
	 also need to handle multi-unit selections) */
	var entState = GetExtendedEntityState(selection[0]);
	if (!entState)
		return;

	// Fill out general info and display it
	if (selection.length == 1)
		displaySingle(entState, context);
	else
		displayMultiple(selection);

	// Show basic details.
	detailsPanel.hidden = false;

	if (g_IsObserver)
	{
		// Observers don't need these displayed.
		supplementalDetailsPanel.hidden = true;
		commandsPanel.hidden = true;
	}
	else
	{
		// Fill out commands panel for specific unit selected (or first unit of primary group)
		updateUnitCommands(entState, supplementalDetailsPanel, commandsPanel, selection);
	}
}
