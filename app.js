// ========================================
// Cittato - Advanced Video Chat Application (FIXED)
// ========================================

class CIttatoApp {
    constructor() {
        this.username = '';
        this.userId = null;
        this.socket = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.currentCallUser = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isSharingScreen = false;
        this.unreadMessages = 0;
        this.incomingCallData = null;
        
        // WebRTC Configuration with public STUN servers
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
            ]
        };
        
        this.init();
    }
    
    // ========================================
    // Initialization
    // ========================================
    init() {
        this.setupEventListeners();
        this.hideLoadingScreen();
    }
    
    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1500);
    }
    
    setupEventListeners() {
        // Login
        document.getElementById('joinBtn').addEventListener('click', () => this.login());
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        // Header controls
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Video controls
        document.getElementById('toggleVideo').addEventListener('click', () => this.toggleVideo());
        document.getElementById('toggleAudio').addEventListener('click', () => this.toggleAudio());
        document.getElementById('shareScreen').addEventListener('click', () => this.shareScreen());
        document.getElementById('endCall').addEventListener('click', () => this.endCall());
        
        // Chat controls
        document.getElementById('toggleChat').addEventListener('click', () => this.toggleChat());
        document.getElementById('closeChatBtn').addEventListener('click', () => this.toggleChat());
        document.getElementById('sendMessage').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        
        // Settings modal
        document.getElementById('toggleSettings').addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        
        // Connection modal
        document.getElementById('acceptCall').addEventListener('click', () => this.acceptCall());
        document.getElementById('rejectCall').addEventListener('click', () => this.rejectCall());
        
        // PIP toggle
        document.getElementById('pipToggle').addEventListener('click', () => this.togglePIP());
    }
    
    // ========================================
    // Authentication
    // ========================================
    async login() {
        const username = document.getElementById('usernameInput').value.trim();
        
        if (!username) {
            this.showNotification('Please enter your name', 'warning');
            return;
        }
        
        this.username = username;
        this.userId = this.generateId();
        
        // Request media permissions first
        await this.initializeMedia();
        
        // Initialize REAL socket connection
        this.initializeSocket();
        
        // Show main app
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('currentUsername').textContent = this.username;
        
        this.showNotification('Welcome to Cittato!', 'success');
    }
    
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            this.cleanup();
            window.location.reload();
        }
    }
    
    // ========================================
    // Socket Connection (FIXED - Real Socket.IO)
    // ========================================
    initializeSocket() {
        // Connect to actual Socket.IO server
        this.socket = io(window.location.origin);
        
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            
            // Notify server about user connection
            this.socket.emit('user-connected', {
                userId: this.userId,
                username: this.username
            });
            
            this.updateConnectionStatus('connected');
            this.showNotification('Connected to server', 'success');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.updateConnectionStatus('disconnected');
            this.showNotification('Disconnected from server', 'error');
        });
        
        // Handle users list updates
        this.socket.on('users-list', (users) => {
            console.log('Users list updated:', users);
            this.updateUsersList(users);
        });
        
        // Handle new user joined
        this.socket.on('user-joined', (user) => {
            console.log('User joined:', user);
            this.showNotification(`${user.username} joined`, 'info');
        });
        
        // Handle user left
        this.socket.on('user-left', (user) => {
            console.log('User left:', user);
            this.showNotification(`${user.username} left`, 'info');
            
            // If we were in call with this user, end the call
            if (this.currentCallUser && this.currentCallUser.id === user.userId) {
                this.endCall();
            }
        });
        
        // Handle incoming call
        this.socket.on('incoming-call', async (data) => {
            console.log('Incoming call from:', data.username);
            
            this.incomingCallData = data;
            this.currentCallUser = { id: data.from, name: data.username };
            
            // Show incoming call modal
            document.getElementById('callerName').textContent = data.username;
            document.getElementById('connectionModal').classList.remove('hidden');
            
            // Create peer connection and set remote description
            await this.createPeerConnection(data.from);
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        });
        
        // Handle call answered
        this.socket.on('call-answered', async (data) => {
            console.log('Call answered');
            
            if (this.peerConnection) {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                this.showNotification('Call connected', 'success');
            }
        });
        
        // Handle ICE candidates
        this.socket.on('ice-candidate', async (data) => {
            console.log('Received ICE candidate');
            
            if (this.peerConnection && data.candidate) {
                try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        });
        
        // Handle call rejected
        this.socket.on('call-rejected', () => {
            this.showNotification('Call was rejected', 'warning');
            this.endCall();
        });
        
        // Handle call ended
        this.socket.on('call-ended', () => {
            this.showNotification('Call ended by remote user', 'info');
            this.endCall();
        });
        
        // Handle chat messages
        this.socket.on('message', (data) => {
            console.log('Message received:', data);
            this.addMessage(data.message, 'received', data.username, data.timestamp);
        });
        
        // Handle call errors
        this.socket.on('call-error', (data) => {
            this.showNotification(data.message, 'error');
        });
    }
    
    // ========================================
    // Media Initialization
    // ========================================
    async initializeMedia() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = this.localStream;
            
            // Populate device selectors
            await this.populateDeviceSelectors();
            
            this.showNotification('Camera and microphone ready', 'success');
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.showNotification('Could not access camera/microphone. Please grant permissions.', 'error');
            throw error;
        }
    }
    
    async populateDeviceSelectors() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            const cameraSelect = document.getElementById('cameraSelect');
            const micSelect = document.getElementById('micSelect');
            const speakerSelect = document.getElementById('speakerSelect');
            
            // Clear existing options
            cameraSelect.innerHTML = '';
            micSelect.innerHTML = '';
            speakerSelect.innerHTML = '';
            
            devices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `${device.kind} ${index + 1}`;
                
                if (device.kind === 'videoinput') {
                    cameraSelect.appendChild(option);
                } else if (device.kind === 'audioinput') {
                    micSelect.appendChild(option);
                } else if (device.kind === 'audiooutput') {
                    speakerSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error enumerating devices:', error);
        }
    }
    
    // ========================================
    // WebRTC Connection (FIXED)
    // ========================================
    async createPeerConnection(userId) {
        try {
            this.peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Add local stream tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
            
            // Handle incoming tracks
            this.peerConnection.ontrack = (event) => {
                console.log('Received remote track');
                if (event.streams && event.streams[0]) {
                    this.remoteStream = event.streams[0];
                    const remoteVideo = document.getElementById('remoteVideo');
                    remoteVideo.srcObject = this.remoteStream;
                    
                    // Hide placeholder
                    document.getElementById('noVideoPlaceholder').style.display = 'none';
                }
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    this.socket.emit('ice-candidate', {
                        to: userId,
                        candidate: event.candidate
                    });
                }
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                this.updateConnectionStatus(this.peerConnection.connectionState);
                
                if (this.peerConnection.connectionState === 'disconnected' || 
                    this.peerConnection.connectionState === 'failed') {
                    this.showNotification('Connection lost', 'error');
                }
            };
            
            // Handle ICE connection state
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.peerConnection.iceConnectionState);
            };
            
        } catch (error) {
            console.error('Error creating peer connection:', error);
            this.showNotification('Failed to create peer connection', 'error');
        }
    }
    
    async callUser(userId, username) {
        try {
            this.currentCallUser = { id: userId, name: username };
            
            await this.createPeerConnection(userId);
            
            // Create offer
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            await this.peerConnection.setLocalDescription(offer);
            
            // Send offer to server
            this.socket.emit('offer', {
                to: userId,
                offer: offer,
                from: this.userId,
                username: this.username
            });
            
            // Update UI
            document.getElementById('remoteUsername').textContent = username;
            this.showNotification(`Calling ${username}...`, 'info');
            
        } catch (error) {
            console.error('Error calling user:', error);
            this.showNotification('Failed to initiate call', 'error');
        }
    }
    
    async acceptCall() {
        try {
            document.getElementById('connectionModal').classList.add('hidden');
            
            // Create answer
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            // Send answer to server
            this.socket.emit('answer', {
                to: this.currentCallUser.id,
                answer: answer
            });
            
            // Update UI
            document.getElementById('remoteUsername').textContent = this.currentCallUser.name;
            
            this.showNotification('Call accepted', 'success');
            
        } catch (error) {
            console.error('Error accepting call:', error);
            this.showNotification('Failed to accept call', 'error');
        }
    }
    
    rejectCall() {
        document.getElementById('connectionModal').classList.add('hidden');
        
        if (this.currentCallUser) {
            this.socket.emit('call-rejected', {
                to: this.currentCallUser.id
            });
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        this.showNotification('Call rejected', 'info');
        this.currentCallUser = null;
        this.incomingCallData = null;
    }
    
    endCall() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
            this.remoteStream = null;
        }
        
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = null;
        
        document.getElementById('noVideoPlaceholder').style.display = 'flex';
        document.getElementById('remoteUsername').textContent = 'Waiting for connection...';
        
        if (this.currentCallUser) {
            this.socket.emit('call-ended', {
                to: this.currentCallUser.id
            });
        }
        
        this.currentCallUser = null;
        this.showNotification('Call ended', 'info');
    }
    
    // ========================================
    // Media Controls
    // ========================================
    toggleVideo() {
        if (this.localStream) {
            this.isVideoEnabled = !this.isVideoEnabled;
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = this.isVideoEnabled;
            });
            
            const btn = document.getElementById('toggleVideo');
            if (this.isVideoEnabled) {
                btn.classList.remove('disabled');
                btn.querySelector('i').classList.remove('fa-video-slash');
                btn.querySelector('i').classList.add('fa-video');
            } else {
                btn.classList.add('disabled');
                btn.querySelector('i').classList.remove('fa-video');
                btn.querySelector('i').classList.add('fa-video-slash');
            }
            
            this.showNotification(
                this.isVideoEnabled ? 'Video enabled' : 'Video disabled',
                'info'
            );
        }
    }
    
    toggleAudio() {
        if (this.localStream) {
            this.isAudioEnabled = !this.isAudioEnabled;
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = this.isAudioEnabled;
            });
            
            const btn = document.getElementById('toggleAudio');
            if (this.isAudioEnabled) {
                btn.classList.remove('disabled');
                btn.querySelector('i').classList.remove('fa-microphone-slash');
                btn.querySelector('i').classList.add('fa-microphone');
            } else {
                btn.classList.add('disabled');
                btn.querySelector('i').classList.remove('fa-microphone');
                btn.querySelector('i').classList.add('fa-microphone-slash');
            }
            
            this.showNotification(
                this.isAudioEnabled ? 'Microphone enabled' : 'Microphone muted',
                'info'
            );
        }
    }
    
    async shareScreen() {
        try {
            if (!this.isSharingScreen) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: 'always' },
                    audio: false
                });
                
                // Replace video track in peer connection
                const videoTrack = screenStream.getVideoTracks()[0];
                
                if (this.peerConnection) {
                    const sender = this.peerConnection.getSenders().find(s => 
                        s.track && s.track.kind === 'video'
                    );
                    
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                }
                
                // Update local video
                const localVideo = document.getElementById('localVideo');
                localVideo.srcObject = screenStream;
                
                this.isSharingScreen = true;
                
                // Handle screen share stop
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
                
                const btn = document.getElementById('shareScreen');
                btn.classList.add('active');
                
                this.showNotification('Screen sharing started', 'success');
                
            } else {
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error sharing screen:', error);
            this.showNotification('Could not share screen', 'error');
        }
    }
    
    stopScreenShare() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            
            if (this.peerConnection) {
                const sender = this.peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            }
            
            const localVideo = document.getElementById('localVideo');
            localVideo.srcObject = this.localStream;
        }
        
        this.isSharingScreen = false;
        
        const btn = document.getElementById('shareScreen');
        btn.classList.remove('active');
        
        this.showNotification('Screen sharing stopped', 'info');
    }
    
    async togglePIP() {
        try {
            const localVideo = document.getElementById('localVideo');
            
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await localVideo.requestPictureInPicture();
            }
        } catch (error) {
            console.error('PIP error:', error);
            this.showNotification('Picture-in-Picture not supported', 'warning');
        }
    }
    
    // ========================================
    // Chat Functions
    // ========================================
    toggleChat() {
        const chatPanel = document.getElementById('chatPanel');
        const chatBadge = document.getElementById('chatBadge');
        
        chatPanel.classList.toggle('hidden');
        
        if (!chatPanel.classList.contains('hidden')) {
            this.unreadMessages = 0;
            chatBadge.classList.add('hidden');
            chatBadge.textContent = '0';
            document.getElementById('chatInput').focus();
        }
    }
    
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.currentCallUser) {
            this.socket.emit('message', {
                to: this.currentCallUser.id,
                message: message,
                from: this.userId,
                username: this.username,
                timestamp: new Date().toISOString()
            });
            
            this.addMessage(message, 'sent', this.username);
            input.value = '';
        } else if (!this.currentCallUser) {
            this.showNotification('No active call to send message', 'warning');
        }
    }
    
    addMessage(message, type, sender, time) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const now = time ? new Date(time) : new Date();
        const timeStr = now.toLocaleTimeString();
        
        messageDiv.innerHTML = `
            ${type === 'received' ? `<div class="message-sender">${sender}</div>` : ''}
            <div>${message}</div>
            <div class="message-time">${timeStr}</div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Update badge if chat is hidden
        const chatPanel = document.getElementById('chatPanel');
        if (chatPanel.classList.contains('hidden') && type === 'received') {
            this.unreadMessages++;
            const badge = document.getElementById('chatBadge');
            badge.textContent = this.unreadMessages;
            badge.classList.remove('hidden');
        }
    }
    
    // ========================================
    // UI Functions
    // ========================================
    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        const onlineCount = document.getElementById('onlineCount');
        
        // Filter out current user
        const otherUsers = users.filter(user => user.userId !== this.userId);
        
        onlineCount.textContent = otherUsers.length;
        
        if (otherUsers.length === 0) {
            usersList.innerHTML = `
                <div class="no-users">
                    <i class="fas fa-user-friends"></i>
                    <p>Waiting for users...</p>
                </div>
            `;
            return;
        }
        
        usersList.innerHTML = '';
        
        otherUsers.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <div class="user-details">
                    <div class="user-name">${user.username}</div>
                    <div class="user-status">
                        <span class="status-dot"></span>
                        ${user.status}
                    </div>
                </div>
                <button class="call-btn" title="Call ${user.username}">
                    <i class="fas fa-phone"></i>
                </button>
            `;
            
            userItem.querySelector('.call-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.callUser(user.userId, user.username);
            });
            
            usersList.appendChild(userItem);
        });
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }
    
    updateConnectionStatus(state) {
        const statusEl = document.getElementById('connectionStatus');
        const statusIcon = statusEl.querySelector('i');
        const statusText = statusEl.querySelector('span');
        
        switch(state) {
            case 'connected':
                statusIcon.style.color = 'var(--secondary-color)';
                statusText.textContent = 'Connected';
                break;
            case 'connecting':
                statusIcon.style.color = 'var(--warning-color)';
                statusText.textContent = 'Connecting...';
                break;
            case 'disconnected':
            case 'failed':
                statusIcon.style.color = 'var(--danger-color)';
                statusText.textContent = 'Disconnected';
                break;
        }
    }
    
    // ========================================
    // Settings
    // ========================================
    openSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    }
    
    closeSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }
    
    async saveSettings() {
        const videoQuality = document.getElementById('videoQuality').value;
        const cameraId = document.getElementById('cameraSelect').value;
        const micId = document.getElementById('micSelect').value;
        const theme = document.getElementById('themeSelect').value;
        
        // Apply video quality
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            const constraints = this.getVideoConstraints(videoQuality);
            
            try {
                await videoTrack.applyConstraints(constraints);
            } catch (error) {
                console.error('Error applying constraints:', error);
            }
        }
        
        // Apply theme
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        
        // Save to localStorage
        localStorage.setItem('cittato-settings', JSON.stringify({
            videoQuality,
            cameraId,
            micId,
            theme
        }));
        
        this.closeSettings();
        this.showNotification('Settings saved successfully', 'success');
    }
    
    getVideoConstraints(quality) {
        const constraints = {
            low: { width: 640, height: 360 },
            medium: { width: 854, height: 480 },
            high: { width: 1280, height: 720 },
            hd: { width: 1920, height: 1080 }
        };
        
        return constraints[quality] || constraints.high;
    }
    
    // ========================================
    // Utility Functions
    // ========================================
    generateId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    showNotification(message, type = 'info') {
        const toast = document.getElementById('notificationToast');
        const messageEl = document.getElementById('notificationMessage');
        const icon = toast.querySelector('i');
        
        messageEl.textContent = message;
        
        // Update icon based on type
        icon.className = 'fas fa-' + (
            type === 'success' ? 'check-circle' :
            type === 'error' ? 'exclamation-circle' :
            type === 'warning' ? 'exclamation-triangle' :
            'info-circle'
        );
        
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('user-disconnected', {
                userId: this.userId
            });
            this.socket.disconnect();
        }
    }
}

// ========================================
// Initialize Application
// ========================================
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new CIttatoApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});