-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'VSFrontendBackend')
BEGIN
    CREATE DATABASE VSFrontendBackend;
END
GO

USE VSFrontendBackend;
GO

-- Check if the migrations have been applied
IF EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
BEGIN
    PRINT 'Migrations table exists, checking for entries...';
    
    -- Check if there are any migrations
    IF EXISTS (SELECT * FROM __EFMigrationsHistory)
    BEGIN
        PRINT 'Migrations have been applied, proceeding with data seeding';
    END
    ELSE
    BEGIN
        PRINT 'No migrations found, please ensure migrations are run before seeding data';
        RAISERROR('Migrations need to be applied before data seeding', 16, 1);
        RETURN;
    END
END
ELSE
BEGIN
    PRINT 'Migrations table does not exist yet. Please ensure migrations are run before seeding data';
    RAISERROR('Migrations need to be applied before seeding data', 16, 1);
    RETURN;
END

-- Run the contents of GeneratingSomeData.sql
-- Add Companies
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    PRINT 'Companies table exists, proceeding with data insertion';
    
    -- Check if companies already exist
    IF NOT EXISTS (SELECT TOP 1 * FROM Companies)
    BEGIN
        INSERT INTO Companies (CompanyName, NetWorth, LogoID, Description)
        VALUES 
        ('Valve Corporation', 10000000, 'Portal2Icon', 'American video game developer, publisher, and digital distribution company headquartered in Bellevue, Washington.'),
        ('Ubisoft Entertainment', 6500000, 'ROR2Icon', 'French video game company headquartered in Saint-Mand� with development studios across the world.'),
        ('Electronic Arts', 12000000, 'NMSIcon', 'American video game company headquartered in Redwood City, California known for sports franchises.'),
        ('Rockstar Games', 8000000, 'REPOIcon', 'American video game publisher based in New York City, known for action-adventure games.'),
        ('Nintendo', 15000000, 'DuolingoIcon', 'Japanese multinational video game company headquartered in Kyoto, Japan.');
        
        PRINT 'Companies data inserted successfully';
    END
    ELSE
    BEGIN
        PRINT 'Companies data already exists, skipping insertion';
    END
END
ELSE
BEGIN
    PRINT 'Companies table does not exist yet. Skipping data insertion.';
END
GO

-- Rest of GeneratingManyGamesForCompanies.sql would go here
-- Note: We're not adding the entire script as it's quite large and would need to be run after migrations have created the tables
