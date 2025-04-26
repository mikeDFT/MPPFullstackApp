USE MPPFullstackApp

SELECT * FROM __EFMigrationsHistory
SELECT * FROM Games
SELECT * FROM Companies

SELECT * FROM LogEntries
WHERE ActionType='DeleteGame'
ORDER BY [Timestamp]

-- Add Companies
INSERT INTO Companies (CompanyName, NetWorth, LogoID, Description)
VALUES 
('Valve Corporation', 10000000, 'Portal2Icon', 'American video game developer, publisher, and digital distribution company headquartered in Bellevue, Washington.'),
('Ubisoft Entertainment', 6500000, 'ROR2Icon', 'French video game company headquartered in Saint-Mandé with development studios across the world.'),
('Electronic Arts', 12000000, 'NMSIcon', 'American video game company headquartered in Redwood City, California known for sports franchises.'),
('Rockstar Games', 8000000, 'REPOIcon', 'American video game publisher based in New York City, known for action-adventure games.'),
('Nintendo', 15000000, 'DuolingoIcon', 'Japanese multinational video game company headquartered in Kyoto, Japan.');