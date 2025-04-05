using System;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using VSFrontendBackend.Server.Models;
using VSFrontendBackend.Server.Services;
using VSFrontendBackend.Server.Utils;

namespace VSFrontendBackend.Server.Controllers
{
    [ApiController]
    [Route("api/GeneratingGames")]
    public class GeneratingGamesController : ControllerBase
    {
        private readonly IGameService _gameService;
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> _generationTasks = new ConcurrentDictionary<string, CancellationTokenSource>();
        private static readonly ConcurrentDictionary<string, WebSocket> _activeConnections = new ConcurrentDictionary<string, WebSocket>();
        private const int GenerationTimeoutSeconds = 15;
        private static int _instanceCount = 0;
        private readonly int _instanceId;

        public GeneratingGamesController(IGameService gameService)
        {
            _instanceId = Interlocked.Increment(ref _instanceCount);
            Debug.WriteLine($"GeneratingGamesController constructor called - Instance #{_instanceId}");
            _gameService = gameService;
        }

        [HttpGet("ws")]
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

                try
                {
                    await HandleWebSocketConnection(connectionId, webSocket);
                }
                catch (WebSocketException ex)
                {
                    Debug.WriteLine($"WebSocket error: {ex.Message}");
                    Debug.WriteLine($"WebSocket error code: {ex.WebSocketErrorCode}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error handling WebSocket connection: {ex.Message}");
                    Debug.WriteLine($"Stack trace: {ex.StackTrace}");
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

        private async Task HandleWebSocketConnection(string connectionId, WebSocket webSocket)
        {
            Debug.WriteLine($"Starting to handle WebSocket connection for ID: {connectionId}");
            var buffer = new byte[1024 * 4];
            
            try
            {
                // Start the loop to wait for messages
                WebSocketReceiveResult? receiveResult = null;
                do
                {
                    try
                    {
                        // Wait for a message from the client
                        receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                        
                        if (receiveResult.CloseStatus.HasValue)
                        {
                             Debug.WriteLine($"WebSocket close message received: {receiveResult.CloseStatus.Value}");
                             break; // Exit loop if close message received
                        }

                        var message = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                        Debug.WriteLine($"Received message: {message}");
                    
                        try
                        {
                            var command = JsonSerializer.Deserialize<WebSocketCommand>(message);

                            if (command != null)
                            {
                                Debug.WriteLine($"Processing command: {command.Action}");
                                switch (command.Action.ToLower())
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
                                        Debug.WriteLine($"Unknown command: {command.Action}");
                                        break;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine($"Error processing message: {ex.Message}");
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

                } while (webSocket.State == WebSocketState.Open); // Continue while the socket is open

                Debug.WriteLine($"Exited WebSocket receive loop for connection ID: {connectionId}. State: {webSocket.State}");

                if (receiveResult != null && receiveResult.CloseStatus.HasValue)
                {
                    Debug.WriteLine($"Closing WebSocket gracefully. Status: {receiveResult.CloseStatus.Value}");
                    await webSocket.CloseAsync(receiveResult.CloseStatus.Value, receiveResult.CloseStatusDescription, CancellationToken.None);
                }
                else if (webSocket.State == WebSocketState.Open || webSocket.State == WebSocketState.CloseReceived)
                {
                    Debug.WriteLine($"Closing WebSocket due to loop exit. Current State: {webSocket.State}");
                    await webSocket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "Server closing connection", CancellationToken.None);
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
                 // Consider disposing the WebSocket object if not done automatically
                 // webSocket.Dispose(); 
            }
        }

        private async Task StartGeneratingGames(string connectionId, WebSocket webSocket)
        {
            Debug.WriteLine($"Starting game generation for connection ID: {connectionId}");
            
            // Cancel any existing generation task
            if (_generationTasks.TryRemove(connectionId, out var existingCts))
            {
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
                            Action = "newGame",
                            Data = gameJson
                        };
                        var messageJson = JsonSerializer.Serialize(message);
                        var messageBytes = Encoding.UTF8.GetBytes(messageJson);

                        if (_activeConnections.TryGetValue(connectionId, out var ws) && ws.State == WebSocketState.Open)
                        {
                            await ws.SendAsync(new ArraySegment<byte>(messageBytes), WebSocketMessageType.Text, true, linkedCts.Token);
                            Debug.WriteLine($"Sent new game to client: {addedGame.Name}");
                        }
                        else
                        {
                            Debug.WriteLine($"Could not send game to client - WebSocket not found or not open");
                        }

                        // Wait for a short time before generating the next game
                        await Task.Delay(1000, linkedCts.Token);
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
                }
            }, linkedCts.Token);

            // Send confirmation to the client
            var response = new WebSocketMessage
            {
                Action = "started",
                Data = "Game generation started"
            };
            var responseJson = JsonSerializer.Serialize(response);
            var responseBytes = Encoding.UTF8.GetBytes(responseJson);
            await webSocket.SendAsync(new ArraySegment<byte>(responseBytes), WebSocketMessageType.Text, true, CancellationToken.None);
            Debug.WriteLine($"Sent start confirmation to client for connection ID: {connectionId}");
        }

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
                        Action = "stopped",
                        Data = "Game generation stopped"
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

        private async Task HandlePing(string connectionId, WebSocket webSocket)
        {
            Debug.WriteLine($"Ping received from connection ID: {connectionId}");
            
            if (webSocket.State == WebSocketState.Open)
            {
                try
                {
                    var response = new WebSocketMessage
                    {
                        Action = "pong",
                        Data = "Server is alive"
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
        public string Action { get; set; } = "DefAction";
        public string Data { get; set; } = "DefData";
    }

    public class WebSocketMessage
    {
        public string Action { get; set; } = "DefAction";
        public string Data { get; set; } = "DefData";
    }
}
