using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Domain.DTOs;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Utils;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using VSFrontendBackend.Server.Repository;

namespace VSFrontendBackend.Server.Controllers
{
    //[ApiController]
    [Route("api/GeneratingGames")]
    public class GeneratingGamesController : ControllerBase, IDisposable
    {
        private readonly IGameService _gameService;
        private readonly CompanyRepository _companyRepository;
        private readonly ILogService _logService;
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> _generationTasks = new ConcurrentDictionary<string, CancellationTokenSource>();
        private static readonly ConcurrentDictionary<string, WebSocket> _activeConnections = new ConcurrentDictionary<string, WebSocket>();
        private const int GenerationTimeoutSeconds = 60;
        private static int _instanceCount = 0;
        private readonly int _instanceId;
		private readonly IHostApplicationLifetime _appLifetime;
		private bool _disposed = false;
        private readonly JsonSerializerOptions _jsonOptions = JsonConfig.DefaultOptions;

        public GeneratingGamesController(IGameService gameService, IHostApplicationLifetime appLifetime, 
            CompanyRepository companyRepository, ILogService logService)
        {
            _instanceId = Interlocked.Increment(ref _instanceCount);
            Debug.WriteLine($"GeneratingGamesController constructor called - Instance #{_instanceId}");
            _gameService = gameService;
            _companyRepository = companyRepository;
            _logService = logService;
			_appLifetime = appLifetime;
			
			// register shutdown handler
			_appLifetime.ApplicationStopping.Register(async () => 
			{
				Debug.WriteLine("Application stopping - cleaning up WebSocket connections");
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketCleanup",
                    Message = "Application stopping - cleaning up WebSocket connections",
                    Status = "Info"
                });
                
				await CleanupAllConnectionsAsync();
			});
        }

        [Route("ws")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task GetWebSocket()
        {
            var stopwatch = Stopwatch.StartNew();
            Debug.WriteLine("WebSocket request received");
            
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                Debug.WriteLine("WebSocket request accepted");
                using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                var connectionId = Guid.NewGuid().ToString();
                _activeConnections.TryAdd(connectionId, webSocket);
                Debug.WriteLine($"WebSocket connection established with ID: {connectionId}");
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketConnected",
                    RequestPath = HttpContext.Request.Path,
                    Message = $"WebSocket connection established with ID: {connectionId}",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "Connected",
                    ConnectionId = connectionId
                });

                // create task source to keep middleware alive during whole connection
                var socketFinishedTcs = new TaskCompletionSource<object>();
                
                try
                {
                    // handle the connection in background
                    _ = Task.Run(async () => {
                        try {
                            await HandleWebSocketConnection(connectionId, webSocket);
                        }
                        catch (Exception ex) {
                            Debug.WriteLine($"Error handling WebSocket connection: {ex.Message}");
                            Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                            
                            await _logService.LogActionAsync(new LogEntry
                            {
                                ActionType = "WebSocketError",
                                RequestPath = HttpContext.Request.Path,
                                Message = $"Error handling WebSocket connection",
                                ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                                Status = "Error",
                                ConnectionId = connectionId,
                                Errors = ex.Message + "\n" + ex.StackTrace
                            });
                        }
                        finally {
                            // signal that the connection has finished
                            socketFinishedTcs.TrySetResult(null);
                        }
                    });
                    
                    // wait for the WebSocket to finish before completing the response
                    await socketFinishedTcs.Task;
                }
                catch (WebSocketException ex)
                {
                    Debug.WriteLine($"WebSocket error: {ex.Message}");
                    Debug.WriteLine($"WebSocket error code: {ex.WebSocketErrorCode}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "WebSocketException",
                        RequestPath = HttpContext.Request.Path,
                        Message = $"WebSocket exception: {ex.WebSocketErrorCode}",
                        ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        Status = "Error",
                        ConnectionId = connectionId,
                        Errors = ex.Message + "\n" + ex.StackTrace
                    });
                    
                    socketFinishedTcs.TrySetResult(null);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error handling WebSocket connection: {ex.Message}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "WebSocketGeneralError",
                        RequestPath = HttpContext.Request.Path,
                        Message = "General error handling WebSocket connection",
                        ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        Status = "Error",
                        ConnectionId = connectionId,
                        Errors = ex.Message + "\n" + ex.StackTrace
                    });
                    
                    socketFinishedTcs.TrySetResult(null);
                }
                finally
                {
                    stopwatch.Stop();
                    Debug.WriteLine($"WebSocket connection closed for ID: {connectionId}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "WebSocketClosed",
                        RequestPath = HttpContext.Request.Path,
                        Message = $"WebSocket connection closed for ID: {connectionId}",
                        ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                        Status = "Closed",
                        ConnectionId = connectionId,
                        DurationMs = stopwatch.ElapsedMilliseconds
                    });
                    
                    _activeConnections.TryRemove(connectionId, out _);
                    if (_generationTasks.TryRemove(connectionId, out var cts))
                    {
                        cts.Cancel();
                        cts.Dispose();
                    }
                }
            }
            else
            {
                Debug.WriteLine("Not a WebSocket request, returning 400");
                HttpContext.Response.StatusCode = 400;
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketRejected",
                    RequestPath = HttpContext.Request.Path,
                    Message = "Not a WebSocket request",
                    ClientIpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                    Status = "400 Bad Request",
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task CleanupAllConnectionsAsync()
        {
            var stopwatch = Stopwatch.StartNew();
            Debug.WriteLine("Cleaning up all WebSocket connections and tasks");
            
            await _logService.LogActionAsync(new LogEntry
            {
                ActionType = "WebSocketCleanupAll",
                Message = $"Cleaning up all WebSocket connections ({_activeConnections.Count}) and tasks ({_generationTasks.Count})",
                Status = "Info"
            });
            
            // close all active websockets
            foreach (var kvp in _activeConnections)
            {
                var connectionId = kvp.Key;
                var socket = kvp.Value;
                
                try {
                    if (socket.State == WebSocketState.Open)
                    {
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Server shutting down", CancellationToken.None);
                        
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "WebSocketClosedByServer",
                            Message = "Server initiated WebSocket closure during cleanup",
                            Status = "Closed",
                            ConnectionId = connectionId
                        });
                    }
                    
                    // explicitly dispose the socket
                    socket.Dispose();
                }
                catch (Exception ex) {
                    Debug.WriteLine($"Error closing WebSocket: {ex.Message}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "WebSocketCleanupError",
                        Message = "Error closing WebSocket during cleanup",
                        Status = "Error",
                        ConnectionId = connectionId,
                        Errors = ex.Message + "\n" + ex.StackTrace
                    });
                }
            }

            // cancel and dispose all outstanding tasks
            foreach (var kvp in _generationTasks)
            {
                var connectionId = kvp.Key;
                var cts = kvp.Value;
                
                try {
                    cts.Cancel();
                    cts.Dispose();
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "GenerationTaskCancelled",
                        Message = "Generation task cancelled during cleanup",
                        Status = "Cancelled",
                        ConnectionId = connectionId
                    });
                }
                catch (Exception ex) {
                    Debug.WriteLine($"Error disposing CancellationTokenSource: {ex.Message}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "TaskCleanupError",
                        Message = "Error disposing CancellationTokenSource during cleanup",
                        Status = "Error",
                        ConnectionId = connectionId,
                        Errors = ex.Message + "\n" + ex.StackTrace
                    });
                }
            }

            // clear both collections
            _activeConnections.Clear();
            _generationTasks.Clear();
            
            stopwatch.Stop();
            
            await _logService.LogActionAsync(new LogEntry
            {
                ActionType = "WebSocketCleanupComplete",
                Message = "WebSocket connections and tasks cleanup completed",
                Status = "Completed",
                DurationMs = stopwatch.ElapsedMilliseconds
            });
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        // keep this for backward compatibility
        public async Task CloseAllAsync()
        {
            await CleanupAllConnectionsAsync();
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        // implement IDisposable pattern
        public void Dispose()
        {
            // dispose of unmanaged resources
            Dispose(true);
            // suppress finalization
            GC.SuppressFinalize(this);
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    // dispose managed resources
                    Task.Run(async () => {
                        await CleanupAllConnectionsAsync();
                    }).GetAwaiter().GetResult();
                }

                // dispose unmanaged resources
                _disposed = true;
            }
        }
        
        [ApiExplorerSettings(IgnoreApi = true)]
        private async Task HandleWebSocketConnection(string connectionId, WebSocket webSocket)
        {
            var stopwatch = Stopwatch.StartNew();
            Debug.WriteLine($"Starting to handle WebSocket connection for ID: {connectionId}");
            var buffer = new byte[1024 * 4];
            
            try
            {
                // Start the loop to wait for messages
                WebSocketReceiveResult? receiveResult = null;
                while (webSocket.State == WebSocketState.Open)
                {
                    try
                    {
                        // Use a cancellation token with timeout to avoid hanging indefinitely
                        using var receiveTimeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                        
                        // Wait for a message from the client
                        receiveResult = await webSocket.ReceiveAsync(
                            new ArraySegment<byte>(buffer), 
                            receiveTimeoutCts.Token);
                        
                        if (receiveResult.CloseStatus.HasValue)
                        {
                             Debug.WriteLine($"WebSocket close message received: {receiveResult.CloseStatus.Value}");
                             
                             await _logService.LogActionAsync(new LogEntry
                             {
                                 ActionType = "WebSocketCloseReceived",
                                 Message = $"WebSocket close message received: {receiveResult.CloseStatus.Value}",
                                 Status = "Closing",
                                 ConnectionId = connectionId,
                                 AdditionalInfo = receiveResult.CloseStatusDescription
                             });
                             
                             // Normal close - acknowledge it properly
                             await webSocket.CloseAsync(
                                receiveResult.CloseStatus.Value,
                                receiveResult.CloseStatusDescription,
                                CancellationToken.None);
                             break;
                        }

                        var message = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                        Debug.WriteLine($"Received message: {message}");
                    
                        try
                        {
                            var command = JsonSerializer.Deserialize<WebSocketCommand>(message);

                            if (command != null)
                            {
                                Debug.WriteLine($"Processing command: {command.action}");
                                
                                await _logService.LogActionAsync(new LogEntry
                                {
                                    ActionType = "WebSocketCommandReceived",
                                    Message = $"Processing command: {command.action}",
                                    Status = "Received",
                                    ConnectionId = connectionId,
                                    AdditionalInfo = command.data
                                });
                                
                                switch (command.action.ToLower())
                                {
                                    case "start":
                                        await StartGeneratingGames(connectionId, webSocket);
                                        break;
                                    case "stop":
                                        await StopGeneratingGames(connectionId);
                                        break;
                                    case "ping":
                                        await HandlePing(connectionId, webSocket);
                                        break;
                                    default:
                                        Debug.WriteLine($"Unknown command: {command.action}");
                                        
                                        await _logService.LogActionAsync(new LogEntry
                                        {
                                            ActionType = "UnknownWebSocketCommand",
                                            Message = $"Unknown command received: {command.action}",
                                            Status = "Warning",
                                            ConnectionId = connectionId,
                                            AdditionalInfo = command.data
                                        });
                                        break;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine($"Error processing message: {ex.Message}");
                            
                            await _logService.LogActionAsync(new LogEntry
                            {
                                ActionType = "WebSocketMessageProcessingError",
                                Message = $"Error processing WebSocket message",
                                Status = "Error",
                                ConnectionId = connectionId,
                                Errors = ex.Message + "\n" + ex.StackTrace,
                                AdditionalInfo = message
                            });
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        Debug.WriteLine($"Receive operation timed out for connection ID: {connectionId}");
                        // If no message received within timeout, send a ping to check if client is still alive
                        try {
                            if (webSocket.State == WebSocketState.Open) {
                                await HandlePing(connectionId, webSocket);
                            }
                        }
                        catch (Exception ex) {
                            Debug.WriteLine($"Error sending ping after timeout: {ex.Message}");
                            
                            await _logService.LogActionAsync(new LogEntry
                            {
                                ActionType = "WebSocketPingError",
                                Message = "Error sending ping after timeout",
                                Status = "Error",
                                ConnectionId = connectionId,
                                Errors = ex.Message + "\n" + ex.StackTrace
                            });
                            
                            break;
                        }
                    }
                    catch (WebSocketException ex) when (ex.WebSocketErrorCode == WebSocketError.ConnectionClosedPrematurely)
                    {
                         Debug.WriteLine($"WebSocket connection closed prematurely: {ex.Message}");
                         
                         await _logService.LogActionAsync(new LogEntry
                         {
                             ActionType = "WebSocketClosedPrematurely",
                             Message = "WebSocket connection closed prematurely",
                             Status = "Error",
                             ConnectionId = connectionId,
                             Errors = ex.Message + "\n" + ex.StackTrace
                         });
                         
                         break; // Exit loop on premature close
                    }
                    catch (WebSocketException ex)
                    {
                        Debug.WriteLine($"WebSocket receive error: {ex.Message} Code: {ex.WebSocketErrorCode}");
                        
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "WebSocketReceiveError",
                            Message = $"WebSocket receive error: {ex.WebSocketErrorCode}",
                            Status = "Error",
                            ConnectionId = connectionId,
                            Errors = ex.Message + "\n" + ex.StackTrace
                        });
                        
                        break; // Exit loop on other WebSocket errors
                    }
                    catch (Exception ex) // Catch other potential exceptions during receive
                    {
                        Debug.WriteLine($"General error during WebSocket receive: {ex.Message}");
                        
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "WebSocketGeneralReceiveError",
                            Message = "General error during WebSocket receive",
                            Status = "Error",
                            ConnectionId = connectionId,
                            Errors = ex.Message + "\n" + ex.StackTrace
                        });
                        
                        break; // Exit loop on general errors
                    }
                }

                Debug.WriteLine($"Exited WebSocket receive loop for connection ID: {connectionId}. State: {webSocket.State}");

                // Always try to close the connection gracefully if it's still open
                if (webSocket.State == WebSocketState.Open)
                {
                    try
                    {
                        Debug.WriteLine($"Closing WebSocket gracefully for connection ID: {connectionId}");
                        await webSocket.CloseAsync(
                            WebSocketCloseStatus.NormalClosure,
                            "Server closing connection",
                            CancellationToken.None);
                            
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "WebSocketGracefulClose",
                            Message = "Closing WebSocket gracefully",
                            Status = "Closed",
                            ConnectionId = connectionId
                        });
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"Error during graceful close: {ex.Message}");
                        
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "WebSocketGracefulCloseError",
                            Message = "Error during graceful close of WebSocket",
                            Status = "Error",
                            ConnectionId = connectionId,
                            Errors = ex.Message + "\n" + ex.StackTrace
                        });
                    }
                }
            }
            catch (WebSocketException ex)
            {
                Debug.WriteLine($"WebSocket error in HandleWebSocketConnection: {ex.Message}");
                Debug.WriteLine($"WebSocket error code: {ex.WebSocketErrorCode}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketHandlerError",
                    Message = $"WebSocket error in connection handler: {ex.WebSocketErrorCode}",
                    Status = "Error",
                    ConnectionId = connectionId,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"General error in HandleWebSocketConnection: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketHandlerGeneralError",
                    Message = "General error in WebSocket connection handler",
                    Status = "Error",
                    ConnectionId = connectionId,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
            }
            finally
            {
                // Ensure cleanup runs even if exceptions occur
                Debug.WriteLine($"Ensuring connection cleanup for ID: {connectionId}");
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketHandlerComplete",
                    Message = "WebSocket connection handler completed",
                    Status = "Completed",
                    ConnectionId = connectionId,
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
                
                _activeConnections.TryRemove(connectionId, out _);
                if (_generationTasks.TryRemove(connectionId, out var cts))
                {
                    Debug.WriteLine($"Cancelling generation task for connection ID: {connectionId}");
                    cts.Cancel();
                    cts.Dispose();
                }
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        private async Task StartGeneratingGames(string connectionId, WebSocket webSocket)
        {
            var stopwatch = Stopwatch.StartNew();
            Debug.WriteLine($"Starting game generation for connection ID: {connectionId}");
            
            await _logService.LogActionAsync(new LogEntry
            {
                ActionType = "GameGenerationStarting",
                Message = "Starting game generation",
                Status = "Starting",
                ConnectionId = connectionId
            });
            
            // Cancel any existing generation task
            if (_generationTasks.TryRemove(connectionId, out var existingCts))
            {
                Debug.WriteLine($"Cancelling existing generation task for connection ID: {connectionId}");
                existingCts.Cancel();
                existingCts.Dispose();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GameGenerationCancelled",
                    Message = "Cancelled existing game generation task",
                    Status = "Cancelled",
                    ConnectionId = connectionId
                });
            }

            // Create a new cancellation token source
            var cts = new CancellationTokenSource();
            _generationTasks.TryAdd(connectionId, cts);

            // Set a timeout to automatically stop after 15 seconds
            var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(GenerationTimeoutSeconds));
            var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cts.Token, timeoutCts.Token);

            // Start the generation task
            _ = Task.Run(async () =>
            {
                try
                {
                    Debug.WriteLine($"Game generation task started for connection ID: {connectionId}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "GameGenerationTaskStarted",
                        Message = "Game generation task started",
                        Status = "Running",
                        ConnectionId = connectionId
                    });
                    
                    // Get the current list of games from the service
                    var filterParams = new FilterSortingGamesParams();
                    var gamesList = await _gameService.GetAllAsync(filterParams);
                    var random = new Random();
                    var gamesGenerated = 0;

                    while (!linkedCts.Token.IsCancellationRequested)
                    {
                        try 
                        {
                            // Generate a new game
                            var newGame = GameDataGenerator.GenerateGameData(gamesList, _companyRepository);
                            Debug.WriteLine($"Generated new game: {newGame.Name}");
                            
                            // Add the game to the service
                            var addedGame = await _gameService.ModifyAsync(newGame);
                            Debug.WriteLine($"Added game to service: {addedGame.Name}");
                            gamesGenerated++;
                            
                            await _logService.LogActionAsync(new LogEntry
                            {
                                ActionType = "GameGenerated",
                                Message = $"Generated and added new game: {addedGame.Name} (ID: {addedGame.Id})",
                                Status = "Created",
                                ConnectionId = connectionId
                            });
                            
                            // Update our local list
                            gamesList = await _gameService.GetAllAsync(filterParams);

                            // Convert Game entity to GameDTO before sending
                            var gameDto = GameDTO.FromGame(addedGame);
                            var gameJson = JsonSerializer.Serialize(gameDto, _jsonOptions);
                            var message = new WebSocketMessage
                            {
                                action = "newGame",
                                data = gameJson
                            };
                            var messageJson = JsonSerializer.Serialize(message, _jsonOptions);
                            var messageBytes = Encoding.UTF8.GetBytes(messageJson);

                            // Check if the connection is still active and open before sending
                            if (_activeConnections.TryGetValue(connectionId, out var ws) && 
                                ws != null && 
                                ws.State == WebSocketState.Open)
                            {
                                await ws.SendAsync(
                                    new ArraySegment<byte>(messageBytes), 
                                    WebSocketMessageType.Text, 
                                    true, 
                                    linkedCts.Token);
                                Debug.WriteLine($"Sent new game to client: {addedGame.Name}");
                                
                                await _logService.LogActionAsync(new LogEntry
                                {
                                    ActionType = "GameSentToClient",
                                    Message = $"Sent new game to client: {addedGame.Name} (ID: {addedGame.Id})",
                                    Status = "Sent",
                                    ConnectionId = connectionId
                                });
                            }
                            else
                            {
                                Debug.WriteLine($"Could not send game to client - WebSocket not found or not open");
                                
                                await _logService.LogActionAsync(new LogEntry
                                {
                                    ActionType = "GameSendError",
                                    Message = "Could not send game to client - WebSocket not found or not open",
                                    Status = "Error",
                                    ConnectionId = connectionId
                                });
                                
                                // Connection is no longer valid, cancel the generation task
                                linkedCts.Cancel();
                                break;
                            }

                            // Wait for a short time before generating the next game
                            await Task.Delay(100, linkedCts.Token);
                        }
                        catch (OperationCanceledException)
                        {
                            // Task was cancelled, break out of the loop
                            break;
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine($"Error generating or sending game: {ex.Message}");
                            
                            await _logService.LogActionAsync(new LogEntry
                            {
                                ActionType = "GameGenerationError",
                                Message = "Error generating or sending game",
                                Status = "Error",
                                ConnectionId = connectionId,
                                Errors = ex.Message + "\n" + ex.StackTrace
                            });
                            
                            // Brief pause before trying again
                            await Task.Delay(500, linkedCts.Token);
                        }
                    }
                    
                    if (timeoutCts.IsCancellationRequested)
                    {
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "GameGenerationTimeout",
                            Message = $"Game generation timed out after {GenerationTimeoutSeconds} seconds",
                            Status = "Timeout",
                            ConnectionId = connectionId,
                            AdditionalInfo = $"Games generated: {gamesGenerated}"
                        });
                    }
                }
                catch (OperationCanceledException)
                {
                    Debug.WriteLine($"Game generation task cancelled for connection ID: {connectionId}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "GameGenerationCancelled",
                        Message = "Game generation task cancelled",
                        Status = "Cancelled",
                        ConnectionId = connectionId
                    });
                    
                    // This is expected when the task is cancelled
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error generating games: {ex.Message}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "GameGenerationTaskError",
                        Message = "Error in game generation task",
                        Status = "Error",
                        ConnectionId = connectionId,
                        Errors = ex.Message + "\n" + ex.StackTrace
                    });
                }
                finally
                {
                    Debug.WriteLine($"Game generation task completed for connection ID: {connectionId}");
                    
                    stopwatch.Stop();
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "GameGenerationTaskCompleted",
                        Message = "Game generation task completed",
                        Status = "Completed",
                        ConnectionId = connectionId,
                        DurationMs = stopwatch.ElapsedMilliseconds
                    });
                    
                    timeoutCts.Dispose();
                    linkedCts.Dispose();
                    
                    // Make sure the task is removed from the collection
                    _generationTasks.TryRemove(connectionId, out _);
                }
            }, linkedCts.Token);

            // Send confirmation to the client
            var response = new WebSocketMessage
            {
                action = "started",
                data = "Game generation started"
            };
            var responseJson = JsonSerializer.Serialize(response, _jsonOptions);
            var responseBytes = Encoding.UTF8.GetBytes(responseJson);
            
            try
            {
                await webSocket.SendAsync(
                    new ArraySegment<byte>(responseBytes), 
                    WebSocketMessageType.Text, 
                    true, 
                    CancellationToken.None);
                Debug.WriteLine($"Sent start confirmation to client for connection ID: {connectionId}");
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GameGenerationStartConfirmation",
                    Message = "Sent game generation start confirmation to client",
                    Status = "Sent",
                    ConnectionId = connectionId
                });
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error sending start confirmation: {ex.Message}");
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GameGenerationStartConfirmationError",
                    Message = "Error sending game generation start confirmation",
                    Status = "Error",
                    ConnectionId = connectionId,
                    Errors = ex.Message + "\n" + ex.StackTrace
                });
                
                // Cancel the task if we couldn't send the confirmation
                cts.Cancel();
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        private async Task StopGeneratingGames(string connectionId)
        {
            var stopwatch = Stopwatch.StartNew();
            Debug.WriteLine($"Stopping game generation for connection ID: {connectionId}");
            
            await _logService.LogActionAsync(new LogEntry
            {
                ActionType = "GameGenerationStopping",
                Message = "Stopping game generation",
                Status = "Stopping",
                ConnectionId = connectionId
            });
            
            if (_generationTasks.TryRemove(connectionId, out var cts))
            {
                cts.Cancel();
                cts.Dispose();

                if (_activeConnections.TryGetValue(connectionId, out var webSocket) && webSocket.State == WebSocketState.Open)
                {
                    var response = new WebSocketMessage
                    {
                        action = "stopped",
                        data = "Game generation stopped"
                    };
                    var responseJson = JsonSerializer.Serialize(response, _jsonOptions);
                    var responseBytes = Encoding.UTF8.GetBytes(responseJson);
                    
                    try
                    {
                        await webSocket.SendAsync(new ArraySegment<byte>(responseBytes), WebSocketMessageType.Text, true, CancellationToken.None);
                        Debug.WriteLine($"Sent stop confirmation to client for connection ID: {connectionId}");
                        
                        stopwatch.Stop();
                        
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "GameGenerationStopConfirmation",
                            Message = "Sent game generation stop confirmation to client",
                            Status = "Sent",
                            ConnectionId = connectionId,
                            DurationMs = stopwatch.ElapsedMilliseconds
                        });
                    }
                    catch (Exception ex)
                    {
                        stopwatch.Stop();
                        
                        await _logService.LogActionAsync(new LogEntry
                        {
                            ActionType = "GameGenerationStopConfirmationError",
                            Message = "Error sending game generation stop confirmation",
                            Status = "Error",
                            ConnectionId = connectionId,
                            DurationMs = stopwatch.ElapsedMilliseconds,
                            Errors = ex.Message + "\n" + ex.StackTrace
                        });
                    }
                }
            }
            else
            {
                Debug.WriteLine($"No active generation task found for connection ID: {connectionId}");
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "GameGenerationStopNotFound",
                    Message = "No active generation task found to stop",
                    Status = "Warning",
                    ConnectionId = connectionId,
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        private async Task HandlePing(string connectionId, WebSocket webSocket)
        {
            var stopwatch = Stopwatch.StartNew();
            Debug.WriteLine($"Ping received from connection ID: {connectionId}");
            
            await _logService.LogActionAsync(new LogEntry
            {
                ActionType = "WebSocketPingReceived",
                Message = "Ping received from client",
                Status = "Received",
                ConnectionId = connectionId
            });
            
            if (webSocket.State == WebSocketState.Open)
            {
                try
                {
                    var response = new WebSocketMessage
                    {
                        action = "pong",
                        data = "Server is alive"
                    };
                    var responseJson = JsonSerializer.Serialize(response, _jsonOptions);
                    var responseBytes = Encoding.UTF8.GetBytes(responseJson);
                    await webSocket.SendAsync(new ArraySegment<byte>(responseBytes), WebSocketMessageType.Text, true, CancellationToken.None);
                    Debug.WriteLine($"Pong sent to client for connection ID: {connectionId}");
                    
                    stopwatch.Stop();
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "WebSocketPongSent",
                        Message = "Pong sent to client",
                        Status = "Sent",
                        ConnectionId = connectionId,
                        DurationMs = stopwatch.ElapsedMilliseconds
                    });
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error sending pong: {ex.Message}");
                    
                    stopwatch.Stop();
                    
                    await _logService.LogActionAsync(new LogEntry
                    {
                        ActionType = "WebSocketPongError",
                        Message = "Error sending pong response",
                        Status = "Error",
                        ConnectionId = connectionId,
                        DurationMs = stopwatch.ElapsedMilliseconds,
                        Errors = ex.Message + "\n" + ex.StackTrace
                    });
                }
            }
            else
            {
                Debug.WriteLine($"Cannot send pong - WebSocket not open for connection ID: {connectionId}");
                
                stopwatch.Stop();
                
                await _logService.LogActionAsync(new LogEntry
                {
                    ActionType = "WebSocketPongNotSent",
                    Message = "Cannot send pong - WebSocket not open",
                    Status = "Warning",
                    ConnectionId = connectionId,
                    DurationMs = stopwatch.ElapsedMilliseconds
                });
            }
        }
    }

    public class WebSocketCommand
    {
        public string action { get; set; } = "DefAction";
        public string data { get; set; } = "DefData";
    }

    public class WebSocketMessage
    {
        public string action { get; set; } = "DefAction";
        public string data { get; set; } = "DefData";
    }
}
