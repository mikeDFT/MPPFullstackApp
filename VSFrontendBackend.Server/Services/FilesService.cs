using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using VSFrontendBackend.Server.Repository;

namespace VSFrontendBackend.Server.Services
{
    public interface IFilesService
    {
        Task<string> UploadFileAsync(Stream fileStream, string fileName);
        Task<(Stream FileStream, string FileName)> DownloadFileAsync();
        Task<bool> FileExistsAsync();
    }

    public class FilesService : IFilesService
    {
        private readonly IFilesRepository _filesRepository;

        public FilesService(IFilesRepository filesRepository)
        {
            _filesRepository = filesRepository;
            Debug.WriteLine("FilesService constructor called");
        }

        public async Task<string> UploadFileAsync(Stream fileStream, string fileName)
        {
            Debug.WriteLine("=== FILESERVICE UPLOAD START ===");
            try
            {
                // validate file size (600MB limit)
                const long maxFileSize = 600 * 1024 * 1024; // 600MB in bytes
                Debug.WriteLine($"Uploading file: {fileName}, Stream Length: {fileStream.Length}");
                Debug.WriteLine($"Stream can read: {fileStream.CanRead}, Stream can seek: {fileStream.CanSeek}");
                
                // Create a memory stream to hold the file content
                using (var memoryStream = new MemoryStream())
                {
                    Debug.WriteLine("Created memory stream for file size check");
                    
                    // Copy the file stream to memory stream
                    await fileStream.CopyToAsync(memoryStream);
                    Debug.WriteLine($"Memory Stream Length: {memoryStream.Length}");

                    if (memoryStream.Length > maxFileSize)
                    {
                        Debug.WriteLine($"File size {memoryStream.Length} exceeds limit {maxFileSize}");
                        throw new ArgumentException($"File size exceeds the maximum allowed size of 600MB");
                    }
                    
                    // reset the memory stream position
                    memoryStream.Position = 0;
                    Debug.WriteLine("Reset memory stream position to 0");
                    
                    // Create a new memory stream for the repository to avoid disposal issues
                    var repositoryStream = new MemoryStream();
                    await memoryStream.CopyToAsync(repositoryStream);
                    repositoryStream.Position = 0;
                    
                    // save the file
                    Debug.WriteLine("Calling repository to save file");
                    var result = await _filesRepository.SaveFileAsync(repositoryStream, fileName);
                    Debug.WriteLine($"File saved successfully: {result}");
                    Debug.WriteLine("=== FILESERVICE UPLOAD END ===");
                    return result;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error in UploadFileAsync: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                Debug.WriteLine("=== FILESERVICE UPLOAD ERROR ===");
                throw;
            }
        }

        public async Task<(Stream FileStream, string FileName)> DownloadFileAsync()
        {
            Debug.WriteLine("=== FILESERVICE DOWNLOAD START ===");
            try
            {
                Debug.WriteLine("Calling repository to get file");
                var result = await _filesRepository.GetFileAsync();
                Debug.WriteLine($"Downloaded file: {result.FileName}, Stream is null: {result.FileStream == null}");
                
                if (result.FileStream != null)
                {
                    Debug.WriteLine($"Stream length: {result.FileStream.Length}");
                    Debug.WriteLine($"Stream can read: {result.FileStream.CanRead}, Stream can seek: {result.FileStream.CanSeek}");
                }
                
                Debug.WriteLine("=== FILESERVICE DOWNLOAD END ===");
                return result;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error in DownloadFileAsync: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                Debug.WriteLine("=== FILESERVICE DOWNLOAD ERROR ===");
                throw;
            }
        }

        public async Task<bool> FileExistsAsync()
        {
            Debug.WriteLine("=== FILESERVICE EXISTS CHECK START ===");
            try
            {
                Debug.WriteLine("Calling repository to check if file exists");
                var exists = await _filesRepository.FileExistsAsync();
                Debug.WriteLine($"File exists check: {exists}");
                Debug.WriteLine("=== FILESERVICE EXISTS CHECK END ===");
                return exists;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error in FileExistsAsync: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                Debug.WriteLine("=== FILESERVICE EXISTS CHECK ERROR ===");
                return false;
            }
        }
    }
}
