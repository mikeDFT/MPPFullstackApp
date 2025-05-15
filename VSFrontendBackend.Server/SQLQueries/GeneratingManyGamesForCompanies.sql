USE VSFrontendBackend

-- to run sql files in container
-- /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SaPasswordPlease!" -i /sqlqueries/GeneratingManyGamesForCompanies.sql -C

-- to run queries in container
-- /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SaPasswordPlease!" -Q "USE VSFrontendBackend; SELECT * FROM Games" -C 

-- Create a temp table to store generated games
CREATE TABLE #TempGames (
    Id INT,
    CompanyID INT,
    Name NVARCHAR(100),
    IconID NVARCHAR(50),
    Price DECIMAL(10,2),
    Rating DECIMAL(3,1),
    Description NVARCHAR(MAX),
    Genres NVARCHAR(MAX),
    Platforms NVARCHAR(MAX)
);

-- Declare variables for generating random data
DECLARE @NamePrefixes TABLE (Prefix NVARCHAR(50));
DECLARE @NameSuffixes TABLE (Suffix NVARCHAR(50));
DECLARE @IconIDs TABLE (IconID NVARCHAR(50));
DECLARE @Genres TABLE (Genre NVARCHAR(50));
DECLARE @Platforms TABLE (Platform NVARCHAR(50));
DECLARE @Companies TABLE (ID INT);

-- Insert name prefixes
INSERT INTO @NamePrefixes VALUES
('Super'), ('Epic'), ('Dark'), ('Light'), ('Eternal'), ('Mystic'),
('Magic'), ('Tech'), ('Cyber'), ('Retro'), ('Future'), ('Ancient'),
('Deadly'), ('Cosmic'), ('Stellar'), ('Hyper'), ('Mega'), ('Ultra'),
('Quantum'), ('Neon'), ('Pixel'), ('Astral'), ('Phantom'), ('Solar'),
('Lunar'), ('Divine'), ('Infernal'), ('Frozen'), ('Blazing'), ('Thunder'),
('Shadow'), ('Radiant'), ('Savage'), ('Primal'), ('Digital'), ('Fabled'),
('Rogue'), ('Golden'), ('Crystal'), ('Dragon'), ('Stealth'), ('Chaos'),
('Void'), ('Emerald'), ('Ruby'), ('Sapphire'), ('Iron'), ('Midnight');

-- Insert name suffixes
INSERT INTO @NameSuffixes VALUES
('Quest'), ('Adventure'), ('Journey'), ('Legend'), ('Tales'), ('Chronicles'),
('Saga'), ('Hero'), ('Kingdom'), ('Realm'), ('World'), ('Lands'),
('Warriors'), ('Masters'), ('Conqueror'), ('Odyssey'), ('Dungeons'), ('Depths'),
('Fortress'), ('Dynasty'), ('Empire'), ('Legends'), ('Titans'), ('Guardians'),
('Hunters'), ('Knights'), ('Wizards'), ('Explorers'), ('Raiders'), ('Frontiers'),
('Horizons'), ('Dimensions'), ('Infinity'), ('Ascension'), ('Battle'), ('War'),
('Tycoon'), ('Simulator'), ('Survival'), ('Commander'), ('Tactics'), ('Defense'),
('Rebellion'), ('Revolution'), ('Escape'), ('Rescue'), ('Assault'), ('Siege'),
('Trials'), ('Mysteries'), ('Secrets'), ('Legacy'), ('Dawn'), ('Dusk'), ('Nexus');

-- Insert icon IDs
INSERT INTO @IconIDs VALUES
('ROR2Icon'), ('DBDIcon'), ('Portal2Icon'), ('DeadCellsIcon'), ('NMSIcon'),
('AmogusIcon'), ('DuolingoIcon'), ('DarkNDIcon'), ('DeathsDoorIcon'),
('KillKnightIcon'), ('LethalCompIcon'), ('REPOIcon'), ('SuperHotIcon'),
('PalworldIcon'), ('SlayTheSpireIcon'), ('BPMIcon');

-- Insert genres
INSERT INTO @Genres VALUES
('Action'), ('Adventure'), ('RPG'), ('Strategy'), ('Simulation'), ('Sports'),
('Racing'), ('Puzzle'), ('Platformer'), ('Fighting'), ('Shooter'), ('Horror'),
('Educational'), ('Music'), ('Party'), ('Roguelike'), ('Sandbox'), ('Survival');

-- Insert platforms
INSERT INTO @Platforms VALUES
('PC'), ('Xbox'), ('PlayStation'), ('Nintendo Switch'), ('Mobile');

