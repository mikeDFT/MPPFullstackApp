using System;
using System.Diagnostics;
using System.IO;
using System.IO.Pipes;
using System.Net.Mime;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Services;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("files")]
    public class FilesController : ControllerBase
    {
        private readonly IFilesService _filesService;

        public FilesController(IFilesService filesService)
        {
            _filesService = filesService;
            Debug.WriteLine("FilesController constructor called");
        }

        [HttpPost("upload")]
        [RequestSizeLimit(600 * 1024 * 1024)] // 600MB limit
        [RequestFormLimits(MultipartBodyLengthLimit = 629145600)] // 600MB in bytes
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            Debug.WriteLine("=== UPLOAD FILE START ===");
            try
            {
                Debug.WriteLine($"Starting file upload: {file?.FileName}, Size: {file?.Length} bytes");
                Debug.WriteLine($"Request content type: {Request.ContentType}");
                Debug.WriteLine($"Request headers: {string.Join(", ", Request.Headers.Select(h => $"{h.Key}: {h.Value}"))}");

                if (file == null || file.Length == 0)
                {
                    Debug.WriteLine("No file was uploaded");
                    return BadRequest("No file was uploaded");
                }

                using (var stream = file.OpenReadStream())
                {
                    Debug.WriteLine($"File stream opened, length: {stream.Length}");
                    var fileName = await _filesService.UploadFileAsync(stream, file.FileName);
                    Debug.WriteLine($"File uploaded successfully: {fileName}");
                    Debug.WriteLine("=== UPLOAD FILE END ===");
                    return Ok(new { fileName });
                }
            }
            catch (ArgumentException ex)
            {
                Debug.WriteLine($"Invalid file upload attempt: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error during file upload: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("download")]
        public async Task<IActionResult> DownloadFile()
        {
            Debug.WriteLine("=== DOWNLOAD FILE START ===");
            try
            {
                Debug.WriteLine("Starting file download");
                var (fileStream, fileName) = await _filesService.DownloadFileAsync();
                
                if (fileStream == null || fileName == null)
                {
                    Debug.WriteLine("No file found for download");
                    Debug.WriteLine("=== DOWNLOAD FILE END ===");
                    return NotFound("No file found");
                }

                // determine content type based on file extension
                string contentType = GetContentType(fileName);
                Debug.WriteLine($"Downloading file: {fileName}, Content-Type: {contentType}");
                Debug.WriteLine($"File stream length: {fileStream.Length}");
                
                // Create a copy of the stream to avoid disposal issues
                var memoryStream = new MemoryStream();
                await fileStream.CopyToAsync(memoryStream);
                memoryStream.Position = 0;
                
                // Dispose the original stream
                fileStream.Dispose();
                
                // Set the Content-Disposition header with the original filename
                // This ensures the browser will use the original filename when downloading
                Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{fileName}\"");

                Debug.WriteLine(contentType);
                Debug.WriteLine(fileName);
                Debug.WriteLine("=== DOWNLOAD FILE END ===");
                return File(memoryStream, contentType, fileName);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error during file download: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("exists")]
        public async Task<IActionResult> FileExists()
        {
            Debug.WriteLine("=== FILE EXISTS CHECK START ===");
            try
            {
                Debug.WriteLine("Checking if file exists");
                var exists = await _filesService.FileExistsAsync();
                Debug.WriteLine($"File exists check result: {exists}");
                Debug.WriteLine("=== FILE EXISTS CHECK END ===");
                return Ok(new { exists });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error checking file existence: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                Debug.WriteLine($"Inner exception: {ex.InnerException?.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, $"Internal server error: {ex.Message}");
            }
        }

        private string GetContentType(string fileName)
        {
            try
            {
                Debug.WriteLine($"Determining content type for: {fileName}");
                var extension = Path.GetExtension(fileName).ToLowerInvariant();
                Debug.WriteLine($"File extension: {extension}");
                
                var contentType = extension switch
                {
                    ".txt" => MediaTypeNames.Text.Plain,
                    ".pdf" => MediaTypeNames.Application.Pdf,
                    ".doc" => "application/vnd.ms-word",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ".xls" => "application/vnd.ms-excel",
                    ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ".png" => MediaTypeNames.Image.Png,
                    ".jpg" => MediaTypeNames.Image.Jpeg,
                    ".jpeg" => MediaTypeNames.Image.Jpeg,
                    ".gif" => MediaTypeNames.Image.Gif,
                    ".csv" => "text/csv",
                    ".mp3" => "audio/mpeg",
                    ".wav" => "audio/wav",
                    ".ogg" => "audio/ogg",
                    ".mp4" => "video/mp4",
                    ".webm" => "video/webm",
                    ".zip" => "application/zip",
                    ".rar" => "application/x-rar-compressed",
                    ".7z" => "application/x-7z-compressed",
                    ".json" => "application/json",
                    ".xml" => "application/xml",
                    ".html" => "text/html",
                    ".css" => "text/css",
                    ".js" => "application/javascript",
                    ".py" => "text/x-python",
                    ".java" => "text/x-java-source",
                    ".c" => "text/x-c",
                    ".cpp" => "text/x-c++",
                    ".cs" => "text/x-csharp",
                    ".php" => "text/x-php",
                    ".rb" => "text/x-ruby",
                    ".swift" => "text/x-swift",
                    ".go" => "text/x-go",
                    ".rs" => "text/x-rust",
                    ".kt" => "text/x-kotlin",
                    ".ts" => "text/x-typescript",
                    ".md" => "text/markdown",
                    ".sql" => "text/x-sql",
                    ".sh" => "text/x-shellscript",
                    ".bat" => "text/x-batch",
                    ".ps1" => "text/x-powershell",
                    _ => MediaTypeNames.Application.Octet
                };
                
                Debug.WriteLine($"Content type determined: {contentType}");
                return contentType;
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error determining content type for {fileName}: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                return MediaTypeNames.Application.Octet;
            }
        }
    }
}
