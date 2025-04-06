using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace VSFrontendBackend.Server.Repository
{
    public interface IFilesRepository
    {
        Task<string> SaveFileAsync(Stream fileStream, string fileName);
        Task<(Stream FileStream, string FileName)> GetFileAsync();
        Task DeleteFileAsync();
        Task<bool> FileExistsAsync();
    }

    public class FilesRepository : IFilesRepository
    {
        private readonly string _storagePath;
        private const string FileName = "stored_file";
        private const string MetaFileName = "stored_file_meta";

        public FilesRepository(string storagePath)
        {
            _storagePath = storagePath;
            Debug.WriteLine($"FilesRepository constructor called with storage path: {_storagePath}");
            // ensure directory exists
            Directory.CreateDirectory(_storagePath);
            Debug.WriteLine($"Storage directory created/verified: {_storagePath}");
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string fileName)
        {
            Debug.WriteLine("=== FILESREPOSITORY SAVE START ===");
            Debug.WriteLine($"Saving file: {fileName}");
            Debug.WriteLine($"Stream length: {fileStream.Length}, Can read: {fileStream.CanRead}, Can seek: {fileStream.CanSeek}");
            
            // delete existing file if it exists
            Debug.WriteLine("Deleting existing file if it exists");
            await DeleteFileAsync();

            // save the new file
            string filePath = Path.Combine(_storagePath, FileName);
            string metaPath = Path.Combine(_storagePath, MetaFileName);
            Debug.WriteLine($"File path: {filePath}");
            Debug.WriteLine($"Meta path: {metaPath}");

            try
            {
                // Save the file content
                Debug.WriteLine("Creating file stream for writing");
                using (var fileStream2 = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    Debug.WriteLine("Copying file stream to file");
                    await fileStream.CopyToAsync(fileStream2);
                    Debug.WriteLine("File stream copied successfully");
                }

                // Save the original filename
                Debug.WriteLine("Writing metadata file");
                await File.WriteAllTextAsync(metaPath, fileName);
                Debug.WriteLine("Metadata file written successfully");

                Debug.WriteLine("=== FILESREPOSITORY SAVE END ===");
                return fileName;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error saving file: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                // Clean up if there was an error
                Debug.WriteLine("Cleaning up after error");
                await DeleteFileAsync();
                Debug.WriteLine("=== FILESREPOSITORY SAVE ERROR ===");
                throw;
            }
        }

        public async Task<(Stream FileStream, string FileName)> GetFileAsync()
        {
            Debug.WriteLine("=== FILESREPOSITORY GET START ===");
            string filePath = Path.Combine(_storagePath, FileName);
            string metaPath = Path.Combine(_storagePath, MetaFileName);
            Debug.WriteLine($"File path: {filePath}");
            Debug.WriteLine($"Meta path: {metaPath}");
            
            if (!File.Exists(filePath) || !File.Exists(metaPath))
            {
                Debug.WriteLine("File or metadata does not exist");
                Debug.WriteLine($"File exists: {File.Exists(filePath)}, Meta exists: {File.Exists(metaPath)}");
                Debug.WriteLine("=== FILESREPOSITORY GET END (NOT FOUND) ===");
                return (null, null);
            }

            try
            {
                // Read the original filename
                Debug.WriteLine("Reading metadata file");
                string originalFileName = await File.ReadAllTextAsync(metaPath);
                Debug.WriteLine($"Original filename: {originalFileName}");
                
                // Create a memory stream and copy the file content
                Debug.WriteLine("Creating memory stream");
                var memoryStream = new MemoryStream();
                
                // Use a separate file stream for reading
                using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    Debug.WriteLine($"File stream opened, length: {fileStream.Length}");
                    Debug.WriteLine("Copying file stream to memory stream");
                    await fileStream.CopyToAsync(memoryStream);
                    Debug.WriteLine("File stream copied successfully");
                }
                
                // Reset the memory stream position
                memoryStream.Position = 0;
                Debug.WriteLine($"Memory stream position reset, length: {memoryStream.Length}");
                
                Debug.WriteLine("=== FILESREPOSITORY GET END ===");
                return (memoryStream, originalFileName);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error reading file: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                Debug.WriteLine("=== FILESREPOSITORY GET ERROR ===");
                return (null, null);
            }
        }

        public async Task DeleteFileAsync()
        {
            Debug.WriteLine("=== FILESREPOSITORY DELETE START ===");
            try
            {
                string filePath = Path.Combine(_storagePath, FileName);
                string metaPath = Path.Combine(_storagePath, MetaFileName);
                Debug.WriteLine($"File path: {filePath}");
                Debug.WriteLine($"Meta path: {metaPath}");
                
                // Delete both the file and its metadata
                if (File.Exists(filePath))
                {
                    Debug.WriteLine("Deleting file");
                    File.Delete(filePath);
                    Debug.WriteLine("File deleted");
                }
                else
                {
                    Debug.WriteLine("File does not exist, nothing to delete");
                }
                
                if (File.Exists(metaPath))
                {
                    Debug.WriteLine("Deleting metadata file");
                    File.Delete(metaPath);
                    Debug.WriteLine("Metadata file deleted");
                }
                else
                {
                    Debug.WriteLine("Metadata file does not exist, nothing to delete");
                }
                
                await Task.CompletedTask;
                Debug.WriteLine("=== FILESREPOSITORY DELETE END ===");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error deleting file: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                Debug.WriteLine("=== FILESREPOSITORY DELETE ERROR ===");
                throw;
            }
        }

        public Task<bool> FileExistsAsync()
        {
            Debug.WriteLine("=== FILESREPOSITORY EXISTS CHECK START ===");
            try
            {
                string filePath = Path.Combine(_storagePath, FileName);
                string metaPath = Path.Combine(_storagePath, MetaFileName);
                Debug.WriteLine($"File path: {filePath}");
                Debug.WriteLine($"Meta path: {metaPath}");
                
                bool fileExists = File.Exists(filePath);
                bool metaExists = File.Exists(metaPath);
                Debug.WriteLine($"File exists: {fileExists}, Meta exists: {metaExists}");
                
                Debug.WriteLine("=== FILESREPOSITORY EXISTS CHECK END ===");
                return Task.FromResult(fileExists && metaExists);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error checking file existence: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                Debug.WriteLine("=== FILESREPOSITORY EXISTS CHECK ERROR ===");
                return Task.FromResult(false);
            }
        }
    }
}