-- Insert company IDs
INSERT INTO @Companies VALUES (22), (26), (44), (49), (57), (58), (59), (55), (75);

-- Variables for generating games
DECLARE @TotalGames INT = 10000; -- Games per company
DECLARE @CurrentGameId INT = 100000; -- Starting game ID
DECLARE @StandardDescription NVARCHAR(MAX) = 'Epic game where you do this and that and something else and you can (probably) do it with your friends or alone and also lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

-- Loop through each company
DECLARE @CompanyID INT;
DECLARE @CompanyCount INT = 0;

DECLARE CompanyCursor CURSOR FOR SELECT ID FROM @Companies;
OPEN CompanyCursor;
FETCH NEXT FROM CompanyCursor INTO @CompanyID;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @CompanyCount = @CompanyCount + 1;
    PRINT 'Generating games for company ID: ' + CAST(@CompanyID AS NVARCHAR) + ' (' + CAST(@CompanyCount AS NVARCHAR) + ' of 9)';
    
    -- Generate games for this company
    DECLARE @i INT = 0;
    WHILE @i < @TotalGames
    BEGIN
        -- Generate random game data
        DECLARE @RandomPrefix NVARCHAR(50) = (SELECT TOP 1 Prefix FROM @NamePrefixes ORDER BY NEWID());
        DECLARE @RandomSuffix NVARCHAR(50) = (SELECT TOP 1 Suffix FROM @NameSuffixes ORDER BY NEWID());
        DECLARE @GameName NVARCHAR(100) = @RandomPrefix + ' ' + @RandomSuffix;
        
        DECLARE @IconID NVARCHAR(50) = (SELECT TOP 1 IconID FROM @IconIDs ORDER BY NEWID());
        DECLARE @Price DECIMAL(10,2) = ROUND((RAND() * 60) + 0.99, 2);
        DECLARE @Rating DECIMAL(3,1) = ROUND((RAND() * 4.5) + 0.5, 1);
        
        -- Generate 2-4 random genres as JSON array
        DECLARE @GenreCount INT = FLOOR(RAND() * 3) + 2; -- 2 to 4
        DECLARE @Genres1 NVARCHAR(MAX) = '[';
        DECLARE @j INT = 0;
        
        WHILE @j < @GenreCount
        BEGIN
            IF @j > 0 SET @Genres1 = @Genres1 + ',';
            SET @Genres1 = @Genres1 + '"' + (SELECT TOP 1 Genre FROM @Genres ORDER BY NEWID()) + '"';
            SET @j = @j + 1;
        END;
        
        SET @Genres1 = @Genres1 + ']';
        
        -- Generate 1-3 random platforms as JSON array
        DECLARE @PlatformCount INT = FLOOR(RAND() * 3) + 1; -- 1 to 3
        DECLARE @Platforms1 NVARCHAR(MAX) = '[';
        SET @j = 0;
        
        WHILE @j < @PlatformCount
        BEGIN
            IF @j > 0 SET @Platforms1 = @Platforms1 + ',';
            SET @Platforms1 = @Platforms1 + '"' + (SELECT TOP 1 Platform FROM @Platforms ORDER BY NEWID()) + '"';
            SET @j = @j + 1;
        END;
        
        SET @Platforms1 = @Platforms1 + ']';
        
        -- Insert the game into the table
        INSERT INTO #TempGames (Id, CompanyID, Name, IconID, Price, Rating, Description, Genres, Platforms)
        VALUES (@CurrentGameId, @CompanyID, @GameName, @IconID, @Price, @Rating, @StandardDescription, @Genres1, @Platforms1);
        
        SET @CurrentGameId = @CurrentGameId + 1;
        SET @i = @i + 1;
        
        -- Show progress every 1000 games
        IF @i % 1000 = 0
        BEGIN
            PRINT '  ' + CAST(@i AS NVARCHAR) + ' games generated for company ' + CAST(@CompanyID AS NVARCHAR);
        END;
    END;
    
    FETCH NEXT FROM CompanyCursor INTO @CompanyID;
END;

CLOSE CompanyCursor;
DEALLOCATE CompanyCursor;

-- Insert games into your actual game table
-- Modify this to match your actual table structure
INSERT INTO Games (Id, CompanyID, Name, IconID, Price, Rating, Description, Genres, Platforms)
SELECT Id, CompanyID, Name, IconID, Price, Rating, Description, Genres, Platforms
FROM #TempGames;

-- Clean up
DROP TABLE #TempGames;