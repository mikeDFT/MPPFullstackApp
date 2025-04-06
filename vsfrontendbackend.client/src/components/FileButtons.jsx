import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

export function FileButtons() {
    const [isConnected, setIsConnected] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [canDownload, setCanDownload] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [receivedFile, setReceivedFile] = useState(null);

    // check if file exists on server
    useEffect(() => {
        const checkFileExists = async () => {
            try {
                const exists = await apiService.checkFileExists();
                setCanDownload(exists);
            } catch (error) {
                console.error('Error checking if file exists:', error);
            }
        };

        checkFileExists();
    }, []);

    // Function to handle file selection
    function handleSelectFile() {
        // create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '*/*'; // accept all file types
        
        // handle file selection
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            console.log('File selected:', file);
            
            // check file size (600MB limit)
            const maxSize = 600 * 1024 * 1024; // 600MB in bytes
            if (file.size > maxSize) {
                setError(`File size exceeds the maximum allowed size of 600MB`);
                return;
            }
            
            setError(null);
            setSelectedFile(file);
        };
        
        // trigger file selection dialog
        fileInput.click();
    }

    // Function to send file to server
    async function handleSendToServer() {
        if (!selectedFile) {
            setError('No file selected. Please select a file first.');
            return;
        }
        
        setError(null);
        setIsGenerating(true);
        setUploadProgress(0);
        
        try {
            // upload the file
            await apiService.uploadFile(selectedFile);
            setUploadProgress(100);
            setCanDownload(true);
        } catch (error) {
            setError(`Upload failed: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    }

    // Function to receive file from server
    async function handleReceiveFromServer() {
        if (!canDownload) {
            setError('No file available on server to receive.');
            return;
        }
        
        setError(null);
        setDownloadProgress(0);
        
        try {
            // download the file
            const { blob, filename, contentType } = await apiService.downloadFile();
            setDownloadProgress(100);
            
            // Create a file object from the blob with the original filename and content type
            const file = new File([blob], filename, { type: contentType });
            setReceivedFile(file);
            
            console.log('File received from server:', file);
            console.log('File name:', file.name);
            console.log('File type:', file.type);
            console.log('File size:', file.size);
        } catch (error) {
            setError(`Download failed: ${error.message}`);
        }
    }

    // Function to download file from frontend
    function handleDownloadFromFrontend() {
        if (!receivedFile) {
            setError('No file received from server. Please receive a file first.');
            return;
        }
        
        try {
            // create a download link
            const url = window.URL.createObjectURL(receivedFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = receivedFile.name;
            document.body.appendChild(a);
            a.click();
            
            // clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            setError(`Download failed: ${error.message}`);
        }
    }

    return (
    <div>
        {error && (
            <div style={{ 
                color: 'red', 
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#ffeeee',
                borderRadius: '4px'
            }}>
                {error}
            </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
            <button
                onClick={handleSelectFile}
                disabled={!isConnected || isGenerating}
                style={{
                    width: "100%",
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: isConnected && !isGenerating ? 'pointer' : 'not-allowed',
                    backgroundColor: isConnected 
                        ? (isGenerating ? '#ff4444' : '#4CAF50') 
                        : (retryCount >= 5 ? '#999999' : '#cccccc'),
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s'
                }}
            >
                {selectedFile ? `File selected: ${selectedFile.name}` : 'Select file'}
            </button>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
            <button
                onClick={handleSendToServer}
                disabled={!isConnected || isGenerating || !selectedFile}
                style={{
                    width: "100%",
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: isConnected && !isGenerating && selectedFile ? 'pointer' : 'not-allowed',
                    backgroundColor: isConnected && selectedFile
                        ? (isGenerating ? '#ff4444' : '#4CAF50') 
                        : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s'
                }}
            >
                {isGenerating ? 'Sending...' : 'Send to server'}
            </button>
            {uploadProgress > 0 && uploadProgress < 100 && (
                <div style={{ 
                    marginTop: '5px',
                    height: '5px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        width: `${uploadProgress}%`,
                        height: '100%',
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.3s'
                    }}></div>
                </div>
            )}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
            <button
                onClick={handleReceiveFromServer}
                disabled={!canDownload}
                style={{
                    width: "100%",
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: canDownload ? 'pointer' : 'not-allowed',
                    backgroundColor: canDownload ? '#4CAF50' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s'
                }}
            >
                {downloadProgress > 0 && downloadProgress < 100 ? 'Receiving...' : 'Receive from server'}
            </button>
            {downloadProgress > 0 && downloadProgress < 100 && (
                <div style={{ 
                    marginTop: '5px',
                    height: '5px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '3px',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        width: `${downloadProgress}%`,
                        height: '100%',
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.3s'
                    }}></div>
                </div>
            )}
        </div>
        
        <div>
            <button
                onClick={handleDownloadFromFrontend}
                disabled={!receivedFile}
                style={{
                    width: "100%",
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: receivedFile ? 'pointer' : 'not-allowed',
                    backgroundColor: receivedFile ? '#4CAF50' : '#cccccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s'
                }}
            >
                {receivedFile ? `Download: ${receivedFile.name}` : 'Download file'}
            </button>
        </div>
    </div>
    );
}