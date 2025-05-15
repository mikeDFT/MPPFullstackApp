USE VSFrontendBackend

-- First, get company IDs to use for our games
DECLARE @ValveID INT, @UbisoftID INT, @EAID INT, @RockstarID INT, @NintendoID INT;

-- Try to get existing IDs (assumes these companies exist from GeneratingSomeData.sql)
SELECT @ValveID = ID FROM Companies WHERE CompanyName = 'Valve Corporation';
SELECT @UbisoftID = ID FROM Companies WHERE CompanyName = 'Ubisoft Entertainment';
SELECT @EAID = ID FROM Companies WHERE CompanyName = 'Electronic Arts';
SELECT @RockstarID = ID FROM Companies WHERE CompanyName = 'Rockstar Games';
SELECT @NintendoID = ID FROM Companies WHERE CompanyName = 'Nintendo';

-- If no companies exist, use placeholder IDs
IF @ValveID IS NULL SET @ValveID = 1;
IF @UbisoftID IS NULL SET @UbisoftID = 2;
IF @EAID IS NULL SET @EAID = 3;
IF @RockstarID IS NULL SET @RockstarID = 4; 
IF @NintendoID IS NULL SET @NintendoID = 5;

PRINT 'Using Company IDs: Valve=' + CAST(@ValveID AS NVARCHAR) + ', Ubisoft=' + CAST(@UbisoftID AS NVARCHAR) + 
      ', EA=' + CAST(@EAID AS NVARCHAR) + ', Rockstar=' + CAST(@RockstarID AS NVARCHAR) + 
      ', Nintendo=' + CAST(@NintendoID AS NVARCHAR);

-- Insert 20 sample games
INSERT INTO Games (CompanyID, Name, IconID, Price, Rating, Description, Genres, Platforms)
VALUES 
-- Valve Games
(@ValveID, 'Cosmic Quest', 'Portal2Icon', 29.99, 4.8, 'An epic adventure through space and time.', '["Action", "Adventure", "Puzzle"]', '["PC", "PlayStation"]'),
(@ValveID, 'Shadow Warriors', 'SuperHotIcon', 19.99, 4.5, 'Engage in tactical combat with supernatural enemies.', '["Action", "Fighting", "Strategy"]', '["PC", "Xbox", "PlayStation"]'),
(@ValveID, 'Digital Frontiers', 'ROR2Icon', 24.99, 4.2, 'Explore a procedurally generated digital landscape.', '["Adventure", "RPG", "Sandbox"]', '["PC", "PlayStation"]'),
(@ValveID, 'Crystal Depths', 'DeadCellsIcon', 14.99, 4.7, 'Delve into mysterious crystalline caves with ancient secrets.', '["Action", "Platformer", "Roguelike"]', '["PC", "Nintendo Switch"]'),

-- Ubisoft Games
(@UbisoftID, 'Eternal Empire', 'REPOIcon', 59.99, 4.3, 'Build your civilization and conquer the known world.', '["Strategy", "Simulation"]', '["PC", "Xbox", "PlayStation"]'),
(@UbisoftID, 'Stellar Odyssey', 'NMSIcon', 49.99, 3.9, 'Embark on an interstellar journey across galaxies.', '["Adventure", "Simulation", "Sandbox"]', '["PC", "PlayStation"]'),
(@UbisoftID, 'Phantom Rebellion', 'DBDIcon', 39.99, 4.1, 'Lead the resistance against a tyrannical regime.', '["Action", "Shooter", "Strategy"]', '["PC", "Xbox", "PlayStation", "Nintendo Switch"]'),
(@UbisoftID, 'Savage Lands', 'LethalCompIcon', 34.99, 4.4, 'Survive in a harsh wilderness filled with dangerous creatures.', '["Survival", "Sandbox", "Action"]', '["PC", "Xbox"]'),

-- EA Games
(@EAID, 'Mega Tactics', 'SlayTheSpireIcon', 29.99, 4.0, 'A turn-based strategy game with deep tactical elements.', '["Strategy", "RPG", "Puzzle"]', '["PC", "Mobile"]'),
(@EAID, 'Blazing Racers', 'BPMIcon', 39.99, 4.2, 'High-speed futuristic racing with fully destructible environments.', '["Racing", "Action", "Sports"]', '["PC", "Xbox", "PlayStation"]'),
(@EAID, 'Primal Hunters', 'DarkNDIcon', 44.99, 3.8, 'Hunt prehistoric beasts in a savage primordial world.', '["Action", "Survival", "Simulation"]', '["PC", "PlayStation", "Xbox"]'),
(@EAID, 'Golden Champions', 'DeathsDoorIcon', 49.99, 4.6, 'Compete in international sports tournaments for ultimate glory.', '["Sports", "Simulation"]', '["PC", "PlayStation", "Xbox", "Nintendo Switch"]'),

-- Rockstar Games
(@RockstarID, 'Midnight Siege', 'KillKnightIcon', 59.99, 4.9, 'An open-world crime drama set in a sprawling metropolis.', '["Action", "Adventure", "Shooter"]', '["PC", "PlayStation", "Xbox"]'),
(@RockstarID, 'Ruby Outlaws', 'REPOIcon', 49.99, 4.7, 'A western epic with a vast frontier to explore and conquer.', '["Action", "Adventure", "RPG"]', '["PC", "PlayStation", "Xbox"]'),
(@RockstarID, 'Void Dynasty', 'SuperHotIcon', 39.99, 4.3, 'Build and maintain your criminal empire across multiple cities.', '["Strategy", "Simulation", "Action"]', '["PC", "PlayStation"]'),
(@RockstarID, 'Hyper Streets', 'NMSIcon', 44.99, 4.5, 'Underground street racing with extensive vehicle customization.', '["Racing", "Action", "Sports"]', '["PC", "PlayStation", "Xbox"]'),

-- Nintendo Games
(@NintendoID, 'Super Realm', 'DuolingoIcon', 59.99, 4.8, 'A colorful platforming adventure with beloved characters.', '["Platformer", "Adventure", "Party"]', '["Nintendo Switch"]'),
(@NintendoID, 'Mystic Explorers', 'PalworldIcon', 49.99, 4.6, 'Collect and train mystical creatures in a vibrant world.', '["RPG", "Adventure", "Simulation"]', '["Nintendo Switch", "Mobile"]'),
(@NintendoID, 'Astral Party', 'AmogusIcon', 39.99, 4.7, 'A collection of mini-games for friends and family.', '["Party", "Puzzle", "Music"]', '["Nintendo Switch"]'),
(@NintendoID, 'Light Knights', 'Portal2Icon', 54.99, 4.9, 'An epic fantasy adventure with turn-based combat.', '["RPG", "Strategy", "Adventure"]', '["Nintendo Switch", "Mobile"]');

PRINT 'Sample games inserted successfully!';
GO
