using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Domain;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Utils;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Mvc.ApiExplorer;

namespace VSFrontendBackend.Server.Controllers
{
    //[ApiController]
    [Route("api/GeneratingGames")]
    public class GeneratingGamesController : ControllerBase, IDisposable
    {
        private readonly IGameService _gameService;
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> _generationTasks = new ConcurrentDictionary<string, CancellationTokenSource>();
        private static readonly ConcurrentDictionary<string, WebSocket> _activeConnections = new ConcurrentDictionary<string, WebSocket>();
        private const int GenerationTimeoutSeconds = 60;
        private static int _instanceCount = 0;
        private readonly int _instanceId;
		private readonly IHostApplicationLifetime _appLifetime;
		private bool _disposed = false;

        public GeneratingGamesController(IGameService gameService, IHostApplicationLifetime appLifetime)
        {
            _instanceId = Interlocked.Increment(ref _instanceCount);
            Debug.WriteLine($"GeneratingGamesController constructor called - Instance #{_instanceId}");
            _gameService = gameService;
			_appLifetime = appLifetime;
			
			// register shutdown handler
			_appLifetime.ApplicationStopping.Register(async () => 
			{
				Debug.WriteLine("Application stopping - cleaning up WebSocket connections");
				await CleanupAllConnectionsAsync();
			});
        }

