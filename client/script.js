(async () => {
  const myUser = await generateRandomUser();
  let activeUsers = [];
  let typingUsers = [];

  const socket = new WebSocket(generateBackendUrl());
  socket.addEventListener('open', () => {
    console.log('WebSocket connected!');
    socket.send(JSON.stringify({ type: 'newUser', user: myUser }));
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    console.log('WebSocket message:', message);
    switch (message.type) {
      case 'message':
        const messageElement = generateMessage(message, myUser);
        document.getElementById('messages').appendChild(messageElement);
        setTimeout(() => {
          messageElement.classList.add('opacity-100');
        }, 100);
        break;
      case 'activeUsers':
        activeUsers = message.users;
          
        // Update count
        document.getElementById('activeUsersCount').textContent = activeUsers.length;
        
        // Update list of online users
        const userList = document.getElementById('activeUsersList');
        userList.innerHTML = ''; // Clear previous list
        activeUsers.forEach(user => {
          const listItem = document.createElement('li');
          listItem.textContent = user.name;
          userList.appendChild(listItem);
        });
        break;               
      case 'typing':
        typingUsers = message.users;
        updateTypingStatus();
        break;
      default:
        break;
    }
  });
  socket.addEventListener('close', (event) => {
    console.log('WebSocket closed.');
  });
  socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });

  // Wait until the DOM is loaded before adding event listeners
  document.addEventListener('DOMContentLoaded', (event) => {
    // Send a message when the send button is clicked
    document.getElementById('sendButton').addEventListener('click', () => {
      const message = document.getElementById('messageInput').value;
      socket.send(JSON.stringify({ type: 'message', message, user: myUser }));
      document.getElementById('messageInput').value = '';
    });
  });

  document.addEventListener('keydown', (event) => {
    // Only send if the typed in key is not a modifier key
    if (event.key.length === 1) {
      socket.send(JSON.stringify({ type: 'typing', user: myUser }));
    }
    // Only send if the typed in key is the enter key
    if (event.key === 'Enter') {
      const message = document.getElementById('messageInput').value;
      socket.send(JSON.stringify({ type: 'message', message, user: myUser }));
      document.getElementById('messageInput').value = '';
    }
  });

  function updateTypingStatus() {
    const typingStatusElement = document.getElementById('typingStatus'); // Get the typing status

    // Remove my user from the list of typing users
    const otherTypingUsers = typingUsers.filter((user) => user.id !== myUser.id);

    // Update the typing status
    if (otherTypingUsers.length > 0) {
      const names = otherTypingUsers.map((user) => user.name).join(', ');
      typingStatusElement.innerText = `${names} is writing...`;
      typingStatusElement.style.display = 'block';
    } else {
      typingStatusElement.style.display = 'none';
    }
  }
})();