        [Route("ws")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task GetWebSocket()
        {
            Debug.WriteLine("WebSocket request received");
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                Debug.WriteLine("WebSocket request accepted");
                using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                var connectionId = Guid.NewGuid().ToString();
                _activeConnections.TryAdd(connectionId, webSocket);
                Debug.WriteLine($"WebSocket connection established with ID: {connectionId}");

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
                    socketFinishedTcs.TrySetResult(null);
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error handling WebSocket connection: {ex.Message}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                    socketFinishedTcs.TrySetResult(null);
                }
                finally
                {
                    Debug.WriteLine($"WebSocket connection closed for ID: {connectionId}");
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
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task CleanupAllConnectionsAsync()
        {
            Debug.WriteLine("Cleaning up all WebSocket connections and tasks");
            
            // close all active websockets
            foreach (var socket in _activeConnections.Values)
            {
                try {
                    if (socket.State == WebSocketState.Open)
                    {
                        await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Server shutting down", CancellationToken.None);
                    }
                    
                    // explicitly dispose the socket
                    socket.Dispose();
                }
                catch (Exception ex) {
                    Debug.WriteLine($"Error closing WebSocket: {ex.Message}");
                }
            }

            // cancel and dispose all outstanding tasks
            foreach (var cts in _generationTasks.Values)
            {
                try {
                    cts.Cancel();
                    cts.Dispose();
                }
                catch (Exception ex) {
                    Debug.WriteLine($"Error disposing CancellationTokenSource: {ex.Message}");
                }
            }

            // clear both collections
            _activeConnections.Clear();
            _generationTasks.Clear();
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
                                        break;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine($"Error processing message: {ex.Message}");
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
                            break;
                        }
                    }
                    catch (WebSocketException ex) when (ex.WebSocketErrorCode == WebSocketError.ConnectionClosedPrematurely)
                    {
                         Debug.WriteLine($"WebSocket connection closed prematurely: {ex.Message}");
                         break; // Exit loop on premature close
                    }
                    catch (WebSocketException ex)
                    {
                        Debug.WriteLine($"WebSocket receive error: {ex.Message} Code: {ex.WebSocketErrorCode}");
                        break; // Exit loop on other WebSocket errors
                    }
                    catch (Exception ex) // Catch other potential exceptions during receive
                    {
                        Debug.WriteLine($"General error during WebSocket receive: {ex.Message}");
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
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"Error during graceful close: {ex.Message}");
                    }
                }
            }
            catch (WebSocketException ex)
            {
                Debug.WriteLine($"WebSocket error in HandleWebSocketConnection: {ex.Message}");
                Debug.WriteLine($"WebSocket error code: {ex.WebSocketErrorCode}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"General error in HandleWebSocketConnection: {ex.Message}");
                Debug.WriteLine($"Stack trace: {ex.StackTrace}");
            }
            finally
            {
                // Ensure cleanup runs even if exceptions occur
                Debug.WriteLine($"Ensuring connection cleanup for ID: {connectionId}");
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
            Debug.WriteLine($"Starting game generation for connection ID: {connectionId}");
            
            // Cancel any existing generation task
            if (_generationTasks.TryRemove(connectionId, out var existingCts))
            {
                Debug.WriteLine($"Cancelling existing generation task for connection ID: {connectionId}");
                existingCts.Cancel();
                existingCts.Dispose();
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
                    
                    // Get the current list of games from the service
                    var filterParams = new FilterSortingGamesParams();
                    var gamesList = _gameService.GetAllAsync(filterParams);
                    var random = new Random();

                    while (!linkedCts.Token.IsCancellationRequested)
                    {
                        try 
                        {
                            // Generate a new game
                            var newGame = GameDataGenerator.GenerateGameData(gamesList);
                            Debug.WriteLine($"Generated new game: {newGame.Name}");
                            
                            // Add the game to the service
                            var addedGame = _gameService.ModifyAsync(newGame);
                            Debug.WriteLine($"Added game to service: {addedGame.Name}");
                            
                            // Update our local list
                            gamesList = _gameService.GetAllAsync(filterParams);

                            // Send the new game to the client
                            var gameJson = JsonSerializer.Serialize(addedGame);
                            var message = new WebSocketMessage
                            {
                                action = "newGame",
                                data = gameJson
                            };
                            var messageJson = JsonSerializer.Serialize(message);
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
                            }
                            else
                            {
                                Debug.WriteLine($"Could not send game to client - WebSocket not found or not open");
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
                            // Brief pause before trying again
                            await Task.Delay(500, linkedCts.Token);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    Debug.WriteLine($"Game generation task cancelled for connection ID: {connectionId}");
                    // This is expected when the task is cancelled
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error generating games: {ex.Message}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                }
                finally
                {
                    Debug.WriteLine($"Game generation task completed for connection ID: {connectionId}");
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
            var responseJson = JsonSerializer.Serialize(response);
            var responseBytes = Encoding.UTF8.GetBytes(responseJson);
            
            try
            {
                await webSocket.SendAsync(
                    new ArraySegment<byte>(responseBytes), 
                    WebSocketMessageType.Text, 
                    true, 
                    CancellationToken.None);
                Debug.WriteLine($"Sent start confirmation to client for connection ID: {connectionId}");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Error sending start confirmation: {ex.Message}");
                // Cancel the task if we couldn't send the confirmation
                cts.Cancel();
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        private async Task StopGeneratingGames(string connectionId)
        {
            Debug.WriteLine($"Stopping game generation for connection ID: {connectionId}");
            
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
                    var responseJson = JsonSerializer.Serialize(response);
                    var responseBytes = Encoding.UTF8.GetBytes(responseJson);
                    await webSocket.SendAsync(new ArraySegment<byte>(responseBytes), WebSocketMessageType.Text, true, CancellationToken.None);
                    Debug.WriteLine($"Sent stop confirmation to client for connection ID: {connectionId}");
                }
            }
            else
            {
                Debug.WriteLine($"No active generation task found for connection ID: {connectionId}");
            }
        }

        [ApiExplorerSettings(IgnoreApi = true)]
        private async Task HandlePing(string connectionId, WebSocket webSocket)
        {
            Debug.WriteLine($"Ping received from connection ID: {connectionId}");
            
            if (webSocket.State == WebSocketState.Open)
            {
                try
                {
                    var response = new WebSocketMessage
                    {
                        action = "pong",
                        data = "Server is alive"
                    };
                    var responseJson = JsonSerializer.Serialize(response);
                    var responseBytes = Encoding.UTF8.GetBytes(responseJson);
                    await webSocket.SendAsync(new ArraySegment<byte>(responseBytes), WebSocketMessageType.Text, true, CancellationToken.None);
                    Debug.WriteLine($"Pong sent to client for connection ID: {connectionId}");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error sending pong: {ex.Message}");
                }
            }
            else
            {
                Debug.WriteLine($"Cannot send pong - WebSocket not open for connection ID: {connectionId}");
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
